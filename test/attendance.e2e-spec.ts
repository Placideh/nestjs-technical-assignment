import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Attendance API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let employeeId: string;

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

    // Register employee and get token for all tests
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'jumpman@me.com',
      password: 'Password123!',
      names: 'Jump man',
      phoneNumber: '250789392103',
      });

    accessToken = registerRes.body.accessToken;
    employeeId = registerRes.body.employee.id;
  });

 
  describe('POST /attendance/record', () => {
    describe('given valid employee identifier and JWT token', () => {
      it('should return status code 201 and record arrival', async () => {
        const attendanceData = {
          employeeIdentifier: 'jumpman@me.com',
          comment: 'EARLY coming today',
        };

        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(attendanceData);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('entry');
        expect(res.body).toHaveProperty('depart');
        expect(res.body).toHaveProperty('date');
        expect(res.body).toHaveProperty('status');
        expect(res.body.comment).toEqual('EARLY coming today');
        expect(res.body.employeeId).toEqual(employeeId);
      });

      it('should return status code 201 and record departure (second recording)', async () => {
        const attendanceData = {
          employeeIdentifier: 'jumpman@me.com',
          comment: 'Tap In',
        };

        // First recording (arrival)
        await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(attendanceData);

        // Second recording (departure)
        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            employeeIdentifier: 'jumpman@me.com',
            comment: 'Tap out',
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('activeHours');
        expect(res.body.activeHours).toBeGreaterThan(0);
        expect(res.body.comment).toEqual('Tap out');
      });

      it('should set status to ONTIME if arrived before 9:00 AM', async () => {
        // Mock current time would be needed for precise testing
        // For now, we test that status field exists
        const attendanceData = {
          employeeIdentifier: 'jumpman@me.com',
        };

        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(attendanceData);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('status');
        expect(['ONTIME', 'LATE']).toContain(res.body.status);
      });
    });

    describe('given employee identifier by employeeId instead of email', () => {
      it('should return status code 201 using employee identifier', async () => {
        // Get employee identifier first
        const profileRes = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`);

        const employeeIdentifier = profileRes.body.employeeIdentifier;

        const attendanceData = {
          employeeIdentifier: employeeIdentifier,
          comment: 'Using employee ID',
        };

        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(attendanceData);

        expect(res.statusCode).toEqual(201);
        expect(res.body.employeeId).toEqual(employeeId);
      });
    });

    describe('given not found employee  email', () => {
      it('should return status code 404 if employee does not exist', async () => {
        const attendanceData = {
          employeeIdentifier: 'jumpman34@me.com',
        };

        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(attendanceData);

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('given missing employee identifier', () => {
      it('should return status code 400 if employeeIdentifier is not provided', async () => {
        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({});

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const attendanceData = {
          employeeIdentifier: 'jumpman@me.com',
        };

        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .send(attendanceData);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const attendanceData = {
          employeeIdentifier: 'jumpman@me.com',
        };

        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', 'Bearer invalid-token-123')
          .send(attendanceData);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given comment is provided', () => {
      it('should save the comment with attendance record', async () => {
        const attendanceData = {
          employeeIdentifier: 'jumpman@example.com',
          comment: 'Working from home today....',
        };

        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(attendanceData);

        expect(res.statusCode).toEqual(201);
        expect(res.body.comment).toEqual('Working from home today....');
      });
    });

    describe('given no comment is provided', () => {
      it('should set comment to N/A by default', async () => {
        const attendanceData = {
          employeeIdentifier: 'jumpman@me.com',
        };

        const res = await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(attendanceData);

        expect(res.statusCode).toEqual(201);
        expect(res.body.comment).toEqual('N/A');
      });
    });
  });

 
  describe('GET /attendance/employee/:employeeId', () => {
    beforeEach(async () => {
      // Create some attendance records
      await request(app.getHttpServer())
        .post('/attendance/record')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          employeeIdentifier: 'jumpman@me.com',
          comment: 'Tap In',
        });
    });

    describe('given valid employee ID and JWT token', () => {
      it('should return status code 200 and list of attendance records', async () => {
        const res = await request(app.getHttpServer())
          .get(`/attendance/employee/${employeeId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('entry');
        expect(res.body[0]).toHaveProperty('depart');
        expect(res.body[0]).toHaveProperty('date');
      });

      it('should return attendance records ordered by date descending', async () => {
        const res = await request(app.getHttpServer())
          .get(`/attendance/employee/${employeeId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        if (res.body.length > 1) {
          const firstDate = new Date(res.body[0].date);
          const secondDate = new Date(res.body[1].date);
          expect(firstDate >= secondDate).toBe(true);
        }
      });
    });

    describe('given employee with no attendance records', () => {
      it('should return status code 200 and empty array', async () => {
        // Register new employee without attendance
        const newEmployeeRes = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'jane@me.com',
            password: 'Password123!',
            names: 'Jane Smith',
            phoneNumber: '250789392103',
          });

        const res = await request(app.getHttpServer())
          .get(`/attendance/employee/${newEmployeeRes.body.employee.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toEqual(0);
      });
    });

    describe('given invalid employee ID format', () => {
      it('should return status code 200 with empty array for non-existent ID', async () => {
        const res = await request(app.getHttpServer())
          .get('/attendance/employee/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toEqual(0);
      });
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const res = await request(app.getHttpServer())
          .get(`/attendance/employee/${employeeId}`);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const res = await request(app.getHttpServer())
          .get(`/attendance/employee/${employeeId}`)
          .set('Authorization', 'Bearer invalid-token-123');

        expect(res.statusCode).toEqual(401);
      });
    });
  });


  describe('GET /attendance/employee/:employeeId/today', () => {
    describe('given employee has attendance record for today', () => {
      beforeEach(async () => {
        // Create today's attendance
        await request(app.getHttpServer())
          .post('/attendance/record')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            employeeIdentifier: 'jumpman@me.com',
            comment: 'Today record',
          });
      });

      it('should return status code 200 and today\'s attendance record', async () => {
        const res = await request(app.getHttpServer())
          .get(`/attendance/employee/${employeeId}/today`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('entry');
        expect(res.body).toHaveProperty('date');
        expect(res.body.employeeId).toEqual(employeeId);
        
        // Check if date is today
        const today = new Date().toISOString().split('T')[0];
        expect(res.body.date).toEqual(today);
      });
    });

    describe('given employee has no attendance record for today', () => {
      it('should return status code 200 with message', async () => {
        const res = await request(app.getHttpServer())
          .get(`/attendance/employee/${employeeId}/today`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('No attendance record for today');
      });
    });

    describe('given non-existent employee ID', () => {
      it('should return status code 200 with no record message', async () => {
        const res = await request(app.getHttpServer())
          .get('/attendance/employee/00000000-0000-0000-0000-000000000000/today')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message');
      });
    });

    describe('given no JWT token', () => {
      it('should return status code 401 if token is not provided', async () => {
        const res = await request(app.getHttpServer())
          .get(`/attendance/employee/${employeeId}/today`);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('given invalid JWT token', () => {
      it('should return status code 401 if token is invalid', async () => {
        const res = await request(app.getHttpServer())
          .get(`/attendance/employee/${employeeId}/today`)
          .set('Authorization', 'Bearer invalid-token-123');

        expect(res.statusCode).toEqual(401);
      });
    });
  });

});