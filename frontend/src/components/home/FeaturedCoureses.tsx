import React, { useEffect, useState } from 'react';
import ScheduleCard from './ScheduleCard';
import { getActiveCoursesWithFutureSchedules } from '../../services/course.service';
import type { Course } from '../../types/course/response';
import { Calendar } from 'lucide-react';

const FeaturedCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveCoursesWithFutureSchedules()
      .then(res => setCourses(res.data ?? []))
      .catch(err => console.error("API ERROR:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-12 px-4 bg-[#F8FAFC] relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-20 w-full">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
              Khóa học TOEIC{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                tiêu biểu nhất
              </span>
            </h2>

            <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              Cam kết đầu ra bằng văn bản. Lộ trình cá nhân hóa giúp bạn chinh phục mục tiêu{' '}
              <span className="text-blue-600 font-bold underline decoration-blue-200 underline-offset-4">nhanh hơn 40%</span>.
            </p>

          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] bg-gray-200 animate-pulse rounded-[2rem]"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="group transition-all duration-500 hover:-translate-y-3"
                >
                  <div className="rounded-[2.5rem] transition-all duration-500
                  shadow-[0_20px_50px_rgba(0,0,0,0.04)] 
                  group-hover:shadow-[0_40px_80px_rgba(59,130,246,0.15)]">

                    <ScheduleCard course={course} />

                  </div>
                </div>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="text-center py-12 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-blue-100/20 flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="w-10 h-10 text-blue-300" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Chưa có lịch khai giảng</h3>
                <p className="text-gray-400 font-medium max-w-sm mx-auto">
                  Hiện tại các lớp đã đủ sĩ số. Vui lòng để lại thông tin để nhận thông báo sớm nhất khi có lớp mới!
                </p>
                <button className="mt-8 bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-colors">
                  Nhận thông báo
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedCourses;