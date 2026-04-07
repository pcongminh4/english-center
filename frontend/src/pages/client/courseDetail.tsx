import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { useParams } from 'react-router';
import type { Course } from '../../types/course/response';
import type { ScheduleResponse } from '../../types/schedule/schedule.response';
import { getCourseById } from '../../services/course.service';
import { getActiveSchedules } from '../../services/schedule.service';

import SchedulePagination from '../../components/course-detail/schedulePagination';
import { CourseHeader } from '../../components/course-detail/CourseHeader';
import InstructorCard from '../../components/course-detail/InstructorCard';


export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(3);
  const [totalPages, setTotalPages] = useState(1);

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

    const fetchSchedules = async () => {
      try {
        const res = await getActiveSchedules(page, limit, courseId);
        setSchedules(res.data?.data ?? []);
        console.log(res.data?.totalPages);
        setTotalPages(res.data?.totalPages ?? 1);
      } catch (error) {
        console.error("Failed to fetch schedules", error);
      }
    };

    fetchSchedules();
  }, [courseId, page, limit]);



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
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Chọn lịch học cho bạn</h2>
            <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
              <Filter size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {schedules.map((schedule) => (
              <InstructorCard
                key={schedule.id}
                schedule={schedule}
              />
            ))}
          </div>

          {/* Pagination */}
          <SchedulePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />

        </section>

      </div>
    </div>
  );
}