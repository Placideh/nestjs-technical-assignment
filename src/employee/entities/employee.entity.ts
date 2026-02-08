import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    BeforeInsert,
  } from 'typeorm';
  import { Exclude } from 'class-transformer';
import { Attendance } from '../../attendance/entities/attendance.entity';
  
  @Entity('employees')
  export class Employee {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    @Exclude() 
    password: string;
  
    @Column({ name: 'names' })
    names: string;
  
  
    @Column({ name: 'phone_number' })
    phoneNumber: string;
  
    @Column({ name: 'employee_identifier', unique: true })
    employeeId: string;
  
    
    @Column({ name: 'reset_token', nullable: true })
    @Exclude()
    resetToken: string;
  
    @Column({ name: 'reset_token_expiry', type: 'datetime', nullable: true })
    @Exclude()
    resetTokenExpiry: Date;
  
    @OneToMany(() => Attendance, (attendance) => attendance.employee)
    attendances: Attendance[];
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

  }