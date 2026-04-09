import { Prisma } from "@prisma/client";
import { ScheduleResponse } from "../../DTOS/Schedule/schedule.response";
import { toTeacherResponse } from "./teacher.mapper";
import { buildCourseThumbnailUrl } from "../fileUrl";

export type ScheduleWithCourse = Prisma.ScheduleGetPayload<{
  include: { 
    course: true, 
    sessions: true; 
    classroom: true;
    teacher: {
      include: {
        user: true;
        freeDays: true;
      }
    } 
  };
}>;

export const toScheduleResponse = (
  schedule: ScheduleWithCourse,
): ScheduleResponse => ({
  id: schedule.id,
  teacher: toTeacherResponse(schedule.teacher),
  classroom: schedule.classroom,
  totalSlot: schedule.totalSlot,
  totalRegister: schedule.totalRegister,
  startTime: schedule.startTime,
  endTime: schedule.endTime,
  createdAt: schedule.createdAt,
  updatedAt: schedule.updatedAt,
  course: {
    ...schedule.course,
    price: Number(schedule.course.price), // convert Decimal -> number
    thumbnail: buildCourseThumbnailUrl(schedule.course.thumbnail),
  },
  sessions: schedule.sessions.map((s) => ({
    id: s.id,
    day: s.day,
    startTime: s.startTime,
    endTime: s.endTime,
  })),
});
