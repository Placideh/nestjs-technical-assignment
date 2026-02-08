import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, ILike, FindOptionsWhere, Not } from 'typeorm';
  import { EmployeeDto } from '../dto/employee.dto';
  import { Employee } from '../entities/employee.entity';
  import * as bcrypt from 'bcrypt';
  
  @Injectable()
  export class EmployeeService {
    constructor(
      @InjectRepository(Employee)
      private readonly employeeRepository: Repository<Employee>,
    ) {}
  
   
    async register(employeeDto: EmployeeDto): Promise<Employee> {
      // Check if email already exists
      const existingEmployee = await this.employeeRepository.findOne({
        where: { email: employeeDto.email },
      });
  
      if (existingEmployee) {
        throw new ConflictException('Email already exists');
      }
  
      // Check if employeeId already exists if provided
      if (employeeDto.employeeId) {
        const existingId = await this.employeeRepository.findOne({
          where: { employeeId: employeeDto.employeeId },
        });
        if (existingId) {
          throw new ConflictException('Employee ID already exists');
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
  

    async retrieveAll(page = 1,limit = 10,search?: string, ): Promise<{data: Employee[];
      total: number;
      page: number;
      totalPages: number;
    }> {
      const skip = (page - 1) * limit;
      const where: FindOptionsWhere<Employee> = {};
  
      if (search) {
        where.names = ILike(`%${search}%`);
      }
  
      const [data, total] = await this.employeeRepository.findAndCount({
        where,
        relations: ['attendances'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
        select: ['id','email','names','phoneNumber','employeeId','createdAt','updatedAt',
        ],
      });
  
      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }
  
    
    async findById(id: string): Promise<Employee> {
      const employee = await this.employeeRepository.findOne({
        where: { id },
        relations: ['attendances'],
        select: ['id', 'email', 'password', 'names', 'employeeId', 'phoneNumber']
      });
  
      if (!employee) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }
  
      return employee;
    }
  

    async findByEmail(email: string): Promise<Employee> {
    
      const existingEmployee = await this.employeeRepository.findOne({
        where: { email },
        select: ['id', 'email', 'password', 'names', 'employeeId', 'phoneNumber'],
      });
      if(!existingEmployee) throw new NotFoundException(`Employee with email: ${email} not found`);
      return existingEmployee;
    }
  
   
    async findByEmployeeId(employeeId: string): Promise<Employee> {
       const existingEmployee = await this.employeeRepository.findOne({
        where: { employeeId },
        select: ['id', 'email', 'password', 'names', 'employeeId', 'phoneNumber']
      });

      if(!existingEmployee) throw new NotFoundException(`Employee with id: ${employeeId} not found`);
      return existingEmployee;

    }
  
  
    async update(id: string,updateEmployeeDto: EmployeeDto, ): Promise<Employee> {

      const existingEmployee = await this.employeeRepository.findOne({where:{id}});
      if(!existingEmployee)  throw new NotFoundException(`Employee with id: ${id} not found`);
  
      // Check if email is being changed and if it already exists
      if (
        updateEmployeeDto.email &&
        updateEmployeeDto.email !== existingEmployee.email
      ) {
        const emailExists = await this.employeeRepository.findOne({
          where: { email: updateEmployeeDto.email, id: Not(id) },
        });
        if (emailExists) {
          throw new ConflictException('Email already exists');
        }
      }
  
      // Check if employeeId is being changed and if it already exists
      if (
        updateEmployeeDto.employeeId &&
        updateEmployeeDto.employeeId !== existingEmployee.employeeId
      ) {
        const employeeIdExists = await this.employeeRepository.findOne({
          where: { employeeId: updateEmployeeDto.employeeId, id: Not(id) },
        });
        if (employeeIdExists) {
          throw new ConflictException('Employee ID already exists');
        }
      }
  
      // Hash password if it's being updated
      if (updateEmployeeDto.password) {
        updateEmployeeDto.password = await bcrypt.hash(updateEmployeeDto.password, 10);
      }
  
      Object.assign(existingEmployee, updateEmployeeDto);
      return await this.employeeRepository.save(existingEmployee);
    }
  
   
  
    /**
     * Set reset token for password reset
     */
    async setResetToken(email: string, token: string, expiry: Date): Promise<void> {
      const employee = await this.findByEmail(email);
      
      if (!employee) {
        throw new NotFoundException(`Employee with email ${email} not found`);
      }
  
      employee.resetToken = token;
      employee.resetTokenExpiry = expiry;
      await this.employeeRepository.save(employee);
    }
  
  
    async verifyResetToken(token: string): Promise<Employee> {
      const employee = await this.employeeRepository.findOne({
        where: {
          resetToken: token,
          resetTokenExpiry: new Date(), // This will check if expiry > current date
        },
      });
  
      if (!employee) {
        throw new BadRequestException('Invalid or expired reset token');
      }
  
      return employee;
    }
  
  }