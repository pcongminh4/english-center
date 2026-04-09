import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen,
  Wallet,
  User,
  Receipt,
  X
} from 'lucide-react';
import { useStudentStore } from '../../stores/student.store';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    label: 'Dashboard',
    path: '/student/dashboard',
  },
  {
    icon: <Calendar size={20} />,
    label: 'Lịch học',
    path: '/student/schedule',
  },
  {
    icon: <BookOpen size={20} />,
    label: 'Khóa học',
    path: '/student/courses',
  },
  {
    icon: <Wallet size={20} />,
    label: 'Đăng ký khóa học',
    path: '/student/course-registration',
  },
  {
    icon: <Receipt size={20} />,
    label: 'Lịch sử thanh toán',
    path: '/student/payment-history',
  },
  {
    icon: <User size={20} />,
    label: 'Thông tin cá nhân',
    path: '/student/profile',
  },
];

export const StudentSidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useStudentStore();

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-blue-600">
                English Center
              </h1>
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }
                `}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              © 2026 English Center
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};