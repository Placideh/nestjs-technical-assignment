<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<p align="center">Employee Attendance Management System built with <a href="http://nestjs.com" target="_blank">NestJS</a></p>
<p align="center">A complete backend system for tracking employee attendance with reporting and authentication features.</p>

## 📚 API Documentation

Once running, access the interactive Swagger documentation at:  
🔗 **http://localhost:3000/api**

## Features

- ✅ Employee authentication & authorization (JWT)
- ✅ Attendance tracking with clock in/out
- ✅ PDF and Excel report generation
- ✅ Email notifications
- ✅ MySQl database with TypeORM
- ✅ Redis for queue management
- ✅ Unit and E2E testing
- ✅ Swagger API documentation



## Quick Start

```bash
# Install dependencies
$ npm install

# Setup environment
$ cp .env.example .env
# Edit .env with your database credentials


# Development
$ npm run start:dev

# Production
$ npm run build
$ npm run start:prod