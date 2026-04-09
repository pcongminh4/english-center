import type { RouteObject } from 'react-router-dom';
import { StudentLayout } from '../layouts/student/student.layout';
import { Dashboard } from '../pages/student/Dashboard';
import { Schedule } from '../pages/student/Schedule';
import { Courses } from '../pages/student/Courses';
import { Profile } from '../pages/student/Profile';
import ScanQR from '../pages/student/ScanQR';
import { RoleBasedRedirect } from '../components/common/RoleBasedRedirect';
import CourseDetail from '../pages/student/CourseDetail';
import CourseRegistration from '../pages/student/CourseRegistration';
import StudentPaymentResult from '../pages/student/PaymentResult';
import StudentPaymentHistory from '../pages/student/PaymentHistory';

const StudentRoutes: RouteObject = {
  element: <StudentLayout />,
  path: 'student',
  children: [
    {
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><Dashboard /></>,
      index: true,
    },
    {
      path: 'dashboard',
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><Dashboard /></>,
    },
    {
      path: 'schedule',
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><Schedule /></>,
    },
    {
      path: 'courses',
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><Courses /></>,
    },
    {
      path: 'courses/:id',
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><CourseDetail /></>,
    },
    {
      path: 'course-registration',
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><CourseRegistration /></>,
    },
    {
      path: 'payment-result',
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><StudentPaymentResult /></>,
    },
    {
      path: 'payment-history',
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><StudentPaymentHistory /></>,
    },
    {
      path: 'profile',
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><Profile /></>,
    },
    {
      path: 'scan-qr',
      element: <><RoleBasedRedirect allowedRole="STUDENT" redirectTo="/student/dashboard" /><ScanQR /></>,
    },
  ],
};

export default StudentRoutes;