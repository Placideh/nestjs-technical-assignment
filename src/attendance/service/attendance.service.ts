import {
    Injectable,
    NotFoundException,
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

    
    async recordAttendance(attendance: AttendanceDto): Promise<Attendance> {
        
        const existingEmployee = await this.findEmployee(attendance.employeeIdentifier);

        if (!existingEmployee) throw new NotFoundException(`Employee with ID ${attendance.employeeIdentifier} Not found`);


        // get current time and date
        const now = new Date();
        const today = this.formatDate(now);

        // check if employee has a record for today
        const existingRecord = await this.attendanceRepository.findOne({
            where: {
                employee: existingEmployee,
                date: today,
            },
        });

        let newAttendance: Attendance;

        // if record exists, update departure time
        if (existingRecord) {
            newAttendance = await this.updateDeparture(existingRecord, now, attendance.comment);
        } else {
            // if no record, create new arrival record
            newAttendance = await this.createArrival(existingEmployee.id, now, attendance.comment);
        }

        // if no record, create new arrival record and initial an email for attendance
        await this.sendAttendanceEmail(existingEmployee, newAttendance);
        return this.createArrival(existingEmployee.id, now, attendance.comment);
    }

  
    // handle attencance via a queue
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
            console.error('Failed to queue attendance email:', error);
        }
    }


    private async findEmployee(identifier: string): Promise<Employee | null> {
        if (identifier.includes('@')) {
            return this.employeeRepository.findOne({
                where: { email: identifier },
            });
        }
    
        return this.employeeRepository.findOne({
            where: { employeeId: identifier },
        });
    }


    private async createArrival(
        employeeId: string,
        arrivalTime: Date,
        comment?: string,
    ): Promise<Attendance> {

        const existingEmployee = await this.findEmployee(employeeId);

        if (!existingEmployee) throw new NotFoundException(`Employee with Id ${employeeId} Not found`);

        const today = this.formatDate(arrivalTime);

        // check if employee is late
        const expectedArrival = this.parseTime(
            today,
            ATTENDANCE_CONSTANTS.ARRIVAL_TIME,
        );
        const isLate = arrivalTime > expectedArrival;

        // record the attendance
        const attendance = await this.attendanceRepository.save({
            employee: existingEmployee,
            clockIn: arrivalTime,
            clockOut: arrivalTime, 
            date: today,
            status: isLate ? AttendanceStatus.LATE : AttendanceStatus.ONTIME,
            activeHours: 0, 
            comment: comment || 'N/A',
        });
        return attendance;
    }


    private async updateDeparture(
        record: Attendance,
        departureTime: Date,
        comment?: string,
    ): Promise<Attendance> {
       
        record.depart = departureTime;

        const activeHours = this.calculateActiveHours(
            record.entry,
            departureTime,
        );
        record.activeHours = activeHours;

        if (activeHours < ATTENDANCE_CONSTANTS.STANDARD_WORK_HOURS) {
            record.status = AttendanceStatus.PRETIME; // Left early
        } else if (activeHours > ATTENDANCE_CONSTANTS.STANDARD_WORK_HOURS) {
            record.status = AttendanceStatus.OVERTIME; // Worked overtime
        }else {
            record.status = AttendanceStatus.LATE;
        }
        
       // set the comment if provided
        if (comment) {
            record.comment = comment;
        }

        return await this.attendanceRepository.save(record);
    }


    private calculateActiveHours(start: Date, end: Date): number {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
    }


    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }


    private parseTime(dateStr: string, timeStr: string): Date {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date(dateStr);
        date.setHours(hours, minutes, 0, 0);
        return date;
    }


    async getEmployeeAttendance(employeeId: string): Promise<Attendance[]> {

        const employee = await this.findEmployee(employeeId);

        if (!employee) throw new NotFoundException(`Employee  with ID: ${employeeId} Not found`);

        return this.attendanceRepository.find({
            where: { employee },
            order: { date: 'DESC' },
        });
    }


    async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
        const today = this.formatDate(new Date());
        const employee = await this.findEmployee(employeeId);

        if (!employee) throw new NotFoundException(`Employee with ID: ${employeeId} Not Found `);

        return this.attendanceRepository.findOne({
            where: {
                employee,
                date: today,
            },
        });
    }
}