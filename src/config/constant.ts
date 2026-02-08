
export const ATTENDANCE_CONSTANTS = {
    ARRIVAL_TIME: '09:00', // Expected arrival time (9:00 AM)
    DEPARTURE_TIME: '17:00', // Expected departure time (5:00 PM)
    STANDARD_WORK_HOURS: 8, // Standard working hours
  } as const;
  
  // Attendance status enum
  export enum AttendanceStatus {
    ONTIME = 'ONTIME', // Arrived on time, left on time
    LATE = 'LATE', // Arrived late
    OVERTIME = 'OVERTIME', // Worked more than 8 hours
    PRETIME = 'PRETIME', // Left before completing 8 hours
  }