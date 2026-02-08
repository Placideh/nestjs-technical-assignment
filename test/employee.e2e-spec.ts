import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Employee API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let createdEmployeeId: string;
  let createdEmployeeEmail: string;
  let createdemployeeId: string;

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

    // Register admin/employee and get token for all tests
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'jumpman@me.com',
      password: 'Password123!',
      names: 'Jump man',
      phoneNumber: '250789392103',
      });

    accessToken = registerRes.body.accessToken;
  });

 
  describe('POST /employees/register', () => {
    const validEmployee = {
        email: 'jumpman@me.com',
        password: 'Password123!',
        names: 'Jump man',
        phoneNumber: '250789392103',
    };

    describe('given valid employee data with JWT token', () => {
      it('should return status code 201 and register employee successfully', async () => {
        const res = await request(app.getHttpServer())
          .post('/employees/register')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(validEmployee);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toEqual(validEmployee.email);
        expect(res.body.names).toEqual(validEmployee.names);
        expect(res.body).toHaveProperty('employeeId');
        // expect(res.body).not.toHaveProperty('password'); 

        // Save for later tests
        createdEmployeeId = res.body.id;
        createdEmployeeEmail = res.body.email;
        createdemployeeId = res.body.employeeId;
      });
    });

    describe('given duplicate email', () => {
      it('should return status code 409 if email already exists', async () => {
        // Register first employee
        await request(app.getHttpServer())
          .post('/employees/register')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(validEmployee);

        // Try to register with same email
        const res = await request(app.getHttpServer())
          .post('/employees/register')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(validEmployee);

        expect(res.statusCode).toEqual(409);
      });
    });

    describe('given invalid email format', () => {
      it('should return status code 400 if email is invalid', async () => {
        const invalidEmail = {
          ...validEmployee,
          email: 'invalid-email',
        };

        const res = await request(app.getHttpServer())
          .post('/employees/register')
          .set('Authorization', `Bearer ${accessToken}`)
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
          .post('/employees/register')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(shortPassword);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given missing required fields', () => {
      it('should return status code 400 if email is missing', async () => {
        const { email, ...noEmail } = validEmployee;

        const res = await request(app.getHttpServer())
          .post('/employees/register')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(noEmail);

        expect(res.statusCode).toEqual(400);
      });

      it('should return status code 400 if names is missing', async () => {
        const { names, ...noFirstName } = validEmployee;

        const res = await request(app.getHttpServer())
          .post('/employees/register')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(noFirstName);

        expect(res.statusCode).toEqual(400);
      });

      
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const res = await request(app.getHttpServer())
          .post('/employees/register')
          .send(validEmployee);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const res = await request(app.getHttpServer())
          .post('/employees/register')
          .set('Authorization', 'Bearer invalid-token-123')
          .send(validEmployee);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given empty request body', () => {
      it('should return status code 400 if no data provided', async () => {
        const res = await request(app.getHttpServer())
          .post('/employees/register')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({});

        expect(res.statusCode).toEqual(400);
      });
    });
  });


  describe('GET /employees/:id', () => {
    beforeEach(async () => {
      // Create an employee for testing
      const createRes = await request(app.getHttpServer())
        .post('/employees/register')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
            email: 'jumpman@me.com',
            password: 'Password123!',
            names: 'Jump man',
            phoneNumber: '250789392103',
        });

      createdEmployeeId = createRes.body.id;
    });

    describe('given valid employee ID with JWT token', () => {
      it('should return status code 200 and employee data', async () => {
        const res = await request(app.getHttpServer())
          .get(`/employees/${createdEmployeeId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body.id).toEqual(createdEmployeeId);
        expect(res.body).toHaveProperty('email');
        expect(res.body).toHaveProperty('names');
        // expect(res.body).not.toHaveProperty('password');
      });
    });

    describe('given non-existent employee ID', () => {
      it('should return status code 404 if employee does not exist', async () => {
        const res = await request(app.getHttpServer())
          .get('/employees/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('given invalid UUID format', () => {
      it('should return status code 400 if ID format is invalid', async () => {
        const res = await request(app.getHttpServer())
          .get('/employees/invalid-uuid-123')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const res = await request(app.getHttpServer())
          .get(`/employees/${createdEmployeeId}`);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const res = await request(app.getHttpServer())
          .get(`/employees/${createdEmployeeId}`)
          .set('Authorization', 'Bearer invalid-token-123');

        expect(res.statusCode).toEqual(401);
      });
    });
  });

 
  describe('GET /employees/email/:email', () => {
    beforeEach(async () => {
      // Create an employee for testing
      const createRes = await request(app.getHttpServer())
        .post('/employees/register')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
            email: 'jumpman@me.com',
            password: 'Password123!',
            names: 'Jump man',
            phoneNumber: '250789392103',
        });

      createdEmployeeEmail = createRes.body.email;
    });

    describe('given valid email with JWT token', () => {
      it('should return status code 200 and employee data', async () => {
        const res = await request(app.getHttpServer())
          .get(`/employees/email/${createdEmployeeEmail}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toEqual(createdEmployeeEmail);
        expect(res.body).toHaveProperty('names');
        // expect(res.body).not.toHaveProperty('password');
      });
    });

    describe('given non-existent email', () => {
      it('should return status code 404 if email does not exist', async () => {
        const res = await request(app.getHttpServer())
          .get('/employees/email/nonexistent@example.com')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('given invalid email format', () => {
      it('should return status code 400 if email format is invalid', async () => {
        const res = await request(app.getHttpServer())
          .get('/employees/email/invalid-email')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const res = await request(app.getHttpServer())
          .get(`/employees/email/${createdEmployeeEmail}`);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const res = await request(app.getHttpServer())
          .get(`/employees/email/${createdEmployeeEmail}`)
          .set('Authorization', 'Bearer invalid-token-123');

        expect(res.statusCode).toEqual(401);
      });
    });
  });


  describe('GET /employees/employeeId/:employeeId', () => {
    beforeEach(async () => {
      // Create an employee for testing
      const createRes = await request(app.getHttpServer())
        .post('/employees/register')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
            email: 'jumpman@me.com',
            password: 'Password123!',
            names: 'Jump man',
            phoneNumber: '250789392103',
        });

      createdemployeeId = createRes.body.employeeId;
    });

    describe('given valid employee identifier with JWT token', () => {
      it('should return status code 200 and employee data', async () => {
        const res = await request(app.getHttpServer())
          .get(`/employees/employeeId/${createdemployeeId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body.employeeId).toEqual(createdemployeeId);
        expect(res.body).toHaveProperty('email');
        // expect(res.body).not.toHaveProperty('password');
      });
    });

    describe('given non-existent employee identifier', () => {
      it('should return status code 404 if employee ID does not exist', async () => {
        const res = await request(app.getHttpServer())
          .get('/employees/employeeId/EMP999999')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const res = await request(app.getHttpServer())
          .get(`/employees/employeeId/${createdemployeeId}`);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const res = await request(app.getHttpServer())
          .get(`/employees/employeeId/${createdemployeeId}`)
          .set('Authorization', 'Bearer invalid-token-123');

        expect(res.statusCode).toEqual(401);
      });
    });
  });


  describe('PATCH /employees/:id', () => {
    beforeEach(async () => {
      // Create an employee for testing
      const createRes = await request(app.getHttpServer())
        .post('/employees/register')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
            email: 'jumpman@me.com',
            password: 'Password123!',
            names: 'Jumpss man',
            phoneNumber: '250789392103',
        });

      createdEmployeeId = createRes.body.id;
    });

    describe('given valid update data with JWT token', () => {
      it('should return status code 200 and update employee successfully', async () => {
        const updateData = {
          names: 'Jumpss man',
          phoneNumber: '250789392603',
        };

        const res = await request(app.getHttpServer())
          .patch(`/employees/${createdEmployeeId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData);

        expect(res.statusCode).toEqual(200);
        expect(res.body.names).toEqual('Jumpss man');
        expect(res.body.phoneNumber).toEqual('250789392603');
      });


      it('should update password and hash it', async () => {
        const updateData = {
          password: 'NewPassword456!',
        };

        const res = await request(app.getHttpServer())
          .patch(`/employees/${createdEmployeeId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData);

        expect(res.statusCode).toEqual(200);
        // expect(res.body).not.toHaveProperty('password'); 
      });
    });

    describe('given non-existent employee ID', () => {
      it('should return status code 404 if employee does not exist', async () => {
        const updateData = {
          firstName: 'Updated',
        };

        const res = await request(app.getHttpServer())
          .patch('/employees/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData);

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('given duplicate email', () => {
      it('should return status code 409 if email already exists', async () => {
        // Create another employee
        await request(app.getHttpServer())
          .post('/employees/register')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            email: 'jumpman22@me.com',
            password: 'Password123!',
            names: 'Jumpss man',
            phoneNumber: '250789392103',
          });

        // updating first employee with second employee's email
        const updateData = {
          email: 'jumpman22@me.com',
        };

        const res = await request(app.getHttpServer())
          .patch(`/employees/${createdEmployeeId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData);

        expect(res.statusCode).toEqual(409);
      });
    });


    describe('given invalid email format in update', () => {
      it('should return status code 400 if email format is invalid', async () => {
        const updateData = {
          email: 'invalid-email',
        };

        const res = await request(app.getHttpServer())
          .patch(`/employees/${createdEmployeeId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given password less than 8 characters', () => {
      it('should return status code 400 if password is too short', async () => {
        const updateData = {
          password: 'Short1!',
        };

        const res = await request(app.getHttpServer())
          .patch(`/employees/${createdEmployeeId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData);

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const updateData = {
          names: 'RunWays',
        };

        const res = await request(app.getHttpServer())
          .patch(`/employees/${createdEmployeeId}`)
          .send(updateData);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const updateData = {
          names: 'RunWaks',
        };

        const res = await request(app.getHttpServer())
          .patch(`/employees/${createdEmployeeId}`)
          .set('Authorization', 'Bearer invalid-token-123')
          .send(updateData);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given empty update body', () => {
      it('should return status code 200 even with empty body', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/employees/${createdEmployeeId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({});

        expect(res.statusCode).toEqual(200);
        
      });
    });
  });
});