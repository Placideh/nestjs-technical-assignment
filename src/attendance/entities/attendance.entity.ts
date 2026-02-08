import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    BaseEntity,
} from 'typeorm';

import { Employee } from '../../employee/entities/employee.entity';
import { AttendanceStatus } from '../../config/constant';


@Entity('attendances')
export class Attendance extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;


    @ManyToOne(() => Employee, (employee) => employee.attendances, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ name: 'entry_time', type: 'datetime' })
    entry: Date;

    @Column({ name: 'depart_time', type: 'datetime', nullable: true })
    depart: Date;

    @Column({ type: 'date' })
    date: string; // Format: YYYY-MM-DD

    @Column({ name: 'active_hours', type: 'decimal', nullable: true })
    activeHours: number;


    @Column({
        type: 'enum',
        enum: AttendanceStatus,
        default: AttendanceStatus.ONTIME,
    })
    status: AttendanceStatus;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}