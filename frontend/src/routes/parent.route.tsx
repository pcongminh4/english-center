import type { RouteObject } from 'react-router-dom';
import ParentLayout from '../layouts/parent/parent.layout';
import ProtectedRoute from '../components/common/protected-route';
import ChildrenManagement from '../pages/parent/ChildrenManagement';
import CourseManagement from '../pages/parent/CourseManagement';
import TimeTableManament from '../pages/parent/TimeTableManament';
import AttendanceManagement from '../pages/parent/AttendanceManagement';
import ParentProfile from '../pages/parent/Profile';

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
      element: <div>Parent Dashboard</div>
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
  ],
};

export default ParentRoutes;
