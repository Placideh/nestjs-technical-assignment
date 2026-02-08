import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Employee } from '../../employee/entities/employee.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgotPassword.dto';
import { ResetPasswordDto } from '../dto/resetPassword.dto';
import { EmployeeService } from '../../employee/service/employee.service';

@Injectable()
export class AuthService {
    constructor(
        @Inject(forwardRef(() => EmployeeService))
        private readonly employeeService: EmployeeService,
        private readonly jwtService: JwtService,
    ) { }


    async register(employeeDto: RegisterDto): Promise<Employee> {
        console.log("are saving...");
        try{
            return await this.employeeService.register(employeeDto);
        }catch(error){
            console.log("error is : ",error);
            throw new BadRequestException();
        }
        
    }

    async login(loginDto: LoginDto) {
        // Find employee by email
        const existingEmployee = await this.employeeService.findByEmail(loginDto.email);

        if (!existingEmployee) {
            throw new NotFoundException(`Invalid Credential email/password`);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            existingEmployee.password,
        );

        if (!isPasswordValid) {
            throw new NotFoundException(`Invalid Credential email/password`);
        }

        // Generate JWT token
        const token = this.generateToken(existingEmployee.id, existingEmployee.email);


        return {
            existingEmployee,
            accessToken: token,
        };
    }


    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {

        const existingEmployee = await this.employeeService.findByEmail(forgotPasswordDto.email);

        if (!existingEmployee) {
            throw new NotFoundException(`If email exists, reset link has been sent`);
        }


        // generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(resetToken, 10);

        // Save token with 1 hour expiry
        existingEmployee.resetToken = hashedToken;
        existingEmployee.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        await this.employeeService.update(existingEmployee.id, existingEmployee);
    }


    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        // Find employees with non-expired tokens
        const employee = await this.employeeService.verifyResetToken(resetPasswordDto.token);

        if (employee.resetToken) {
            const isValid = await bcrypt.compare(
                resetPasswordDto.token,
                employee.resetToken,
            );
            if (!isValid) {

                throw new BadRequestException('Invalid or expired Token');
            }
        }


        // Hash new password
        employee.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);

        // Clear reset token
        employee.resetToken = "";
        employee.resetTokenExpiry = new Date();

        return await this.employeeService.update(employee.id,employee);
    }


    private generateToken(employeeId: string, email: string): string {
        const payload = { sub: employeeId, email };
        return this.jwtService.sign(payload);
    }


    async validateEmployee(id: string): Promise<Employee | null> {
        return await this.employeeService.findById(id)
    }
}