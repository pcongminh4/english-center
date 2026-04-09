import type { RouteObject } from 'react-router-dom';
import ParentLayout from '../layouts/parent/parent.layout';
import ProtectedRoute from '../components/common/protected-route';
import ChildrenManagement from '../pages/parent/ChildrenManagement';
import CourseManagement from '../pages/parent/CourseManagement';
import TimeTableManament from '../pages/parent/TimeTableManament';
import AttendanceManagement from '../pages/parent/AttendanceManagement';
import ParentProfile from '../pages/parent/Profile';
import ParentDashboard from '../pages/parent/Dashboard';
import ParentPaymentHistory from '../pages/parent/PaymentHistory';

const ParentRoutes: RouteObject = {
  path: 'parent',
  element: (
    <ProtectedRoute allowedRoles={["PARENT"]}>
      <ParentLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <ParentDashboard />
    },
    {
      path: 'dashboard',
      element: <ParentDashboard />,
    },
    {
      path: 'academic/results',
      element: <CourseManagement />,
    },
    {
      path: 'profile',
      element: <ParentProfile />,
    },
    {
      path: 'academic/attendance',
      element: <AttendanceManagement />,
    },
    {
      path: 'children/list',
      element: <ChildrenManagement />,
    },
    {
      path: 'schedule/timetable',
      element: <TimeTableManament />,
    },
    {
      path: 'payment-history',
      element: <ParentPaymentHistory />,
    },
  ],
};

export default ParentRoutes;
