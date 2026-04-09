import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../stores/auth.store';
import { getStudentMeService, getStudentParentsService } from '../../services/student.service';
import { getStudentSchedules } from '../../services/schedule.service';
import { studentCheckIn, getStudentAttendanceRecords } from '../../services/attendance.service';
import { StudentProfileCard } from '../../components/student/StudentProfileCard';
import { ParentInfoCard } from '../../components/student/ParentInfoCard';
import { WeeklySchedule } from '../../components/student/WeeklySchedule';
import { CourseCards } from '../../components/student/CourseCards';
import type { StudentResponse } from '../../types/student/response';
import type { ScheduleResponse } from '../../types/schedule/schedule.response';

interface ParentData {
  id: number;
  fullname: string;
  email: string;
  phone: string;
}

interface Course {
  id: number;
  name: string;
  progress: number;
  teacherName: string;
  startDate?: string;
  endDate?: string;
  classroom?: string;
  sessions?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

export const Dashboard = () => {
  const { user } = useAuthStore();
  const [studentData, setStudentData] = useState<StudentResponse | null>(null);
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [checkedInSessions, setCheckedInSessions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter active courses (currently happening)
  const activeCourses = courses.filter(course => {
    if (!course.startDate || !course.endDate) return false;
    const now = new Date();
    const startDate = new Date(course.startDate);
    const endDate = new Date(course.endDate);
    return startDate <= now && now <= endDate;
  });

  // Filter active schedules (currently happening)
  const activeSchedules = schedules.filter(schedule => {
    const now = new Date();
    const startDate = new Date(schedule.startTime);
    const endDate = new Date(schedule.endTime);
    return startDate <= now && now <= endDate;
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch student data - dùng /me endpoint để tự động lấy theo userId từ token
        const studentRes = await getStudentMeService();
        if (studentRes.success && studentRes.data) {
          setStudentData(studentRes.data);
        }

        // Fetch parent data
        const parentsRes = await getStudentParentsService();
        if (parentsRes.success && parentsRes.data && parentsRes.data.length > 0) {
          setParentData(parentsRes.data[0]);
        }

        // Fetch schedules
        const scheduleRes = await getStudentSchedules(1, 100);
        if (scheduleRes.success && scheduleRes.data?.data) {
          setSchedules(scheduleRes.data.data);
          
          // Extract unique courses from schedules with full schedule information
          const uniqueCourses = scheduleRes.data.data
            .filter((schedule, index, self) => 
              index === self.findIndex((s) => s.course.id === schedule.course.id)
            )
            .map((schedule) => ({
              id: schedule.course.id,
              name: schedule.course.name,
              progress: 0, // TODO: Calculate actual progress from completed sessions
              teacherName: schedule.teacher.fullname,
              startDate: schedule.startTime,
              endDate: schedule.endTime,
              classroom: schedule.classroom.name,
              sessions: schedule.sessions ? schedule.sessions.map(session => ({
                day: session.day,
                startTime: session.startTime,
                endTime: session.endTime
              })) : []
            }));
          
          setCourses(uniqueCourses);
        }

        // Fetch student's attendance records to initialize checkedInSessions
        try {
          const attendanceRes = await getStudentAttendanceRecords();
          if (attendanceRes) {
            // Extract session IDs from attendance records
            const attendedSessionIds = attendanceRes
              .map((record) => record.scheduleAttendance?.scheduleSession?.id)
              .filter(Boolean);
            console.log('[DASHBOARD] Loaded attendance records:', attendedSessionIds);
            setCheckedInSessions(attendedSessionIds);
          }
        } catch (err) {
          console.error('[DASHBOARD] Error fetching attendance records:', err);
          // Don't show toast for this error, just log it
        }

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        toast.error('Không thể tải dữ liệu', {
          position: 'top-right',
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCheckIn = async (sessionId: number, qrCode: string) => {
    try {
      await studentCheckIn(sessionId, qrCode);
      setCheckedInSessions(prev => [...prev, sessionId]);
      // Success toast is handled by AttendanceButton component
    } catch (err: any) {
      console.error('Error checking in:', err);
      // Error toast is also handled by AttendanceButton component
      throw err; // Re-throw to let AttendanceButton handle error display
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Lỗi</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StudentProfileCard
          studentId={studentData?.id.toString() || 'N/A'}
          fullname={studentData?.fullname || user?.fullname || 'Chưa cập nhật'}
          dob={studentData?.dob ? new Date(studentData.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
          currentClass="TOEIC Reading 1"
        />
        <ParentInfoCard
          parentName={parentData?.fullname || 'Chưa cập nhật'}
          emergencyPhone={parentData?.phone || 'Chưa cập nhật'}
          relationship="Phụ huynh"
        />
      </div>

      {/* Weekly Schedule - Active Schedules Only */}
      {activeSchedules.length > 0 ? (
        <WeeklySchedule
          sessions={activeSchedules.flatMap((schedule) => 
            (schedule.sessions || []).map((session) => ({
              id: session.id,
              className: schedule.course.name,
              time: `${session.startTime} - ${session.endTime}`,
              classroom: `Phòng ${schedule.classroom.name}`,
              building: 'Tòa nhà A',
              teacherName: schedule.teacher.fullname,
              dayOfWeek: session.day,
            }))
          )}
          onCheckIn={handleCheckIn}
          checkedInSessions={checkedInSessions}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500">
            {schedules.length === 0 ? 'Chưa có lịch học nào' : 'Hiện tại không có lịch học đang diễn ra'}
          </p>
        </div>
      )}

      {/* Course Cards - Active Courses Only */}
      <CourseCards courses={activeCourses} />
    </div>
  );
};