import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { getEnrolledCourses } from '../../services/course.service';
import type { Course } from '../../types/course/response';

export const Courses = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCourseClick = (courseId: number) => {
    navigate(`/student/courses/${courseId}`);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await getEnrolledCourses();
        if (res.success && res.data) {
          setCourses(res.data);
        }
      } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError('Không thể tải khóa học.');
        toast.error('Không thể tải khóa học', {
          position: 'top-right',
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">
            Các khóa học đã đăng ký
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Tổng số khóa học: {courses.length}
          </p>
        </div>

        <div className="p-6">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chưa đăng ký khóa học nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: Course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-300 transition-shadow cursor-pointer"
                >
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.name}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
                      {course.name}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <strong>Kỹ năng:</strong> {course.courseSkill}
                      </p>
                      <p>
                        <strong>Loại:</strong> {course.type}
                      </p>
                      <p>
                        <strong>Trạng thái:</strong>{' '}
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            course.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : course.status === 'PLANNING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {course.status}
                        </span>
                      </p>
                      <p>
                        <strong>Giá:</strong>{' '}
                        {course.sale > 0 ? (
                          <>
                            <span className="line-through text-gray-400 mr-2">
                              {Number(course.price).toLocaleString()} VNĐ
                            </span>
                            <span className="text-red-600 font-semibold">
                              {(Number(course.price) * (1 - course.sale / 100)).toLocaleString()} VNĐ
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold">
                            {Number(course.price).toLocaleString()} VNĐ
                          </span>
                        )}
                        {course.sale > 0 && (
                          <span className="ml-2 text-xs text-red-600">
                            -{course.sale}%
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
