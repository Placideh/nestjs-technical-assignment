import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'jumpman@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Jump man' })
  @IsString()
  @IsNotEmpty()
  names: string;

  @ApiProperty({
    example: 'EMP001',
    description: 'Custom employee ID. If not provided, one will be generated',
  })
  @MinLength(6, { message: 'Employee ID must be composed by 8 characters long' })
  @IsString({ message: 'Employee ID must be a string' })
  @Matches(/^EMP\d{3,}$/, {
    message: 'Employee ID must start with EMP followed by numbers (e.g., EMP001)',
  })
  employeeId: string;

  @ApiProperty({
    description: "User's phone number.",
    example: "25078xxxxxxx",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/(2507[8,2,3,9])[0-9]{7}/, {
    message:
      "Phone number must be Airtel or MTN number formatted like 250*********",
  })
  phoneNumber: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}