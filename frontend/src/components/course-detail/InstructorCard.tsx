import React from "react";
import { type ScheduleResponse } from "../../types/schedule/schedule.response";
import ProgressBar from "./ProgressBar";


interface Props {
  schedule: ScheduleResponse;
}

const InstructorCard: React.FC<Props> = ({ schedule }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-md shadow-gray-200/60 hover:shadow-lg transition-shadow duration-300 p-5">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Info */}
        <div className="flex items-center gap-4">
          <img
            src={
              schedule.teacher.avatar
                ? schedule.teacher.avatar.startsWith('http')
                  ? schedule.teacher.avatar
                  : `${import.meta.env.VITE_FILE_URL}/uploads/teachers/${schedule.teacher.avatar}`
                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  schedule.teacher.fullname
                )}`
            }
            alt={schedule.teacher.fullname}
            className="w-12 h-12 rounded-full border-2 border-orange-100"
          />
          <div>
            <h3 className="font-bold text-gray-800">{schedule.teacher.fullname}</h3>
            <p className="text-xs text-gray-500">{schedule.teacher.degree}</p>
          </div>
        </div>

        {/* Progress + Button */}
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-end">
          <ProgressBar
            startDate={schedule.startTime}
            endDate={schedule.endTime}
            current={schedule.totalRegister}
            max={schedule.totalSlot}
            isLocked={schedule.totalRegister >= schedule.totalSlot}
          />

          {/* {schedule.totalRegister >= schedule.totalSlot ? (
            <button
              disabled
              className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
            >
              <Lock size={16} /> Khóa
            </button>
          ) : (
            <button
              className="px-8 py-2 bg-gradient-to-b from-blue-400 to-blue-600 text-white font-semibold rounded-lg
              shadow-[0_6px_0_0_rgb(29,78,216)] active:translate-y-1 active:shadow-[0_2px_0_0_rgb(29,78,216)] transition-all duration-130"
            >
              Đăng ký
            </button>

          )} */}
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <h4 className="text-xs font-bold text-gray-700 uppercase">
          Thời khóa biểu hàng tuần
        </h4>

        <div className="grid md:grid-cols-3 gap-3">
          {schedule.sessions?.map((s, i) => (
            <div
              key={s.id ?? i}
              className="bg-gray-50 rounded-lg p-3 flex gap-2"
            >
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 rounded">
                {s.day}
              </span>
              <span className="text-sm text-gray-600">
                {s.startTime} - {s.endTime}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default InstructorCard;