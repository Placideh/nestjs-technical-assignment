import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jumpman@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}