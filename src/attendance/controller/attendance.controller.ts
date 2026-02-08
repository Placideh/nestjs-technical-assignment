import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    NotFoundException,
    InternalServerErrorException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from '../service/attendance.service';
import { AttendanceDto } from '../dto/attendance.dto';
import { JwtAuthGuard } from '../../auth/jwtAuth.guard';

@ApiTags('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Post('record')
    @ApiOperation({
        summary: 'Record attendance (handles both arrival and departure)',
    })
    @ApiResponse({
        status: 201,
        description: 'Attendance recorded successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Employee not found',
    })
    async recordAttendance(@Body() dto: AttendanceDto) {
        return await this.attendanceService.recordAttendance(dto);

    }

    @Get('employee/:employeeId')
    @ApiOperation({ summary: 'Get all attendance records for an employee' })
    @ApiResponse({
        status: 200,
        description: 'List of attendance records',
    })
    async getEmployeeAttendance(@Param('employeeId') employeeId: string) {
        return await this.attendanceService.getEmployeeAttendance(employeeId);

    }

    @Get('employee/:employeeId/today')
    @ApiOperation({ summary: "Get today's attendance for an employee" })
    @ApiResponse({
        status: 200,
        description: "Today's attendance record",
    })
    async getTodayAttendance(@Param('employeeId') employeeId: string) {
        try {
            const attendance =
                await this.attendanceService.getTodayAttendance(employeeId);

            if (!attendance) {
                return { message: 'No attendance record for today' };
            }

            return attendance;
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to retrieve attendance record',
            );
        }
    }
}