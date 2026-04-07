import type { RouteObject } from "react-router-dom";
import TeacherLayout from "../layouts/teacher/teacher.layout";
import ProtectedRoute from "../components/common/protected-route";
import TeacherCourses from "../components/teacher/courses/teacher.courses";
import TeacherCourseDetail from "../components/teacher/course-detail/teacher.course-detail";
import TeacherAvailability from "../components/teacher/availability/teacher.availability";
import ClassAttendance from "../pages/teacher/ClassAttendance";
import CourseTestStudentScores from "../components/teacher/course-detail/course-score/courseTest-studentScores";
import TeacherProfile from "../pages/teacher/Profile";

const TeacherRoutes: RouteObject = {
  path: "teacher",
  element: (
    <ProtectedRoute allowedRoles={["TEACHER"]}>
      <TeacherLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <TeacherCourses />,
    },
    {
      path: "courses",
      element: <TeacherCourses />,
    },
    {
      path: "courses/:scheduleId",
      element: <TeacherCourseDetail />,
    },
    {
      path: "courses/:scheduleId/course-tests/:courseTestId/scores",
      element: <CourseTestStudentScores />,
    },
    {
      path: "availability",
      element: <TeacherAvailability />,
    },
    {
      path: "attendance/:sessionId",
      element: <ClassAttendance />,
    },
    {
      path: "profile",
      element: <TeacherProfile />,
    },
  ],
};

export default TeacherRoutes;