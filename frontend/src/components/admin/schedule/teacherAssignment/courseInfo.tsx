import { useEffect, useState } from "react";
import type { Course } from "../../../../types/course/response";
import { TIME_SLOTS_120, TIME_SLOTS_90 } from "../../../../types/schedule/slot-time.type";
import { getAllClassrooms } from "../../../../services/classroom.service";
import type { Classroom } from "../../../../types/classroom/response";
import getTomorrowLocal from "../../../../helpers/getTomorrowLocal";
import adjustStartDateByDays from "../../../../helpers/adjustStartDateByDays";

type Props = {
  course: Course | null;
  onDataChange: (data: any) => void;
}
const CourseInfo = ({ course, onDataChange }: Props) => {
  const isTwoSkills = course?.courseSkill === "READING_LISTENING" || course?.courseSkill === "SPEAKING_WRITING";
  const timeSlots = isTwoSkills ? TIME_SLOTS_90 : TIME_SLOTS_120;
  const [classRooms, setClassRooms] = useState<Classroom[] | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | "">("");
  const [form, setForm] = useState<any>({
    classroomId: selectedRoom,
    startDate: "",
    fromTime: "",
    toTime: "",
    days: "",
  });

  const updateForm = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };


  useEffect(() => {
    const loadClassRooms = async () => {
      try {
        const res = await getAllClassrooms();
        if (res.message && res.data) {
          setClassRooms(res.data.data);
        }
      } catch (error) {
        console.error("Load classrooms failed:", error);
      }
    }
    loadClassRooms();
  }, []);

  useEffect(() => {
    // Khi đổi loại kỹ năng → reset giờ học
    setForm((prev: any) => ({
      ...prev,
      fromTime: "",
      toTime: "",
    }));
  }, [course?.courseSkill]);

  // Notify parent whenever form changes
  useEffect(() => {
    onDataChange(form);
  }, [form]);

  return (
    <section className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between gap-10">

        {/* LEFT */}
        <div className="grid grid-cols-1  gap-x-6 gap-y-4">

          {/* Room */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="min-w-[70px] text-gray-400">Phòng</span>

            <select
              value={selectedRoom}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedRoom(value);
                updateForm("classroomId", value ? Number(value) : null);
              }}
              className="w-full max-w-[160px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">-- Chọn phòng --</option>

              {classRooms?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
          {/* Start Date */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="min-w-[70px] text-gray-400">Bắt đầu</span>
            <input
              type="date"
              value={form.startDate}
              min={getTomorrowLocal()}
              onChange={(e) => {
                const newDate = e.target.value;

                setForm((prev: any) => {
                  let adjustedDate = newDate;

                  if (prev.days) {
                    adjustedDate = adjustStartDateByDays(newDate, prev.days);
                  }

                  return {
                    ...prev,
                    startDate: adjustedDate,
                  };
                });
              }}

              className="w-full max-w-[180px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>

          {/* Time Slot */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="min-w-[70px] text-gray-400">Giờ học</span>

            <select
              key={isTwoSkills ? "90" : "120"}
              value={
                form.fromTime && form.toTime
                  ? `${form.fromTime}-${form.toTime}`
                  : ""
              }
              onChange={(e) => {
                const slot = timeSlots.find(
                  (s) => `${s.from}-${s.to}` === e.target.value
                );
                if (!slot) return;

                updateForm("fromTime", slot.from);
                updateForm("toTime", slot.to);
              }}
              className="w-full max-w-[200px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >

              <option value="">-- Chọn khung giờ --</option>

              {timeSlots.map((slot) => (
                <option key={slot.label} value={`${slot.from}-${slot.to}`}>
                  {slot.label}
                </option>
              ))}
            </select>

          </div>

          {/* Duration (read-only from course) */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="min-w-[70px] text-gray-400">Thời gian</span>
            <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-700 font-semibold">
              {course?.totalSession ?? 0}
            </span>
            <span className="text-gray-400 text-xs">buổi</span>
          </div>

          {/* Days */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="min-w-[70px] text-gray-400">Thứ</span>
            <div className="relative w-full">
              <select
                value={form.days}
                disabled={!form.startDate}
                onChange={(e) => {
                  const newDays = e.target.value;

                  setForm((prev: any) => {
                    let adjustedDate = prev.startDate;

                    if (prev.startDate) {
                      adjustedDate = adjustStartDateByDays(prev.startDate, newDays);
                    }

                    return {
                      ...prev,
                      days: newDays,
                      startDate: adjustedDate,
                    };
                  });
                }}

                className={`w-full border rounded-xl px-3 py-1.5 text-sm transition-all
                  ${!form.startDate
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-gray-50 text-slate-700 border-gray-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  }`}
              >
                <option value="">-- Chọn lịch học --</option>
                <option value="246">Monday - Wednesday - Friday</option>
                <option value="357">Tuesday - Thursday - Saturday</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-80 bg-white/60 backdrop-blur-md rounded-3xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-4">
              {/* Course Skills */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-gray-400 tracking-wider">
                  KỸ NĂNG
                </label>

                <div className="px-3 py-1 text-[15px] font-bold bg-slate-100 text-slate-700">
                  {course?.courseSkill === "READING_LISTENING"
                    ? "READING & LISTENING"
                    : course?.courseSkill === "SPEAKING_WRITING"
                      ? "SPEAKING & WRITING"
                      : "ALL SKILLS"}
                </div>
              </div>

              {/* Band Display with modern pill badges */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[13px] font-bold text-gray-400 tracking-wider mb-1">Min Band</span>
                  <span className="px-3 py-1.5 bg-blue-50/50 border border-blue-100 text-blue-700 text-xm font-bold rounded-lg text-center">
                    {course?.minBand}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[13px] font-bold text-gray-400 tracking-wider mb-1">Max Band</span>
                  <span className="px-3 py-1.5 bg-indigo-50/50 border border-indigo-100 text-indigo-700 text-xm font-bold rounded-lg text-center">
                    {course?.maxBand}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CourseInfo;