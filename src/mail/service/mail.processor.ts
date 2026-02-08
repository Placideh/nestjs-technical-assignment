import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import bull from 'bull';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

export interface AttendanceEmailData {
  employeeEmail: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  activeHours: number;
  status: string;
}

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly configService: ConfigService) {
    // Initialize SendGrid API key
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    sgMail.setApiKey(apiKey!);
  }

  @Process('attendance-notification')
  async handleAttendanceEmail(job: bull.Job<AttendanceEmailData>) {
    this.logger.log(`Processing attendance email for ${job.data.employeeEmail}`);

    const { employeeEmail, employeeName, date, clockIn, clockOut, activeHours, status } = job.data;

    // Build SendGrid message with template
    const msg = {
      from: {
        name: this.configService.get<string>('SENDGRID_FROM_NAME'),
        email: this.configService.get<string>('SENDGRID_FROM_EMAIL'),
      },
      reply_to: {
        name: this.configService.get<string>('SENDGRID_REPLY_TO_NAME'),
        email: this.configService.get<string>('SENDGRID_REPLY_TO_EMAIL'),
      },
      personalizations: [
        {
          to: [
            {
              name: employeeName,
              email: employeeEmail,
            },
          ],
          preheader: 'TimeConnect',
          dynamic_template_data: {
            subject: `${employeeEmail} Attendance Report`,
            title: 'Attendance Report',
            name: employeeName,
            message: `Please find the generated Attendance for ${date}`,
            date: date,
            clockIn: clockIn,
            clockOut: clockOut,
            activeHours: activeHours,
            status: status,
          },
        },
      ],
      template_id: this.configService.get<string>('SENDGRID_ATTENDANCE_TEMPLATE_ID'),
      attachments: [], // For future PDF/Excel reports
    };

    try {
      await this.sendNormalEmail(msg);
      this.logger.log(`✅ Attendance email sent to ${employeeEmail}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${employeeEmail}`, error);
      throw error; // Bull will retry based on job config
    }
  }

  /**
   * Send email with retry logic (refactored from your original code)
   */
  private async sendNormalEmail(data: any, retryCount: number = 0): Promise<void> {
    try {
      await sgMail.send(data);
      this.logger.log('Normal email sent');
    } catch (error) {
      const errorString = String(error);

      // Retry on socket hang up (max 3 retries)
      if (errorString.includes('socket hang up') && retryCount < 3) {
        this.logger.warn(`Socket hang up error, retrying... (attempt ${retryCount + 1}/3)`);
        await this.delay(2000); // Wait 2 seconds
        return this.sendNormalEmail(data, retryCount + 1);
      } else {
        this.logger.error('Normal email is not sent');
        this.logger.error(error);
        throw error;
      }
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}