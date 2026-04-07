import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ScheduleResponse } from "../../../types/schedule/schedule.response";
import { getScheduleById } from "../../../services/schedule.service";
import WeeklySchedule from "../../../components/admin/schedule/scheduleDetailPage/weeklySchedule";
import TeacherInfo from "../../../components/admin/schedule/scheduleDetailPage/teacherInfo";
import StudentManagement from "../../../components/admin/schedule/scheduleDetailPage/studentManagement";
import HeaderBar from "../../../components/admin/schedule/scheduleDetailPage/headerBar";
import TopStats from "../../../components/admin/schedule/scheduleDetailPage/topStats";


const ScheduleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await getScheduleById(Number(id));
        if (res.success && res.data) {
          setSchedule(res.data);
        }
      } catch {
        alert("Không thể tải chi tiết đợt mở lớp");
        navigate("/admin/schedules");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [id, navigate]);

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!schedule) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <HeaderBar />

        <TopStats schedule={schedule} />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <WeeklySchedule sessions={schedule.sessions ?? []} />
          <TeacherInfo teacher={schedule.teacher} />
        </div>

        <StudentManagement scheduleId={schedule.id} totalSlot={schedule.totalSlot} />
      </div>
    </div>
  );
};

export default ScheduleDetailPage;
