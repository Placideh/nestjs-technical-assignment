import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
    UsePipes,
    ValidationPipe,
    ParseUUIDPipe,
    DefaultValuePipe,
    ParseIntPipe,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags, ApiBody,
    ApiOperation,
    ApiCreatedResponse,
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiParam,
    ApiNoContentResponse,
    ApiBearerAuth,


} from '@nestjs/swagger';
import { EmployeeService } from "../service/employee.service";
import { EmployeeDto } from '../dto/employee.dto';
import { Employee } from '../entities/employee.entity';
import { JwtAuthGuard } from '../../auth/jwtAuth.guard';


@ApiTags("Employee endpoints")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("employees")
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new employee' })
    @ApiCreatedResponse({
        description: 'Employee successfully registered',
        type: EmployeeDto,
    })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiConflictResponse({ description: 'Email or Employee ID already exists' })
    @ApiBody({ type: EmployeeDto })
    async register(@Body() employeeDto: EmployeeDto): Promise<Employee> {
        return await this.employeeService.register(employeeDto);
    }


    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get employee by ID' })
    @ApiOkResponse({
        description: 'Employee found successfully',
        type: Employee,
    })
    @ApiNotFoundResponse({ description: 'Employee not found' })
    @ApiBadRequestResponse({ description: 'Invalid UUID format' })
    @ApiParam({
        name: 'id',
        type: String,
        description: 'Employee UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Employee> {
        return await this.employeeService.findById(id);
    }


    @Get('email/:email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get employee by email' })
    @ApiOkResponse({
        description: 'Employee found successfully',
        type: Employee,
    })
    @ApiNotFoundResponse({ description: 'Employee not found' })
    @ApiBadRequestResponse({ description: 'Invalid email format' })
    @ApiParam({
        name: 'email',
        type: String,
        description: 'Employee email address',
        example: 'jumpamn@gmail.com',
    })
    async findByEmail(@Param('email') email: string): Promise<Employee> {
        return await this.employeeService.findByEmail(email);
    }

    @Get('employeeId/:employeeId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get employee by employee ID' })
    @ApiOkResponse({
        description: 'Employee found successfully',
        type: Employee,
    })
    @ApiNotFoundResponse({ description: 'Employee not found' })
    @ApiParam({
        name: 'employeeId',
        type: String,
        description: 'Employee ID (e.g., EMP001)',
        example: 'EMP012',
    })
    async findByEmployeeId(
        @Param('employeeId') employeeId: string,
    ): Promise<Employee> {
        return await this.employeeService.findByEmployeeId(employeeId);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update employee information' })
    @ApiOkResponse({
        description: 'Employee updated successfully',
        type: Employee,
    })
    @ApiNotFoundResponse({ description: 'Employee not found' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiConflictResponse({ description: 'Email or Employee ID already exists' })
    @ApiParam({
        name: 'id',
        type: String,
        description: 'Employee UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiBody({ type: EmployeeDto })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateEmployeeDto: EmployeeDto,
    ): Promise<Employee> {
        return await this.employeeService.update(id, updateEmployeeDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete employee' })
    @ApiNoContentResponse({ description: 'Employee deleted successfully' })
    @ApiNotFoundResponse({ description: 'Employee not found' })
    @ApiBadRequestResponse({ description: 'Invalid UUID format' })
    @ApiParam({
        name: 'id',
        type: String,
        description: 'Employee UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        // You might want to add a delete method to your service
        // For now, let's assume you'll implement it later
        throw new BadRequestException('Delete endpoint not implemented yet');
    }



}