import React from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import type { Course } from '../../types/course/response';
import formatPrice from '../../helpers/formatPrice';
import Badge from './Badge';

interface CourseHeaderProps {
  course: Course;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({ course }) => {
  const discountedPrice = course.price - (course.price * course.sale) / 100;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/60 flex flex-col md:flex-row gap-8">

      {/* Image Side */}
      <div className="relative w-full md:w-1/3 h-32 md:h-72 shrink-0">

        {/* Badge */}
        {course.maxBand !== null && course.maxBand > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded shadow-md">
            Target {course.minBand} - {course.maxBand}
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-full h-full rounded-xl overflow-hidden relative shadow-inner">
          <img
            src={course.thumbnail ?? "/default-course.jpg"}
            alt={course.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content Side */}
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge
            icon={BookOpen}
            text={course.courseSkill.replace("_", " & ")}
            colorClass="text-amber-600 bg-amber-50 border border-amber-100"
          />
          <Badge
            icon={GraduationCap}
            text="ETS Format 2026"
            colorClass="text-indigo-600 bg-indigo-50 border border-indigo-100"
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">
            {course.name}
          </h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            Lộ trình tinh gọn giúp bứt phá điểm số TOEIC {course.courseSkill.replace("_", " & ")} trong 2 tháng.
            Tập trung vào kỹ thuật giải đề ETS mới nhất và mẹo tránh bẫy Part 5, 6, 7.
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          {course.sale > 0 ? (
            <>
              <span className="text-gray-400 line-through text-sm font-medium">
                {formatPrice(course.price)}
              </span>

              <span className="text-3xl font-black text-red-600">
                {formatPrice(discountedPrice)}
              </span>

              <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                Flash Sale {course.sale}%
              </span>
            </>
          ) : (
            <span className="text-3xl font-black text-red-500">
              {formatPrice(course.price)}
            </span>
          )}
        </div>


        {/* Requirements section cho TOEIC */}
        {course.minBand!==null && course.minBand > 0 && (
        <div className="relative rounded-xl p-4 border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50">

          <p className="text-[18px] font-bold text-slate-800 flex items-center gap-2">
            Trình độ đầu vào
            <span className="text-blue-600 font-black">
              TOEIC L&amp;R {course.minBand} +
            </span>
          </p>

          <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">
            Học viên sẽ được làm{" "}
            <span className="font-semibold text-slate-700">
              bài kiểm tra đầu vào miễn phí
            </span>{" "}
            do ETS cung cấp, giúp đánh giá chính xác trình độ hiện tại trước khi bắt đầu
            khóa học.
          </p>
        </div>
        )}

      </div>
    </div>
  );
};