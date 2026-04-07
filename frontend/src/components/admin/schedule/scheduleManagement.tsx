import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
} from "@material-tailwind/react";
import type { ScheduleResponse } from "../../../types/schedule/schedule.response";
import {
  getAllSchedules,
  searchSchedulesAdvanced,
} from "../../../services/schedule.service";
import SchedulePagination from "../../../components/course-detail/schedulePagination";
import ScheduleTable from "../../../components/admin/schedule/scheduleManagement/scheduleTable";


const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 5;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState("");

  const hasFilters = Boolean(selectedCourse || selectedStartDate);

  const fetchSchedules = async (targetPage = page) => {
    try {
      setLoading(true);
      const res = hasFilters
        ? await searchSchedulesAdvanced(targetPage, limit, {
            courseName: selectedCourse || undefined,
            startDate: selectedStartDate || undefined,
          })
        : await getAllSchedules(targetPage, limit);
      const nextSchedules = res.data?.data ?? [];
      const nextTotalItems = res.data?.totalItems ?? 0;
      const nextTotalPages = res.data?.totalPages ?? 0;

      // If deleting the last item of the last page, go back to a valid page automatically.
      if (nextSchedules.length === 0 && targetPage > 1 && nextTotalPages > 0) {
        const fallbackPage = Math.min(targetPage - 1, nextTotalPages);
        if (fallbackPage !== page) {
          setPage(fallbackPage);
        }
        return;
      }

      setSchedules(nextSchedules);
      setTotalItems(nextTotalItems);
      setTotalPages(nextTotalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules(page);
  }, [page, selectedCourse, selectedStartDate]);

  const courseOptions = useMemo(() => {
    const names = schedules
      .map((schedule) => schedule.course?.name)
      .filter((name): name is string => Boolean(name));

    return Array.from(new Set(names));
  }, [schedules]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-xl border border-gray-200">
        <CardHeader
          floated={false}
          shadow={false}
          className="rounded-none bg-gradient-to-r from-blue-600 to-blue-400 p-6"
        >
          <div>
            <Typography variant="h4" color="white" className="font-bold">
              Quản Lý đợt mở lớp học
            </Typography>
            <Typography variant="small" color="white" className="mt-1 opacity-90">
              Tổng số: {totalItems} đợt mở lớp
            </Typography>
          </div>
        </CardHeader>

        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-gray-300 px-3 py-2 sm:flex-row sm:items-center sm:gap-2">
              <label className="text-xs font-semibold text-gray-600 sm:whitespace-nowrap sm:text-sm">Ngày bắt đầu</label>
              <input
                type="date"
                value={selectedStartDate}
                onChange={(e) => {
                  setSelectedStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full min-w-0 text-sm focus:outline-none"
              />
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Tất cả khóa học</option>
              {courseOptions.map((courseName) => (
                <option key={courseName} value={courseName}>
                  {courseName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSelectedCourse("");
                setSelectedStartDate("");
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Xóa bộ lọc
            </button>
          </div>

          <ScheduleTable
            schedules={schedules}
            loading={loading}
            onReload={() => fetchSchedules(page)}
          />
          <SchedulePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default ScheduleManagement;
