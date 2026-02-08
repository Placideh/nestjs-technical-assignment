import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    ConflictException,
    InternalServerErrorException,
    Get,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { AuthService } from '../service/auth.service';
  import { RegisterDto } from '../dto/register.dto';
  import { LoginDto } from '../dto/login.dto';
  import { ForgotPasswordDto } from '../dto/forgotPassword.dto';
  import { ResetPasswordDto } from '../dto/resetPassword.dto';
  import { JwtAuthGuard } from '../jwtAuth.guard';
  
  @ApiTags('auth')
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Post('register')
    @ApiOperation({ summary: 'Register a new employee' })
    @ApiResponse({ status: 201, description: 'Employee registered successfully' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    async register(@Body() registerDto: RegisterDto) {
      try {
        return await this.authService.register(registerDto);
      } catch (error) {
        if (error.message === 'EMAIL_ALREADY_EXISTS') {
          throw new ConflictException('Email already exists');
        }else if (error.message === 'EMPLOYEEID_ALREADY_EXISTS'){
            throw new ConflictException('EmployeeId already exists');
        }
        throw new InternalServerErrorException('Failed to register employee');
      }
    }
  
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login employee' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
      try {
        return await this.authService.login(loginDto);
      } catch (error) {
        if (error.message === 'INVALID_CREDENTIALS') {
          throw new UnauthorizedException('Invalid email or password');
        }
        throw new InternalServerErrorException('Failed to login');
      }
    }
  
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
      try {
        return await this.authService.forgotPassword(forgotPasswordDto);
      } catch (error) {
        throw new InternalServerErrorException('Failed to process request');
      }
    }
  
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password using token' })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
      try {
        return await this.authService.resetPassword(resetPasswordDto);
      } catch (error) {
        console.log(`Server error: ${error}`);
        throw new InternalServerErrorException(`Something went wrong...please again`);
      }
    }
  
    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current employee profile' })
    @ApiResponse({ status: 200, description: 'Profile retrieved' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@Request() req) {
      try {
        return await this.authService.validateEmployee(req.user.id);
      } catch (error) {
        console.log(`Server error: ${error}`);
        throw new InternalServerErrorException(`Something went wrong...please again`);
      }
    }
  
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout employee (client-side token deletion)' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    async logout() {
      return { message: 'Logout successful. Please delete your access token.' };
    }
  }