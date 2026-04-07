import type { RouteObject } from "react-router-dom";
import AdminLayout from "../layouts/admin/admin.layout";
import ProtectedRoute from "../components/common/protected-route";

// Teacher components
import TeacherManagement from "../components/admin/teacher/management/teacher";
import TeacherCreate from "../components/admin/teacher/create/teacher.create";
import TeacherUpdate from "../components/admin/teacher/update/teacher.update";

// Student components
import StudentManagement from "../components/admin/student/management/student";
import StudentCreate from "../components/admin/student/create/student.create";
import StudentUpdate from "../components/admin/student/update/student.update";

// Parent components
import ParentManagement from "../components/admin/parent/management/parent";
import ParentCreate from "../components/admin/parent/create/parent.create";
import ParentUpdate from "../components/admin/parent/update/parent.update";

// Course components
import CourseManagement from "../components/admin/course/management/course";
import CourseCreate from "../components/admin/course/create/course.create";
import CourseUpdate from "../components/admin/course/update/course.update";

// Coursetest components
import CoursetestManagement from "../components/admin/coursetest/management/coursetest";
import CoursetestCreate from "../components/admin/coursetest/create/coursetest.create";
import CoursetestUpdate from "../components/admin/coursetest/update/coursetest.update";

// Classroom components
import ClassroomManagement from "../components/admin/classroom/management/classroom";
import ClassroomCreate from "../components/admin/classroom/create/classroom.create";
import ClassroomUpdate from "../components/admin/classroom/update/classroom.update";

// Schedule compoents
import ScheduleManagement from "../components/admin/schedule/scheduleManagement";
import ScheduleDetailPage from "../components/admin/schedule/scheduleDetailPage";


//Register Schedule
import TeacherAssignment from "../components/admin/schedule/teacherAssignment";

// Entrance Exam L&R components
import EntranceExamLRManagement from "../components/admin/entrance-exam-lr/management/entrance-exam-lr";
import ExamDetail from "../components/admin/entrance-exam-lr/detail/exam.detail";
import PartEditor from "../components/admin/entrance-exam-lr/part-editor/part-editor";
// Exam components
import ExamList from "../components/admin/exam/management/exam.list";
import ExamEditor from "../components/admin/exam/editor/exam.editor";

// Speaking components
import SpeakingExamList from "../components/admin/speaking/management/speaking.list";
import SpeakingExamEditor from "../components/admin/speaking/editor/speaking.editor";

// SW Dashboard component
import SWDashboard from "../components/admin/sw-dashboard/sw.dashboard";

// Statistics component
import StatisticsPage from "../components/admin/statistics/StatisticsPage";

// Admission Students component
import AdmissionStudentsPage from "../components/admin/admissions/AdmissionStudentsPage";
import AdminProfile from "../pages/admin/Profile";


const AdminRoutes: RouteObject = {
  path: "admin",
  element: (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <div>Admin Dashboard</div>,
    },
    // Teacher routes
    {
      path: "teachers",
      element: <TeacherManagement />,
    },
    {
      path: "teachers/create",
      element: <TeacherCreate />,
    },
    {
      path: "teachers/update/:id",
      element: <TeacherUpdate />,
    },
    // Student routes
    {
      path: "students",
      element: <StudentManagement />,
    },
    {
      path: "students/create",
      element: <StudentCreate />,
    },
    {
      path: "students/update/:id",
      element: <StudentUpdate />,
    },
    // Parent routes
    {
      path: "parents",
      element: <ParentManagement />,
    },
    {
      path: "parents/create",
      element: <ParentCreate />,
    },
    {
      path: "parents/update/:id",
      element: <ParentUpdate />,
    },
    // Course routes
    {
      path: "courses",
      element: <CourseManagement />,
    },
    {
      path: "courses/create",
      element: <CourseCreate />,
    },
    {
      path: "courses/update/:id",
      element: <CourseUpdate />,
    },

    // Schdules routes
    {
      path: "schedules",
      element: <ScheduleManagement />,
    },
    {
      path: "schedules/:id",
      element: <ScheduleDetailPage />,
    },

    // Coursetest routes - always require courseId
    {
      path: "coursetest",
      element: <CoursetestManagement />,
    },
    {
      path: "coursetest/create",
      element: <CoursetestCreate />,
    },
    {
      path: "coursetest/update/:id",
      element: <CoursetestUpdate />,
    },
    // Classroom routes
    {
      path: "classrooms",
      element: <ClassroomManagement />,
    },
    {
      path: "classrooms/create",
      element: <ClassroomCreate />,
    },
    {
      path: "classrooms/update/:id",
      element: <ClassroomUpdate />,
    },
    
    // Create Schedule
    {
      path: "register-schedule/:id",
      element: <TeacherAssignment />,
    },
    // Entrance Exam L&R routes
    {
      path: "entrance-exam-lr",
      element: <EntranceExamLRManagement />,
    },
    {
      path: "entrance-exam-lr/:type/:id",
      element: <ExamDetail />,
    },
    {
      path: "entrance-exam-lr/:type/:id/part/:partNo/:partId",
      element: <PartEditor />,
    },
    
    // SW Dashboard route
    {
      path: "content/sw",
      element: <SWDashboard />,
    },
    
    // Writing Exam routes
    {
      path: "content/sw/writing",
      element: <ExamList />,
    },
    {
      path: "content/sw/writing/new",
      element: <ExamEditor />,
    },
    {
      path: "content/sw/writing/:id",
      element: <ExamEditor />,
    },
    
    // Speaking Exam routes
    {
      path: "content/sw/speaking",
      element: <SpeakingExamList />,
    },
    {
      path: "content/sw/speaking/new",
      element: <SpeakingExamEditor />,
    },
{
      path: "content/sw/speaking/:id",
      element: <SpeakingExamEditor />,
    },
    
    // Statistics routes
    {
      path: "statistics",
      element: <StatisticsPage />,
    },
    
    // Admission Students routes
    {
      path: "admissions/students",
      element: <AdmissionStudentsPage />,
    },
    {
      path: "profile",
      element: <AdminProfile />,
    },
  ],
};

export default AdminRoutes;
