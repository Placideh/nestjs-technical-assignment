import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from '../entities/attendance.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { AttendanceDto } from '../dto/attendance.dto';
import {
    ATTENDANCE_CONSTANTS,
    AttendanceStatus,
} from '../../config/constant';
import { MailService } from '../../mail/service/mail.service';

@Injectable()
export class AttendanceService {
    constructor(
        @InjectRepository(Attendance)
        private readonly attendanceRepository: Repository<Attendance>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        private readonly mailService: MailService,
    ) { }

    /**
     * Record attendance (handles both arrival and departure)
     * @throws Error if employee not found
     */
    async recordAttendance(attendance: AttendanceDto): Promise<Attendance> {
        // Step 1: Find employee by email or employee identifier
        const existingEmployee = await this.findEmployee(attendance.employeeIdentifier);

        if (!existingEmployee) throw new NotFoundException('EMPLOYEE_NOT_FOUND');


        // Step 2: Get current time and date
        const now = new Date();
        const today = this.formatDate(now);

        // Step 3: Check if employee has a record for today
        const existingRecord = await this.attendanceRepository.findOne({
            where: {
                employee: existingEmployee,
                date: today,
            },
        });

        let newAttendance: Attendance;

        // Step 4: If record exists, update departure time
        if (existingRecord) {
            newAttendance = await this.updateDeparture(existingRecord, now, attendance.comment);
          } else {
            // Step 5: If no record, create new arrival record
            newAttendance = await this.createArrival(existingEmployee.id, now, attendance.comment);
          }

        // Step 5: If no record, create new arrival record
          // Step 6: Send email notification (queued)
        await this.sendAttendanceEmail(existingEmployee, newAttendance);
        return this.createArrival(existingEmployee.id, now, attendance.comment);
    }

    /**
   * Send attendance notification email via queue
   */
  private async sendAttendanceEmail(
    employee: Employee,
    attendance: Attendance,
  ): Promise<void> {
    try {
      await this.mailService.sendAttendanceNotification({
        employeeEmail: employee.email,
        employeeName: `${employee.names}`,
        date: attendance.date,
        clockIn: attendance.entry.toLocaleTimeString(),
        clockOut: attendance.depart.toLocaleTimeString(),
        activeHours: attendance.activeHours || 0,
        status: attendance.status,
      });
    } catch (error) {
      // Log error but don't fail the attendance recording
      console.error('Failed to queue attendance email:', error);
    }
  }

    /**
     * Find employee by email or employee identifier
     */
    private async findEmployee(identifier: string): Promise<Employee> {
        // Try to find by email first




        // if(identifier) contains @ sign it then query by email or employee Id

        // create a  field named that detect which value to use

        // const isEmail= true;


        // const object = isEmail ?  { email : identifier} : { identifier : identifier }
        let existingEmployee = await this.employeeRepository.findOne({
            where: { email: identifier },
        });

        if (!existingEmployee) throw new NotFoundException('EMPLOYEE_NOT_FOUND');





        // If not found, try by employee identifier


        return existingEmployee;
    }

    /**
     * Create new arrival record
     */
    private async createArrival(
        employeeId: string,
        arrivalTime: Date,
        comment?: string,
    ): Promise<Attendance> {

        const existingEmployee = await this.findEmployee(employeeId);

        if (!existingEmployee) throw new NotFoundException('EMPLOYEE_NOT_FOUND');

        const today = this.formatDate(arrivalTime);

        // Check if employee is late
        const expectedArrival = this.parseTime(
            today,
            ATTENDANCE_CONSTANTS.ARRIVAL_TIME,
        );
        const isLate = arrivalTime > expectedArrival;

        // Create attendance record
        const attendance = await this.attendanceRepository.save({
            employee: existingEmployee,
            clockIn: arrivalTime,
            clockOut: arrivalTime, // Set initial clock out to arrival time
            date: today,
            status: isLate ? AttendanceStatus.LATE : AttendanceStatus.ONTIME,
            activeHours: 0, // Will be calculated on departure
            comment: comment || 'N/A',
        });
        return attendance;
    }

    /**
     * Update departure time and calculate active hours
     */
    private async updateDeparture(
        record: Attendance,
        departureTime: Date,
        comment?: string,
    ): Promise<Attendance> {
        // Update departure time
        record.depart = departureTime;

        // Calculate active hours (difference in hours)
        const activeHours = this.calculateActiveHours(
            record.entry,
            departureTime,
        );
        record.activeHours = activeHours;

        // Determine status based on active hours
        if (activeHours < ATTENDANCE_CONSTANTS.STANDARD_WORK_HOURS) {
            record.status = AttendanceStatus.PRETIME; // Left early
        } else if (activeHours > ATTENDANCE_CONSTANTS.STANDARD_WORK_HOURS) {
            record.status = AttendanceStatus.OVERTIME; // Worked overtime
        }
        // If exactly 8 hours and was on time, status remains ON_TIME
        // If was late, status remains LATE

        // Update comment if provided
        if (comment) {
            record.comment = comment;
        }

        return await this.attendanceRepository.save(record);
    }

    /**
     * Calculate active hours between two times
     */
    private calculateActiveHours(start: Date, end: Date): number {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Format date to YYYY-MM-DD
     */
    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * Parse time string (HH:MM) and combine with date
     */
    private parseTime(dateStr: string, timeStr: string): Date {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date(dateStr);
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    /**
     * Get attendance records for an employee
     */
    async getEmployeeAttendance(employeeId: string): Promise<Attendance[]> {

        const employee = await this.findEmployee(employeeId);

        if (!employee) throw new NotFoundException('EMPLOYEE_NOT_FOUND');

        return this.attendanceRepository.find({
            where: { employee },
            order: { date: 'DESC' },
        });
    }

    /**
     * Get today's attendance for an employee
     */
    async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
        const today = this.formatDate(new Date());
        const employee = await this.findEmployee(employeeId);

        if (!employee) throw new NotFoundException('EMPLOYEE_NOT_FOUND');

        return this.attendanceRepository.findOne({
            where: {
                employee,
                date: today,
            },
        });
    }
}