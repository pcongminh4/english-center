import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, UserRound } from 'lucide-react';
import { getStudentsByParentMeService } from '../../services/student.service';
import { getSchedulesByStudentId } from '../../services/schedule.service';
import type { StudentScheduleByIdResponse } from '../../types/schedule/student-schedule.response';
import {
  getStudentAttendanceForParent,
  type StudentAttendanceRecord,
} from '../../services/attendance.service';
import type { StudentResponse } from '../../types/student/response';
import formatDate from '../../helpers/formatDate';

const AttendanceManagement = () => {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [studentSchedules, setStudentSchedules] = useState<StudentScheduleByIdResponse[]>([]);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        setError(null);
        const response = await getStudentsByParentMeService();
        const list = Array.isArray(response.data) ? response.data : [];
        setStudents(list);
        setSelectedStudentId(list[0]?.id ?? null);
      } catch (err) {
        console.error('Load students by parent failed:', err);
        setStudents([]);
        setSelectedStudentId(null);
        setError('Không thể tải danh sách học sinh. Vui lòng thử lại.');
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setAttendanceRecords([]);
      return;
    }

    const fetchAttendance = async () => {
      try {
        setLoadingAttendance(true);
        setError(null);
        const [records, schedulesRes] = await Promise.all([
          getStudentAttendanceForParent(selectedStudentId),
          getSchedulesByStudentId(selectedStudentId, 1, 200),
        ]);

        setAttendanceRecords(Array.isArray(records) ? records : []);
        setStudentSchedules(Array.isArray(schedulesRes.data?.data) ? schedulesRes.data.data : []);
      } catch (err) {
        console.error(`Load attendance for student ${selectedStudentId} failed:`, err);
        setAttendanceRecords([]);
        setStudentSchedules([]);
        setError('Không thể tải lịch sử điểm danh. Vui lòng thử lại.');
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchAttendance();
  }, [selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const sortedRecords = useMemo(
    () => [...attendanceRecords].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [attendanceRecords],
  );

  const totalCheckIns = sortedRecords.length;

  const uniqueSessions = useMemo(() => {
    return new Set(sortedRecords.map((record) => record.scheduleAttendanceId)).size;
  }, [sortedRecords]);


  const sessionCatalog = useMemo(() => {
    return studentSchedules.flatMap((schedule) =>
      schedule.sessions.map((session) => ({
        scheduleId: schedule.id,
        sessionId: session.id,
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        courseName: schedule.course?.name || 'Khóa học chưa xác định',
      })),
    );
  }, [studentSchedules]);

  const sessionInfoById = useMemo(
    () => new Map(sessionCatalog.map((item) => [item.sessionId, item])),
    [sessionCatalog],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#f8fafc_35%,_#eef2ff_100%)] p-6 md:p-8">
      <div className="mx-auto max-w-none space-y-6">

        {loadingStudents ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            Đang tải danh sách học sinh...
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Chưa có học sinh liên kết với tài khoản phụ huynh.
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Chọn học sinh</h2>
              <div className="flex flex-wrap gap-3">
                {students.map((student) => {
                  const isActive = selectedStudentId === student.id;

                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`flex min-w-[220px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-white'
                      }`}
                    >
                      <div className={`rounded-full p-2 ${isActive ? 'bg-white/20' : 'bg-white text-slate-600'}`}>
                        <UserRound size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight">{student.fullname}</p>
                        <p className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>{student.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedStudent?.fullname ?? 'Lịch sử điểm danh'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Dữ liệu điểm danh của học sinh theo từng buổi học.</p>
                </div>
              </div>

              {error ? (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
              ) : null}

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lần điểm danh</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{totalCheckIns}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Buổi học đã điểm danh</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{uniqueSessions}</p>
                </div>
              </div>

              {loadingAttendance ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  Đang tải lịch sử điểm danh...
                </div>
              ) : sortedRecords.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Học sinh này chưa có lịch sử điểm danh.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold">Ngày học</th>
                          <th className="px-4 py-3 text-left font-bold">Khóa học</th>
                          <th className="px-4 py-3 text-left font-bold">Khung giờ</th>
                          <th className="px-4 py-3 text-left font-bold">Check-in</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sortedRecords.map((record) => {
                          const session = record.scheduleAttendance.scheduleSession;
                          const sessionInfo = sessionInfoById.get(session.id);

                          return (
                            <tr key={record.id} className="hover:bg-slate-50/80">
                              <td className="px-4 py-3 align-top">
                                <p className="font-semibold text-slate-800">{formatDate(record.scheduleAttendance.date)}</p>
                                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{session.day}</p>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <p className="font-semibold text-slate-800">{sessionInfo?.courseName ?? `Schedule #${session.scheduleId}`}</p>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                  <CalendarClock size={14} />
                                  {session.startTime} - {session.endTime}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <p className="font-semibold text-slate-800">{record.time || '--:--'}</p>
                                <p className="text-xs text-slate-500">{new Date(record.createdAt).toLocaleTimeString('vi-VN')}</p>
                              </td>
                      
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;
