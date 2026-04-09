import { useEffect, useState } from 'react';
import { Star, TrendingUp, BookOpen, Calendar, MapPin, Users, Clock, QrCode, ClipboardCheck, BarChart3 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import type { Course } from '../../types/course/response';
import { getCourseById } from '../../services/course.service';
import { getStudentScheduleByCourseId } from '../../services/schedule.service';
import { getStudentAttendanceByCourseId, type CourseAttendanceRecord } from '../../services/attendance.service';
import { getStudentScoresByCourseService, type CourseScoreData } from '../../services/score-course.service';

import { CourseHeader } from '../../components/course-detail/CourseHeader';
import type { StudentScheduleByIdResponse } from '../../types/schedule/student-schedule.response';

type TabType = 'schedule' | 'scores';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  // Schedule state
  const [schedules, setSchedules] = useState<StudentScheduleByIdResponse[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<CourseAttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Scores state
  const [courseScores, setCourseScores] = useState<CourseScoreData | null>(null);
  const [scoresLoading, setScoresLoading] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await getCourseById(courseId);
        if (res.success && res.data) {
          setCourse(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch course detail", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;

    const fetchSchedule = async () => {
      try {
        setScheduleLoading(true);
        const res = await getStudentScheduleByCourseId(courseId);
        if (res.success && res.data) {
          setSchedules(res.data);
        } else {
          setSchedules([]);
        }
      } catch (error) {
        console.error("Failed to fetch schedule", error);
        setSchedules([]);
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, [courseId]);

  useEffect(() => {
    if (!courseId || activeTab !== 'schedule') return;

    const fetchAttendance = async () => {
      try {
        setAttendanceLoading(true);
        const data = await getStudentAttendanceByCourseId(courseId);
        setAttendanceRecords(data);
      } catch (error) {
        console.error("Failed to fetch attendance", error);
        setAttendanceRecords([]);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, [courseId, activeTab]);

  useEffect(() => {
    if (!courseId || activeTab !== 'scores') return;

    const fetchScores = async () => {
      try {
        setScoresLoading(true);
        const res = await getStudentScoresByCourseService(courseId);
        if (res.success && res.data) {
          setCourseScores(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch scores", error);
      } finally {
        setScoresLoading(false);
      }
    };

    fetchScores();
  }, [courseId, activeTab]);

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 70) return 'bg-blue-100 text-blue-700';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDayLabel = (day: string) => {
    const dayMap: Record<string, string> = {
      MONDAY: 'Thứ 2',
      TUESDAY: 'Thứ 3',
      WEDNESDAY: 'Thứ 4',
      THURSDAY: 'Thứ 5',
      FRIDAY: 'Thứ 6',
      SATURDAY: 'Thứ 7',
      SUNDAY: 'Chủ nhật',
    };
    return dayMap[day] || day;
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
  }

  if (!course) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy khóa học</div>;
  }

  // Get today's date string in Vietnam timezone (YYYY-MM-DD)
  const getTodayVN = () => {
    const now = new Date();
    const vietnamOffset = 7 * 60;
    const vietnamTime = new Date(now.getTime() + (vietnamOffset + now.getTimezoneOffset()) * 60000);
    return `${vietnamTime.getFullYear()}-${String(vietnamTime.getMonth() + 1).padStart(2, '0')}-${String(vietnamTime.getDate()).padStart(2, '0')}`;
  };

  // Filter out future sessions and sort by date descending
  const todayStr = getTodayVN();
  const filteredAttendance = attendanceRecords
    .filter(r => r.date.split('T')[0] <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Group filtered attendance records by scheduleId
  const attendanceBySchedule = filteredAttendance.reduce((acc, record) => {
    const key = record.scheduleId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<number, CourseAttendanceRecord[]>);

  // Calculate overall attendance stats
  const totalSessions = filteredAttendance.length;
  const attendedSessions = filteredAttendance.filter(r => r.checkedIn).length;
  const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        <CourseHeader course={course} />

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'schedule'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardCheck size={18} />
            Lịch học & Điểm danh
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'scores'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 size={18} />
            Điểm số
          </button>
        </div>

        {/* Tab Content: Schedule & Attendance */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* QR Scan Button */}
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/student/scan-qr')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <QrCode size={20} />
                Điểm danh QR
              </button>
            </div>

            {/* Overall Attendance Stats */}
            {totalSessions > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tổng số buổi</p>
                      <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Calendar size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Đã điểm danh</p>
                      <p className="text-3xl font-bold text-green-600">{attendedSessions}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <ClipboardCheck size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tỷ lệ điểm danh</p>
                      <p className="text-3xl font-bold text-purple-600">{attendanceRate}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Cards with Attendance */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Lịch học của bạn</h2>
              
              {scheduleLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : schedules.length > 0 ? (
                <div className="space-y-8">
                  {schedules.map((schedule, index) => {
                    const scheduleAttendance = attendanceBySchedule[schedule.id] || [];
                    const scheduleTotal = scheduleAttendance.length;
                    const scheduleAttended = scheduleAttendance.filter(r => r.checkedIn).length;
                    const scheduleRate = scheduleTotal > 0 ? Math.round((scheduleAttended / scheduleTotal) * 100) : 0;

                    return (
                      <div key={schedule.id} className="bg-white rounded-xl border border-gray-100 shadow-md shadow-gray-200/60 overflow-hidden">
                        {/* Schedule Card */}
                        <div className="p-6">
                          {/* Schedule header */}
                          {schedules.length > 1 && (
                            <div className="mb-4 pb-4 border-b border-gray-100">
                              <h3 className="text-lg font-bold text-blue-600">Lịch học {index + 1}</h3>
                            </div>
                          )}

                          {/* Teacher Info */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-full">
                                <Users size={24} className="text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-sm text-gray-500">Giảng viên</h3>
                                <h3 className="font-bold text-gray-800 text-lg">{schedule.teacher?.fullname}</h3>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users size={18} />
                                <span>{schedule.totalRegister}/{schedule.totalSlot} học viên</span>
                              </div>
                            </div>
                          </div>

                          {/* Schedule Details */}
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Calendar size={20} className="text-blue-600" />
                                <div>
                                  <p className="text-xs text-gray-500">Ngày bắt đầu</p>
                                  <p className="font-semibold text-gray-800">{formatDate(schedule.startTime)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Calendar size={20} className="text-green-600" />
                                <div>
                                  <p className="text-xs text-gray-500">Ngày kết thúc</p>
                                  <p className="font-semibold text-gray-800">{formatDate(schedule.endTime)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <MapPin size={20} className="text-purple-600" />
                                <div>
                                  <p className="text-xs text-gray-500">Phòng học</p>
                                  <p className="font-semibold text-gray-800">{schedule.classroom?.name}</p>
                                </div>
                              </div>
                            </div>

                            {/* Sessions */}
                            <div className="mt-6">
                              <h4 className="text-sm font-bold text-gray-700 uppercase mb-4">
                                Thời khóa biểu hàng tuần
                              </h4>

                              {schedule.sessions && schedule.sessions.length > 0 ? (
                                <div className="grid md:grid-cols-3 gap-3">
                                  {schedule.sessions.map((session) => (
                                    <div
                                      key={session.id}
                                      className="bg-gray-50 rounded-lg p-4 flex items-center gap-3"
                                    >
                                      <Clock size={18} className="text-blue-600" />
                                      <div className="flex-1">
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                                          {session.day}
                                        </span>
                                        <div className="mt-2 text-sm text-gray-600">
                                          {session.startTime} - {session.endTime}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                                  Không có lịch học nào được thiết lập cho lịch này.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Attendance History for this Schedule */}
                        {attendanceLoading ? (
                          <div className="flex items-center justify-center py-8 border-t border-gray-100">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        ) : scheduleTotal > 0 ? (
                          <div className="border-t border-gray-100 bg-gray-50/50">
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-gray-700 uppercase">
                                  Lịch sử điểm danh
                                </h4>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-gray-500">
                                    {scheduleAttended}/{scheduleTotal} buổi
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    scheduleRate >= 80 ? 'bg-green-100 text-green-700' :
                                    scheduleRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {scheduleRate}%
                                  </span>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                          Ngày
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                          Thứ
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                                          Thời gian
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                                          Trạng thái
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                                          Giờ điểm danh
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {scheduleAttendance.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                            {formatDate(record.date)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-600">
                                            {getDayLabel(record.day)}
                                          </td>
                                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                                            {record.startTime} - {record.endTime}
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            {record.checkedIn ? (
                                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Có mặt
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Vắng mặt
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                                            {record.checkInTime || '—'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border-t border-gray-100 bg-gray-50/50 p-6 text-center">
                            <p className="text-sm text-gray-500">Chưa có lịch sử điểm danh cho lịch học này</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Chưa có lịch học
                  </h3>
                  <p className="text-gray-600">
                    Bạn chưa đăng ký lịch học cho khóa học này
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab Content: Scores */}
        {activeTab === 'scores' && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Điểm số của bạn trong khóa học này</h2>
            
            {scoresLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : courseScores && courseScores.totalTests > 0 ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tổng số bài kiểm tra</p>
                        <p className="text-3xl font-bold text-gray-900">{courseScores.totalTests}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <BookOpen size={24} className="text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Điểm trung bình</p>
                        <p className="text-3xl font-bold text-gray-900">{courseScores.averageScore}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <TrendingUp size={24} className="text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Điểm cao nhất</p>
                        <p className="text-3xl font-bold text-gray-900">{courseScores.highestScore}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <Star size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scores Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Bài kiểm tra
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                            Điểm số
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                            Ngày thi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {courseScores.scores.map((score) => (
                          <tr key={score.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-gray-700 font-medium">{score.testName}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${getScoreBadge(score.score)}`}
                              >
                                <Star size={18} />
                                {score.score}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-gray-600">
                              {formatDate(score.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Chưa có điểm số
                </h3>
                <p className="text-gray-600">
                  Bạn chưa có kết quả bài kiểm tra nào trong khóa học này
                </p>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}