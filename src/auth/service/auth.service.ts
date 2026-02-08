import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Employee } from '../../employee/entities/employee.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgotPassword.dto';
import { ResetPasswordDto } from '../dto/resetPassword.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        private readonly jwtService: JwtService,
    ) { }


    async register(employeeDto: RegisterDto): Promise<Employee> {
        // Check if email already exists
        const existingEmployee = await this.employeeRepository.findOne({
            where: { email: employeeDto.email },
        });

        if (existingEmployee) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }

        // Check if employeeId already exists if provided
        if (employeeDto.employeeId) {
            const existingId = await this.employeeRepository.findOne({
                where: { employeeId: employeeDto.employeeId },
            });
            if (existingId) {
                throw new Error('EMPLOYEEID_ALREADY_EXISTS');
            }
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(employeeDto.password, 10);

        const employee = this.employeeRepository.create({
            ...employeeDto,
            password: hashedPassword,
        });

        return await this.employeeRepository.save(employee);
    }

    async login(loginDto: LoginDto) {
        // Find employee by email
        const existingEmployee = await this.employeeRepository.findOne({
            where: { email: loginDto.email },
        });

        if (!existingEmployee) {
            throw new Error('INVALID_CREDENTIALS');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            existingEmployee.password,
        );

        if (!isPasswordValid) {
            throw new Error('INVALID_CREDENTIALS');
        }

        // Generate JWT token
        const token = this.generateToken(existingEmployee.id, existingEmployee.email);

        // Remove password from response
        // delete employee.password;

        return {
            existingEmployee,
            accessToken: token,
        };
    }

  
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const existingEmployee = await this.employeeRepository.findOne({
            where: { email: forgotPasswordDto.email },
        });

        if (!existingEmployee) {
            // Don't reveal if email exists (security)
            return { message: 'If email exists, reset link has been sent' };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(resetToken, 10);

        // Save token with 1 hour expiry
        existingEmployee.resetToken = hashedToken;
        existingEmployee.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        await this.employeeRepository.save(existingEmployee);

        // TODO: Send reset email with token
        // For now, return token (in production, only send via email)
        return {
            message: 'If email exists, reset link has been sent',
            resetToken, // Remove this in production
        };
    }

  
    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        // Find employees with non-expired tokens
        const employees = await this.employeeRepository.find({
            where: {
                resetTokenExpiry: MoreThan(new Date()),
            },
        });

        // Find employee with matching token
        let employee: Employee | null = null;
        for (const emp of employees) {
            if (emp.resetToken) {
                const isValid = await bcrypt.compare(
                    resetPasswordDto.token,
                    emp.resetToken,
                );
                if (isValid) {
                    employee = emp;
                    break;
                }
            }
        }

        if (!employee) {
            throw new Error('INVALID_OR_EXPIRED_TOKEN');
        }

        // Hash new password
        employee.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);

        // Clear reset token
        employee.resetToken = "";
        employee.resetTokenExpiry = new Date();

        await this.employeeRepository.save(employee);

        return { message: 'Password successfully reset' };
    }

   
    private generateToken(employeeId: string, email: string): string {
        const payload = { sub: employeeId, email };
        return this.jwtService.sign(payload);
    }

   
    async validateEmployee(id: string): Promise<Employee | null> {
        return this.employeeRepository.findOne({
            where: { id },
            select: ['id', 'email', 'names', 'employeeId'],
        });
    }
}