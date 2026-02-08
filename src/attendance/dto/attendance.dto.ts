import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceDto {
  @ApiProperty({
    example: 'ak@plc.com',
    description: 'Employee email or employee identifier (e.g., EMP123)',
  })
  @IsString()
  employeeIdentifier: string; // Can be email or employeeId

  @ApiPropertyOptional({
    example: 'Arrived late due to traffic',
    description: 'Optional comment about attendance',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}