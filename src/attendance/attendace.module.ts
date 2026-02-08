import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmployeeModule } from "../employee/employee.module";
import { MailModule } from "../mail/mail.module";
import { AttendanceController } from "./controller/attendance.controller";
import { AttendanceService } from "./service/attendance.service";
import { Attendance } from "./entities/attendance.entity";



@Module({
    imports: [
        TypeOrmModule.forFeature([Attendance]), 
        EmployeeModule,
        MailModule
      ],
    providers:[AttendanceService],
    controllers:[AttendanceController],
    exports:[AttendanceService, TypeOrmModule]
})
export class AttendanceModule{}