import { Injectable } from '@nestjs/common';
import 'dotenv/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConnectionService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(
    connectionName?: string,
  ): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const dbType = process.env.DB_TYPE || 'mysql';
    const isTest = process.env.NODE_ENV === 'test';

    // Base configuration shared by all databases
    const baseConfig = {
      name: connectionName || 'default',
      synchronize: isTest, // Auto-sync in test, use migrations in dev/prod
      dropSchema: isTest, // remove all schemas on test environemnet
      logging: true, 
      entities: isTest
        ? [__dirname + '/../**/*.entity{.ts,.js}']
        : ['dist/**/*.entity.js'],
      autoLoadEntities: true,
    };

    // SQLite for running tests
    if (dbType === 'sqlite') {
      return {
        ...baseConfig,
        type: 'sqlite',
        database: process.env.DB_NAME || ':memory:',
      } as TypeOrmModuleOptions;
    }

    // MySQL configuration
    return {
      ...baseConfig,
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'attendance_db',
      synchronize: true, // should be false for prod
    } as TypeOrmModuleOptions;
  }
}