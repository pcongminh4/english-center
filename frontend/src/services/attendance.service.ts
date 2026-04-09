import axiosInstance from '../configs/axios.config';
import type { ApiResponse } from '../types/api.type';

export interface SessionAttendance {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  actualDate: string;
  status: "ACTIVE" | "FINISHED" | "PLANNED";
  qrCode: string | null;
  qrCreatedAt: string | null;
  attendedCount: number;
  absentCount: number;
  totalRegistered: number;
  hasAttendance: boolean;
}

export interface ScheduleAttendanceData {
  scheduleId: number;
  totalRegistered: number;
  sessions: SessionAttendance[];
}

export interface StudentAttendance {
  studentId: number;
  student: {
    id: number;
    user: {
      id: number;
      fullname: string;
      email: string;
    };
  };
  attended: boolean;
  checkInTime: string | null;
}

export interface FullAttendanceData {
  sessionId: number;
  day: string;
  startTime: string;
  endTime: string;
  date: string;
  qrCode: string | null;
  qrCreatedAt: string | null;
  totalRegistered: number;
  attendedCount: number;
  absentCount: number;
  students: StudentAttendance[];
}

export interface StudentAttendanceRecord {
  id: number;
  studentId: number;
  scheduleAttendanceId: number;
  time: string;
  createdAt: string;
  scheduleAttendance: {
    id: number;
    scheduleDayId: number;
    date: string;
    qrCode: string | null;
    totalAbsent: number;
    createdAt: string;
    scheduleSession: {
      id: number;
      scheduleId: number;
      day: string;
      startTime: string;
      endTime: string;
      createdAt: string;
    };
  };
}

// Get all sessions with attendance data for a schedule
export const getScheduleSessionsAttendance = async (
  scheduleId: number
): Promise<ScheduleAttendanceData> => {
  const token = localStorage.getItem('token');
  const response = await axiosInstance.get<ApiResponse<ScheduleAttendanceData>>(
    `/attendance/sessions/${scheduleId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.data.data) {
    throw new Error('No data received from server');
  }
  return response.data.data;
};

// Generate QR code for a session
export const generateQR = async (
  sessionId: number,
  actualDate?: string
): Promise<{ qrCode: string; sessionId: number }> => {
  const token = localStorage.getItem('token');
  const response = await axiosInstance.post<ApiResponse<{ qrCode: string; sessionId: number }>>(
    `/attendance/generate-qr/${sessionId}`,
    actualDate ? { date: actualDate } : {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.data.data) {
    throw new Error('No data received from server');
  }
  return response.data.data;
};

// Manual check-in for a student
export const manualCheckIn = async (
  sessionId: number,
  studentId: number | string,
  actualDate?: string
): Promise<{ success: boolean; message: string; time?: string }> => {
  const token = localStorage.getItem('token');
  const response = await axiosInstance.post<ApiResponse<{ success: boolean; message: string; time?: string }>>(
    `/attendance/manual-checkin/${sessionId}`,
    actualDate ? { studentId: Number(studentId), date: actualDate } : { studentId: Number(studentId) },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.data.data) {
    throw new Error('No data received from server');
  }
  return response.data.data;
};

// Get full attendance history with all registered students
export const getFullAttendanceHistory = async (
  sessionId: number,
  date?: string
): Promise<FullAttendanceData> => {
  const token = localStorage.getItem('token');
  const url = date 
    ? `/attendance/full-history/${sessionId}?date=${encodeURIComponent(date)}`
    : `/attendance/full-history/${sessionId}`;
  
  const response = await axiosInstance.get<ApiResponse<FullAttendanceData>>(
    url,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.data.data) {
    throw new Error('No data received from server');
  }
  return response.data.data;
};

// Student check-in with QR code
export const studentCheckIn = async (
  sessionId: number,
  qrCode: string
): Promise<{ success: boolean; message: string; time?: string }> => {
  const token = localStorage.getItem('token');
  const response = await axiosInstance.post<ApiResponse<{ success: boolean; message: string; time?: string }>>(
    `/attendance/checkin/${sessionId}`,
    { qrCode },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.data.data) {
    throw new Error('No data received from server');
  }
  return response.data.data;
};

// Cancel student attendance
export const cancelAttendance = async (
  sessionId: number,
  studentId: number,
  actualDate?: string
): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem('token');
  const response = await axiosInstance.delete<ApiResponse<{ success: boolean; message: string }>>(
    `/attendance/cancel/${sessionId}/${studentId}`,
    actualDate ? { 
      data: { date: actualDate },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } : {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.data.data) {
    throw new Error('No data received from server');
  }
  return response.data.data;
};

// Get student's attendance records
export const getStudentAttendanceRecords = async (): Promise<StudentAttendanceRecord[]> => {
  const token = localStorage.getItem('token');
  const response = await axiosInstance.get<ApiResponse<StudentAttendanceRecord[]>>(
    '/attendance/student',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.data.data) {
    throw new Error('No data received from server');
  }
  return response.data.data;
};

// Get student's attendance records by courseId
export interface CourseAttendanceRecord {
  id: number;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  scheduleId: number;
  checkedIn: boolean;
  checkInTime: string | null;
  checkInCreatedAt: string | null;
}

export const getStudentAttendanceByCourseId = async (
  courseId: number
): Promise<CourseAttendanceRecord[]> => {
  const token = localStorage.getItem('token');
  const response = await axiosInstance.get<ApiResponse<CourseAttendanceRecord[]>>(
    `/attendance/student/course/${courseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.data.data) {
    throw new Error('No data received from server');
  }
  return response.data.data;
};

// Get a student's attendance records for parent account
export const getStudentAttendanceForParent = async (
  studentId: number
): Promise<StudentAttendanceRecord[]> => {
  const token = localStorage.getItem('token');
  const response = await axiosInstance.get<ApiResponse<StudentAttendanceRecord[]>>(
    `/attendance/parent/student/${studentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.data.data) {
    throw new Error('No data received from server');
  }
  return response.data.data;
};
