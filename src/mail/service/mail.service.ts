import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import bull from 'bull';
import { AttendanceEmailData } from './mail.processor';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail')
    private readonly mailQueue: bull.Queue,
  ) {}

  /**
   * Queue attendance notification email
   */
  async sendAttendanceNotification(data: AttendanceEmailData): Promise<void> {
    await this.mailQueue.add('attendance-notification', data, {
      attempts: 3, // Retry up to 3 times
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 seconds delay
      },
      removeOnComplete: true, // Remove job from queue after completion
      removeOnFail: false, // Keep failed jobs for debugging
    });
  }
}