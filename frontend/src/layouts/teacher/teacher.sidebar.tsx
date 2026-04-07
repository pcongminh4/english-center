import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  List,
} from "@material-tailwind/react";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "../../stores/auth.store";

const normalizePathname = (path: string) => {
  if (!path) return "/";
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
};

const TeacherSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const pathname = normalizePathname(location.pathname);

  const isPathActive = (path: string) => {
    const targetPath = normalizePathname(path);
    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  };

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem("access_token");
    navigate("/");
  };

  const menuItems = [
    {
      title: "Khóa Học Của Tôi",
      icon: BookOpenIcon,
      path: "/teacher",
      matchPaths: ["/teacher", "/teacher/courses"],
    },
    {
      title: "Lịch Rảnh",
      icon: CalendarDaysIcon,
      path: "/teacher/availability",
    },
    {
      title: "Thông tin cá nhân",
      icon: UserCircleIcon,
      path: "/teacher/profile",
    },
  ];

  const isMenuItemActive = (item: (typeof menuItems)[number]) => {
    const matchPaths = item.matchPaths ?? [item.path];
    return matchPaths.some((path) => isPathActive(path));
  };

  return (
    <div className="bg-white border-r border-gray-200 w-64 h-screen flex flex-col shadow-xl overflow-x-hidden">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <Typography variant="h6" className="font-bold text-white">
              Teacher Portal
            </Typography>
            <Typography variant="small" className="text-blue-100">
              Cổng thông tin giáo viên
            </Typography>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <List className="space-y-1 min-w-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isMenuItemActive(item);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 w-full py-3 px-3 rounded-xl transition-all duration-200 min-w-0 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <Typography variant="small" className="font-semibold truncate flex-1">
                  {item.title}
                </Typography>
              </NavLink>
            );
          })}
        </List>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">
              {user?.fullname?.charAt(0) || "T"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <Typography variant="small" className="font-semibold text-gray-800 truncate">
              {user?.fullname || "Giáo viên"}
            </Typography>
            <Typography variant="small" className="text-gray-500 text-xs truncate">
              {user?.email && user?.phone ? `${user.email} • ${user.phone}` : user?.phone || user?.email || ""}
            </Typography>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="text"
          size="sm"
          className="mt-2 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 normal-case w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 font-semibold"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
};

export default TeacherSidebar;
