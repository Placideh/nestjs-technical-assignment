import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
    InternalServerErrorException,
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
        try {
            return await this.employeeService.register(employeeDto);
        } catch (error) {
            console.log(`Server error: ${error}`);
            throw new InternalServerErrorException(`Something went wrong...please again`);
        }

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
        try {
            return await this.employeeService.findById(id);

        } catch (error) {
            console.log(`Server error: ${error}`);
            throw new InternalServerErrorException(`Something went wrong...please again`);
        }
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
        example: 'jumpamn@me.com',
    })
    async findByEmail(@Param('email') email: string): Promise<Employee> {
        try {
            return await this.employeeService.findByEmail(email);
        } catch (error) {
            console.log(`Server error: ${error}`);
            throw new InternalServerErrorException(`Something went wrong...please again`);
        }
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
        try {
            return await this.employeeService.findByEmployeeId(employeeId);
        } catch (error) {
            console.log(`Server error: ${error}`);
            throw new InternalServerErrorException(`Something went wrong...please again`);
        }
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
        try {
            return await this.employeeService.update(id, updateEmployeeDto);
        } catch (error) {
            console.log(`Server error: ${error}`);
            throw new InternalServerErrorException(`Something went wrong...please again`);
            
        }
    }

}