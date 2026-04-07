import { BookOpen, User, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: number;
  name: string;
  progress: number;
  teacherName: string;
  startDate?: string;
  classroom?: string;
  sessions?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

interface CourseCardsProps {
  courses: Course[];
}

export const CourseCards = ({ courses }: CourseCardsProps) => {
  const navigate = useNavigate();

  const handleCourseClick = (courseId: number) => {
    navigate(`/student/courses/${courseId}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Khóa học của bạn
        </h2>
        <p className="text-sm text-gray-600">
          Theo dõi tiến độ học tập
        </p>
      </div>

      <div className="p-6">
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-sm">
              Chưa có khóa học nào
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleCourseClick(course.id)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-shadow duration-200 cursor-pointer"
              >
                {/* Course Name */}
                <h3 className="font-semibold text-gray-800 mb-3 line-clamp-2">
                  {course.name}
                </h3>

                {/* Teacher Info */}
                <div className="flex items-center gap-2 mb-3">
                  <User className="text-blue-600" size={16} />
                  <span className="text-sm text-gray-600">{course.teacherName}</span>
                </div>

                {/* Start Date & Classroom */}
                {course.startDate && (
                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>Bắt đầu: {formatDate(course.startDate)}</span>
                    </div>
                    {course.classroom && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{course.classroom}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Schedule Sessions */}
                {course.sessions && course.sessions.length > 0 && (
                  <div className="mb-3 space-y-1">
                    <div className="text-xs text-gray-700 font-medium">Lịch học:</div>
                    <div className="flex flex-wrap gap-1">
                      {course.sessions.slice(0, 3).map((session, idx) => (
                        <div
                          key={idx}
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200"
                        >
                          <div className="font-medium">{session.day}</div>
                          <div className="text-xs">{session.startTime}-{session.endTime}</div>
                        </div>
                      ))}
                      {course.sessions.length > 3 && (
                        <div className="text-xs text-gray-500 self-center">
                          +{course.sessions.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-indigo-600" size={16} />
                      <span className="text-sm font-medium text-gray-700">
                        Tiến độ
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};