import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { DatabaseConnectionService } from './config/db.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { EmployeeModule } from './employee/employee.module';
import { AttendanceModule } from './attendance/attendace.module';
import { AuthModule } from './auth/auth.module';
import "dotenv/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    
    TypeOrmModule.forRootAsync({
    useClass: DatabaseConnectionService,

  }),

   // Bull queue module
   BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt (process.env.REDIS_PORT || "6379")
      },
  }),
  AuthModule,
  EmployeeModule,
  AttendanceModule,
  MailModule,

],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
