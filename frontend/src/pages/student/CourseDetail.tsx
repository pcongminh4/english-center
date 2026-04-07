import { useEffect, useState } from 'react';
import { Star, TrendingUp, BookOpen, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useParams } from 'react-router';
import type { Course } from '../../types/course/response';
import { getCourseById } from '../../services/course.service';
import { getStudentScheduleByCourseId } from '../../services/schedule.service';
import { getStudentScoresByCourseService, type CourseScoreData } from '../../services/score-course.service';

import { CourseHeader } from '../../components/course-detail/CourseHeader';
import type { StudentScheduleByIdResponse } from '../../types/schedule/student-schedule.response';


export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<StudentScheduleByIdResponse | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
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
          setSchedule(res.data);
        } else {
          setSchedule(null);
        }
      } catch (error) {
        console.error("Failed to fetch schedule", error);
        setSchedule(null);
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;

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
  }, [courseId]);

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

  if (loading) {
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
  }

  if (!course) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy khóa học</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        <CourseHeader course={course} />

        {/* Schedule Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-6">Lịch học của bạn</h2>
          
          {scheduleLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : schedule ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-md shadow-gray-200/60 p-6">
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

        {/* Scores Section */}
        <section className="mt-8">
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

      </div>
    </div>
  );
}