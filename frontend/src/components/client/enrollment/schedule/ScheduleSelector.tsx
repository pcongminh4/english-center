import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Chip,
  Checkbox,
} from "@material-tailwind/react";
import { useEnrollmentStore } from "../../../../stores/enrollment.store";
import { getAvailableSchedules } from "../../../../services/enrollment.service";
import type { AvailableSchedule } from "../../../../types/enrollment/response";
import { toast } from "react-toastify";

const ScheduleSelector = () => {
  const {
    tokenData,
    setSelectedSchedule,
    setStep,
    scheduleFilterMonth,
    scheduleFilterTeacher,
    scheduleFilterAvailableOnly,
    setScheduleFilter,
    resetScheduleFilters,
  } = useEnrollmentStore();
  const [schedules, setSchedules] = useState<AvailableSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  // Local state for filter values - initialized from store once
  const [localFilterMonth, setLocalFilterMonth] = useState(() => scheduleFilterMonth);
  const [localFilterTeacher, setLocalFilterTeacher] = useState(() => scheduleFilterTeacher);

  // Handle month filter change
  const handleMonthChange = useCallback((val: string | undefined) => {
    const newVal = val ?? "";
    setLocalFilterMonth(newVal);
    setScheduleFilter({ month: newVal });
    setSelected(null);
  }, [setScheduleFilter]);

  // Handle teacher filter change
  const handleTeacherChange = useCallback((val: string | undefined) => {
    const newVal = val ?? "";
    setLocalFilterTeacher(newVal);
    setScheduleFilter({ teacher: newVal });
    setSelected(null);
  }, [setScheduleFilter]);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!tokenData) return;
      try {
        const res = await getAvailableSchedules(tokenData.admissionType);
        setSchedules(res.data ?? []);
      } catch {
        toast.error("Lỗi tải danh sách lịch học");
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [tokenData]);

  // ─── Derived filter options ───
  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    schedules.forEach((s) => {
      const d = new Date(s.startTime);
      seen.add(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      );
    });
    return [...seen].sort();
  }, [schedules]);

  const teacherOptions = useMemo(() => {
    const seen = new Set<string>();
    schedules.forEach((s) => seen.add(s.teacher.fullname));
    return [...seen].sort();
  }, [schedules]);

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      if (scheduleFilterAvailableOnly && s.available <= 0) return false;
      if (scheduleFilterMonth) {
        const d = new Date(s.startTime);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key !== scheduleFilterMonth) return false;
      }
      if (scheduleFilterTeacher && s.teacher.fullname !== scheduleFilterTeacher) return false;
      return true;
    });
  }, [schedules, scheduleFilterAvailableOnly, scheduleFilterMonth, scheduleFilterTeacher]);

  const handleContinue = () => {
    const schedule = schedules.find((s) => s.id === selected);
    if (!schedule) {
      toast.error("Vui lòng chọn lịch học");
      return;
    }
    setSelectedSchedule(schedule);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatPrice = (price: number, sale: number) => {
    const final = Math.round(price * (1 - sale / 100));
    return final.toLocaleString("vi-VN") + "đ";
  };

  const formatMonthLabel = (ym: string) => {
    const [year, month] = ym.split("-");
    return `Tháng ${month}/${year}`;
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <Typography>Đang tải danh sách lịch học...</Typography>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <Typography variant="h5">Chọn lịch học</Typography>
          <Button
            variant="text"
            size="sm"
            onClick={() => setStep("student-form")}
          >
            Quay lại
          </Button>
        </div>

        {/* ─── Filter Panel ─── */}
        <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-4 items-end" key={`filter-panel-${schedules.length}`}>
          <Typography variant="small" className="font-semibold w-full mb-1">
            Bộ lọc
          </Typography>

          {/* Month filter */}
          <div className="w-48">
            <div className="relative">
              <label className="block text-xs text-gray-500 mb-1">Tháng bắt đầu</label>
              <select
                value={localFilterMonth}
                onChange={(e) => handleMonthChange(e.target.value || undefined)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Tất cả</option>
                {monthOptions.map((m) => (
                  <option key={`month-${m}`} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher filter */}
          <div className="w-48">
            <div className="relative">
              <label className="block text-xs text-gray-500 mb-1">Giáo viên</label>
              <select
                value={localFilterTeacher}
                onChange={(e) => handleTeacherChange(e.target.value || undefined)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Tất cả</option>
                {teacherOptions.map((t) => (
                  <option key={`teacher-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available-only toggle */}
          <div className="flex items-center">
            <Checkbox
              id="available-only"
              checked={scheduleFilterAvailableOnly}
              onChange={(e) => {
                setScheduleFilter({ availableOnly: e.target.checked });
                setSelected(null);
              }}
              label="Chỉ hiển thị còn chỗ"
              crossOrigin={undefined}
            />
          </div>

          {/* Reset */}
          {(scheduleFilterMonth || scheduleFilterTeacher || scheduleFilterAvailableOnly) && (
            <Button
              variant="text"
              size="sm"
              color="gray"
              onClick={() => {
                resetScheduleFilters();
                setLocalFilterMonth("");
                setLocalFilterTeacher("");
                setSelected(null);
              }}
            >
              Xoá bộ lọc
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <Typography color="gray">
            {schedules.length === 0
              ? "Hiện tại chưa có lịch học phù hợp."
              : "Không có lịch học nào khớp với bộ lọc."}
          </Typography>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <div
                key={s.id}
                onClick={() => s.available > 0 && setSelected(s.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selected === s.id
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : s.available > 0
                      ? "border-gray-300 hover:border-blue-300"
                      : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                }`}
              >
                <Typography variant="h6" color="blue-gray">
                  {s.course.name}
                </Typography>
                <div className="mt-2 space-y-1">
                  <Typography variant="small" color="gray">
                    Giáo viên: {s.teacher.fullname}
                  </Typography>
                  <Typography variant="small" color="gray">
                    Phòng: {s.classroom.name}
                  </Typography>
                  <Typography variant="small" color="gray">
                    Thời gian: {formatDate(s.startTime)} -{" "}
                    {formatDate(s.endTime)}
                  </Typography>
                  <Typography variant="small" color="gray">
                    Số buổi: {s.course.totalSession}
                  </Typography>
                  <div className="flex items-center gap-2 mt-2">
                    <Typography variant="small" className="font-bold">
                      Giá: {formatPrice(s.course.price, s.course.sale)}
                    </Typography>
                    {s.course.sale > 0 && (
                      <Chip
                        value={`-${s.course.sale}%`}
                        size="sm"
                        color="red"
                      />
                    )}
                  </div>
                  <Chip
                    value={
                      s.available > 0
                        ? `Còn ${s.available} chỗ`
                        : "Hết chỗ"
                    }
                    size="sm"
                    color={s.available > 0 ? "green" : "red"}
                    className="mt-1 w-fit"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            color="blue"
            disabled={!selected}
          >
            Xác nhận lịch học
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default ScheduleSelector;
