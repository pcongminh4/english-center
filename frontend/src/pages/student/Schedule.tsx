import { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { CalendarDays, GraduationCap, MapPin } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { getStudentSchedules } from '../../services/schedule.service';
import formatDate from '../../helpers/formatDate';
import type { ScheduleResponse } from '../../types/schedule/schedule.response';

const dayLabelMap: Record<string, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

const orderedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const createSlotKey = (from: string, to: string) => `${from}-${to}`;

export const Schedule = () => {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all active and planned schedules (exclude finished ones)
        const res = await getStudentSchedules(1, 100);
        if (res.success && res.data) {
          setSchedules(res.data.data);
        }
      } catch (err: any) {
        console.error('Error fetching schedules:', err);
        setError('Không thể tải lịch học.');
        toast.error('Không thể tải lịch học', {
          position: 'top-right',
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [user]);

  const timetableEntries = useMemo(
    () => schedules.flatMap((schedule) =>
      (schedule.sessions || []).map((session) => ({
        key: `${schedule.id}-${session.id}`,
        slotKey: createSlotKey(session.startTime, session.endTime),
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        courseName: schedule.course.name,
        courseSkill: schedule.course.skill?.replace(/_/g, ' & ') || 'General',
        teacherName: schedule.teacher.fullname,
        classroomName: schedule.classroom.name,
        courseThumbnail: 'https://placehold.co/600x400@2x.png',
        courseStartDate: schedule.startTime,
        courseEndDate: schedule.endTime,
      })),
    ),
    [schedules],
  );

  const timeSlots = useMemo(() => {
    const slotMap = new Map<string, { key: string; label: string; from: string; to: string }>();

    // Only add slots that actually have sessions
    for (const entry of timetableEntries) {
      if (!slotMap.has(entry.slotKey)) {
        slotMap.set(entry.slotKey, {
          key: entry.slotKey,
          label: `${entry.startTime} - ${entry.endTime}`,
          from: entry.startTime,
          to: entry.endTime,
        });
      }
    }

    return [...slotMap.values()].sort((left, right) => {
      const startDiff = toMinutes(left.from) - toMinutes(right.from);
      if (startDiff !== 0) {
        return startDiff;
      }

      return toMinutes(left.to) - toMinutes(right.to);
    });
  }, [timetableEntries]);

  const timetableGrid = useMemo(() => {
    const grid = Object.fromEntries(
      orderedDays.map((day) => [day, {} as Record<string, Array<{
        key: string;
        day: string;
        startTime: string;
        endTime: string;
        courseName: string;
        courseSkill: string;
        teacherName: string;
        classroomName: string;
        courseThumbnail: string;
        courseStartDate: string;
        courseEndDate: string;
      }>>]),
    ) as Record<string, Record<string, Array<{
      key: string;
      day: string;
      startTime: string;
      endTime: string;
      courseName: string;
      courseSkill: string;
      teacherName: string;
      classroomName: string;
      courseThumbnail: string;
      courseStartDate: string;
      courseEndDate: string;
    }>>>;

    for (const entry of timetableEntries) {
      if (!grid[entry.day][entry.slotKey]) {
        grid[entry.day][entry.slotKey] = [];
      }

      grid[entry.day][entry.slotKey].push(entry);
    }

    for (const day of orderedDays) {
      for (const slot of Object.keys(grid[day])) {
        grid[day][slot].sort((left, right) => left.courseName.localeCompare(right.courseName));
      }
    }

    return grid;
  }, [timetableEntries]);

  const totalSessions = useMemo(
    () => timetableEntries.length,
    [timetableEntries],
  );

  const activeDaysCount = useMemo(
    () => orderedDays.filter((day) => timetableEntries.some((entry) => entry.day === day)).length,
    [timetableEntries],
  );

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
    <div className="bg-slate-50 p-8">
      <div className="mx-auto w-full max-w-none">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lịch học chi tiết</h1>
            <p className="text-sm text-slate-500">Xem thời khóa biểu học tập của bạn.</p>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            Chưa có lịch học nào.
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng khóa học</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{schedules.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng ca học</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{totalSessions}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Số ngày có lớp</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{activeDaysCount}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid min-w-[1180px] grid-cols-[180px_repeat(7,minmax(0,1fr))] gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-bold text-slate-900">Khung giờ</p>
                  </div>

                  {orderedDays.map((day) => (
                    <div key={day} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
                      <p className="text-sm font-bold text-slate-900">{dayLabelMap[day]}</p>
                      <p className="text-xs text-slate-400">
                        {timetableEntries.filter((entry) => entry.day === day).length} ca học
                      </p>
                    </div>
                  ))}

                  {timeSlots.map((slot) => (
                    <Fragment key={slot.key}>
                      <div key={`slot-${slot.key}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <p className="text-sm font-bold text-slate-900">{slot.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{slot.from} đến {slot.to}</p>
                      </div>

                      {orderedDays.map((day) => {
                        const sessions = timetableGrid[day]?.[slot.key] ?? [];

                        return (
                          <div
                            key={`${day}-${slot.key}`}
                            className="min-h-[180px] rounded-2xl border border-slate-200 bg-white p-3"
                          >
                            {sessions.length === 0 ? (
                              <div className="flex h-full min-h-[150px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 text-center text-xs text-slate-400">
                                Trống
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {sessions.map((session) => (
                                  <div key={session.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                    <div className="space-y-2 p-3">
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                          {session.courseSkill}
                                        </p>
                                        <h3 className="mt-1 text-sm font-bold leading-5 text-slate-900">{session.courseName}</h3>
                                      </div>
                                      <div className="flex items-start gap-2 text-xs text-slate-600">
                                        <GraduationCap size={14} className="mt-0.5 text-slate-400" />
                                        <span>{session.teacherName}</span>
                                      </div>
                                      <div className="flex items-start gap-2 text-xs text-slate-600">
                                        <MapPin size={14} className="mt-0.5 text-slate-400" />
                                        <span>{session.classroomName}</span>
                                      </div>
                                      <p className="text-[11px] text-slate-400">
                                        {formatDate(session.courseStartDate)} - {formatDate(session.courseEndDate)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};