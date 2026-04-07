import { useNavigate } from "react-router";
import type { ScheduleResponse } from "../../../../types/schedule/schedule.response";
import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { deleteSchedule, updateSchedule } from "../../../../services/schedule.service";
import { useEffect, useState } from "react";
import type { UpdateScheduleRequest } from "../../../../types/schedule/update-schedule.request";
import { getAllTeachersService } from "../../../../services/teacher.service";
import { getAllClassrooms } from "../../../../services/classroom.service";
import type { TeacherResponse } from "../../../../types/teacher/response";
import type { Classroom } from "../../../../types/classroom/response";

interface ScheduleTableProps {
  schedules: ScheduleResponse[];
  loading: boolean;
  onReload?: () => Promise<void>;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules,
  loading,
  onReload,
}) => {
  const navigate = useNavigate();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleResponse | null>(null);
  const [editTeacherId, setEditTeacherId] = useState("");
  const [editClassroomId, setEditClassroomId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editTotalSessions, setEditTotalSessions] = useState("");
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const toDateLocal = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  };

  const dayToIndex: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  const calculateEndDateBySessions = (
    startDate: Date,
    totalSessions: number,
    sessionDays: string[],
  ) => {
    const dayIndexes = new Set(
      sessionDays
        .map((day) => dayToIndex[day])
        .filter((day): day is number => day !== undefined),
    );

    if (dayIndexes.size === 0) {
      throw new Error("NO_SESSION_DAYS");
    }

    const cursor = new Date(startDate);
    let counted = 0;

    while (counted < totalSessions) {
      if (dayIndexes.has(cursor.getDay())) {
        counted += 1;
        if (counted === totalSessions) {
          return new Date(cursor);
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return new Date(cursor);
  };

  const closeUpdateModal = () => {
    setEditingSchedule(null);
    setEditTeacherId("");
    setEditClassroomId("");
    setEditStartDate("");
    setEditTotalSessions("");
    setUpdateError(null);
  };

  useEffect(() => {
    const loadOptions = async () => {
      if (!editingSchedule) return;
      try {
        setLoadingOptions(true);
        const [teacherRes, classroomRes] = await Promise.all([
          getAllTeachersService({ page: 1, limit: 500 }),
          getAllClassrooms({ page: 1, limit: 500 }),
        ]);

        setTeachers(teacherRes.data?.data ?? []);
        setClassrooms(classroomRes.data?.data ?? []);
      } catch (error) {
        console.error("Load update modal options failed:", error);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [editingSchedule]);

  const handleDelete = async (scheduleId: number) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa đợt mở lớp này?");
    if (!confirmed) return;

    try {
      setActionLoadingId(scheduleId);
      await deleteSchedule(scheduleId);
      await onReload?.();
    } catch (error) {
      console.error("Delete schedule failed:", error);
      alert("Không thể xóa đợt mở lớp. Vui lòng thử lại.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openUpdateModal = (schedule: ScheduleResponse) => {
    setEditingSchedule(schedule);
    setEditTeacherId(String(schedule.teacher?.id ?? ""));
    setEditClassroomId(String(schedule.classroom?.id ?? ""));
    setEditStartDate(toDateLocal(schedule.startTime));
    setEditTotalSessions(String(schedule.course?.totalSession ?? 0));
    setUpdateError(null);
  };

  const handleUpdateSubmit = async () => {
    if (!editingSchedule) return;

    if (!editTeacherId || !editClassroomId || !editStartDate || !editTotalSessions) {
      setUpdateError("Vui lòng chọn giáo viên, lớp học, ngày bắt đầu và số buổi học.");
      return;
    }

    const teacherId = Number(editTeacherId);
    const classroomId = Number(editClassroomId);
    const totalSessions = Number(editTotalSessions);
    if (!Number.isInteger(teacherId) || teacherId <= 0 || !Number.isInteger(classroomId) || classroomId <= 0) {
      setUpdateError("teacherId và classroomId phải là số nguyên dương.");
      return;
    }

    if (!Number.isInteger(totalSessions) || totalSessions <= 0) {
      setUpdateError("Số buổi học phải là số nguyên dương.");
      return;
    }

    const nextStartTime = new Date(`${editStartDate}T00:00:00`);
    if (Number.isNaN(nextStartTime.getTime())) {
      setUpdateError("Định dạng ngày bắt đầu không hợp lệ.");
      return;
    }

    const sessionDays = (editingSchedule.sessions ?? []).map((session) => session.day);
    let nextEndTime: Date;
    try {
      nextEndTime = calculateEndDateBySessions(nextStartTime, totalSessions, sessionDays);
    } catch {
      setUpdateError("Lịch này chưa có session day để tính ngày kết thúc.");
      return;
    }

    const payload: UpdateScheduleRequest = {
      teacherId,
      classroomId,
      startTime: nextStartTime.toISOString(),
      endTime: nextEndTime.toISOString(),
    };

    try {
      setActionLoadingId(editingSchedule.id);
      await updateSchedule(editingSchedule.id, payload);
      await onReload?.();
      closeUpdateModal();
    } catch (error) {
      console.error("Update schedule failed:", error);
      setUpdateError("Không thể cập nhật đợt mở lớp. Vui lòng thử lại.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Chưa có đợt mở lớp nào
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left w-[150px]">Khóa học</th>
            <th className="px-6 py-3 text-left w-[100px]">Ngày bắt đầu</th>
            <th className="px-6 py-3 text-left w-[100px]">Ngày kết thúc</th>
            <th className="px-6 py-3 text-left w-[100px]">Giáo viên</th>
            <th className="px-6 py-3 text-left w-[50px]">Sĩ số</th>
            <th className="px-6 py-3 text-left w-[200px]">Buổi</th>
            <th className="px-6 py-3 text-left w-[100px]">Hành động</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {schedules.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                {s.course?.name}
              </td>
              <td className="px-6 py-4">
                {new Date(s.startTime).toLocaleDateString("vi-VN")}
              </td>
              <td className="px-6 py-4">
                {new Date(s.endTime).toLocaleDateString("vi-VN")}
              </td>
              <td className="px-6 py-4">
                {s.teacher?.fullname}
              </td>
              <td className="px-6 py-4">
                {s.totalRegister}/{s.totalSlot}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {s.sessions
                  ?.map(
                    (session) =>
                      `${session.day} (${session.startTime}–${session.endTime})`
                  )
                  .join(", ")}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/admin/schedules/${s.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    title="Xem chi tiết"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>

                  {s.totalRegister === 0 && (
                    <>
                      <button
                        onClick={() => openUpdateModal(s)}
                        disabled={actionLoadingId === s.id}
                        className="text-amber-600 hover:text-amber-800 disabled:opacity-50"
                        title="Cập nhật"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={actionLoadingId === s.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Xóa"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>

            </tr>
          ))}
        </tbody>
        </table>
      </div>

      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Cập nhật lịch học</h3>
              <button
                onClick={closeUpdateModal}
                className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Giáo viên
                  </label>
                  <select
                    value={editTeacherId}
                    onChange={(e) => setEditTeacherId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Chọn giáo viên --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullname}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Lớp học
                  </label>
                  <select
                    value={editClassroomId}
                    onChange={(e) => setEditClassroomId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingOptions && (
                <p className="text-xs text-slate-500">Đang tải danh sách giáo viên và lớp học...</p>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Số buổi học
                </label>
                <input
                  type="number"
                  min={1}
                  value={editTotalSessions}
                  onChange={(e) => setEditTotalSessions(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {updateError && (
                <p className="text-sm text-red-600">{updateError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUpdateSubmit}
                  disabled={actionLoadingId === editingSchedule.id}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoadingId === editingSchedule.id ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScheduleTable;

