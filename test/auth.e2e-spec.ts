import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same validation pipe as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await dataSource.synchronize(true);
  });


  describe('POST /auth/register', () => {
    const validEmployee = {
      email: 'jumpman@me.com',
      password: 'Password123!',
      names: 'Jump man',
      phoneNumber: '250789392103',
    };

    describe('given valid employee data', () => {
      it('should return status code 201 and register employee successfully', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(validEmployee);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('employee');
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.employee.email).toEqual(validEmployee.email);
        expect(res.body.employee.names).toEqual(validEmployee.names);
        expect(res.body.employee).toHaveProperty('employeeIdentifier');
        expect(res.body.employee).not.toHaveProperty('password'); // Password should be excluded
      });
    });

    describe('given an email that already exists', () => {
      it('should return status code 409 if email already exists', async () => {
        // Register first employee
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(validEmployee);

        // Try to register with same email
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(validEmployee);

        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toEqual('Email already exists');
      });
    });

    describe('given invalid email format', () => {
      it('should return status code 400 if email is invalid', async () => {
        const invalidEmail = {
          ...validEmployee,
          email: 'invalid-email',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(invalidEmail);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given password less than 8 characters', () => {
      it('should return status code 400 if password is too short', async () => {
        const shortPassword = {
          ...validEmployee,
          password: 'Pass1!',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(shortPassword);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given missing required fields', () => {
      it('should return status code 400 if email is missing', async () => {
        const { email, ...noEmail } = validEmployee;

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(noEmail);

        expect(res.statusCode).toEqual(400);
      });

      it('should return status code 400 if password is missing', async () => {
        const { password, ...noPassword } = validEmployee;

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(noPassword);

        expect(res.statusCode).toEqual(400);
      });

      it('should return status code 400 if names is missing', async () => {
        const { names, ...noFirstName } = validEmployee;

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(noFirstName);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given empty request body', () => {
      it('should return status code 400 if no data provided', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({});

        expect(res.statusCode).toEqual(400);
      });
    });
  });

  
  describe('POST /auth/login', () => {
    const validEmployee = {
      email: 'jumpman@me.com',
      password: 'Password123!',
      names: 'Jump Man',
      phoneNumber: '250789392103',
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validEmployee);
    });

    describe('given correct credentials', () => {
      it('should return status code 200 if credentials are correct', async () => {
        const loginData = {
          email: validEmployee.email,
          password: validEmployee.password,
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData);

        expect(res.statusCode).toEqual(200);
        expect(res.body.employee.email).toEqual(validEmployee.email);
      });
    });

    describe('given incorrect email', () => {
      it('should return status code 401 if email does not exist', async () => {
        const loginData = {
          email: 'nonexistent@example.com',
          password: validEmployee.password,
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData);

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual('Invalid email or password');
      });
    });

    describe('given correct email but incorrect password', () => {
      it('should return status code 401 if password is incorrect', async () => {
        const loginData = {
          email: validEmployee.email,
          password: 'WrongPassword123!',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData);

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual('Invalid email or password');
      });
    });

    describe('given missing credentials', () => {
      it('should return status code 400 if email is missing', async () => {
        const loginData = {
          password: validEmployee.password,
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData);

        expect(res.statusCode).toEqual(400);
      });

      it('should return status code 400 if password is missing', async () => {
        const loginData = {
          email: validEmployee.email,
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given empty credentials', () => {
      it('should return status code 400 if credentials are empty', async () => {
        const loginData = {
          email: '',
          password: '',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData);

        expect(res.statusCode).toEqual(400);
      });
    });
  });


  describe('POST /auth/forgot-password', () => {
    const validEmployee = {
      email: 'jumpman@me.com',
      password: 'Password123!',
      names: 'Jump Man',
      phoneNumber: '250789392103',
    };

    beforeEach(async () => {
      // Register employee before forgot password tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validEmployee);
    });

    describe('given valid email that exists', () => {
      it('should return status code 200 and success message', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: validEmployee.email });

        expect(res.statusCode).toEqual(200);
      });
    });

    describe('given email that does not exist', () => {
      it('should return status code 400 and same message (security)', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: 'nonexistent@example.com' });

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given invalid email format', () => {
      it('should return status code 400 if email format is invalid', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: 'myemail$me.com' });

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given missing email', () => {
      it('should return status code 400 if email is not provided', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({});

        expect(res.statusCode).toEqual(400);
      });
    });
  });


  describe('POST /auth/reset-password', () => {
    const validEmployee = {
      email: 'jumpman@me.com',
      password: 'Password123!',
      names: 'Jump Man',
      phoneNumber: '250789392103',
    };

    let resetToken: string;

    beforeEach(async () => {
      // Register employee
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validEmployee);

      // Request password reset
      const forgotRes = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: validEmployee.email });

      resetToken = forgotRes.body.resetToken;
    });

    describe('given valid reset token', () => {
      it('should return status code 200 and reset password successfully', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
            newPassword: 'NewPassword456!',
          });

        expect(res.statusCode).toEqual(200);
      });

      it('should allow login with new password after reset', async () => {
        // Reset password
        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
            newPassword: 'NewPassword456!',
          });

        // Login with new password
        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: validEmployee.email,
            password: 'NewPassword456!',
          });

        expect(loginRes.statusCode).toEqual(200);
      });

      it('should not allow login with old password after reset', async () => {
        // Reset password
        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
            newPassword: 'NewPassword456!',
          });

        // Try login with old password
        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: validEmployee.email,
            password: validEmployee.password,
          });

        expect(loginRes.statusCode).toEqual(401);
      });
    });

    describe('given invalid reset token', () => {
      it('should return status code 400 if token is invalid', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: 'invalid-token-123',
            newPassword: 'NewPassword456!',
          });

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given token used twice', () => {
      it('should return status code 400 if token already used', async () => {
        // Use token first time
        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
            newPassword: 'NewPassword456!',
          });

        // Try to use same token again
        const res = await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
            newPassword: 'AnotherPassword789!',
          });

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given password less than 8 characters', () => {
      it('should return status code 400 if new password is too short', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
            newPassword: 'Short1!',
          });

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given missing fields', () => {
      it('should return status code 400 if token is missing', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            newPassword: 'NewPassword456!',
          });

        expect(res.statusCode).toEqual(400);
      });

      it('should return status code 400 if newPassword is missing', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
          });

        expect(res.statusCode).toEqual(400);
      });
    });
  });


  describe('GET /auth/profile', () => {
    const validEmployee = {
      email: 'john.doe@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
    };

    let accessToken: string;

    beforeEach(async () => {
      // Register and get token
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validEmployee);

      accessToken = registerRes.body.accessToken;
    });

    describe('given valid JWT token', () => {
      it('should return status code 200 and employee profile', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.email).toEqual(validEmployee.email);
        // expect(res.body).not.toHaveProperty('password');
      });
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/profile');

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', 'Bearer invalid-token-123');

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given malformed authorization header', () => {
      it('should return status code 401 if Bearer prefix is missing', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', accessToken);

        expect(res.statusCode).toEqual(401);
      });
    });
  });


  describe('POST /auth/logout', () => {
    const validEmployee = {
      email: 'jumpmana@me.com',
      password: 'Password123!',
      names: 'JUmpam Naon',
      phoneNumber: '250789392103',
    };

    let accessToken: string;

    beforeEach(async () => {
      // Register and get token
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validEmployee);

      accessToken = registerRes.body.accessToken;
    });

    describe('given valid JWT token', () => {
      it('should return status code 200 and success message', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('Logout successful');
      });
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/logout');

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', 'Bearer invalid-token-123');

        expect(res.statusCode).toEqual(401);
      });
    });
  });
});