import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from '../service/reports.service';
import { ReportsController } from './reports.controller';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Employee } from '../../employee/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Employee])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}