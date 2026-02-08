
export const ATTENDANCE_CONSTANTS = {
    ARRIVAL_TIME: '09:00', 
    DEPARTURE_TIME: '17:00', 
    STANDARD_WORK_HOURS: 8, 
  } as const;
  
  // Attendance status enum
  export enum AttendanceStatus {
    ONTIME = 'ONTIME', // Arrived on time, left on time
    LATE = 'LATE', // Arrived late
    OVERTIME = 'OVERTIME', // Worked more than 8 hours
    PRETIME = 'PRETIME', // Left before completing 8 hours
  }