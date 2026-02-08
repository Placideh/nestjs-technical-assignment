import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeeService } from './service/employee.service';
import { EmployeeController } from './controller/employee.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]), 
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService,TypeOrmModule],
})
export class EmployeeModule {}