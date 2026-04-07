import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Typography,
  Button,
  List,
  ListItem,
  ListItemPrefix,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Chip,
} from "@material-tailwind/react";
import {
  ChevronDownIcon,
  HomeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  AcademicCapIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BookOpenIcon,
  TrophyIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "../../stores/auth.store";

const ParentSidebar = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<string[]>(["overview"]);
  const location = useLocation();

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActiveLink = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleLogout = () => {
    // Clear auth state
    useAuthStore.getState().logout();
    // Clear session storage
    sessionStorage.removeItem("access_token");
    // Navigate to home page
    navigate("/");
  };

  const menuItems = [
    {
      id: "overview",
      title: "Tổng quan",
      icon: HomeIcon,
      path: "/parent/dashboard",
      badge: null,
    },
    {
      id: "children",
      title: "Quản lý con",
      icon: UserGroupIcon,
      path: "/parent/children",
      badge: { value: 2, color: "purple" },
      children: [
        { title: "Danh sách con", icon: UserGroupIcon, path: "/parent/children/list" },
      ]
    },
    {
      id: "schedule",
      title: "Lịch học & Thời khóa biểu",
      icon: CalendarDaysIcon,
      path: "/parent/schedule",
      children: [
        { title: "Thời khóa biểu", icon: ClockIcon, path: "/parent/schedule/timetable" },
        { title: "Lịch thi", icon: DocumentTextIcon, path: "/parent/schedule/exams" },
      ]
    },
    {
      id: "academic",
      title: "Học tập & Kết quả",
      icon: AcademicCapIcon,
      path: "/parent/academic",
      children: [
        { title: "Kết quả học tập", icon: ChartBarIcon, path: "/parent/academic/results" },
        { title: "Điểm danh", icon: ClockIcon, path: "/parent/academic/attendance" },
        { title: "Bài tập về nhà", icon: BookOpenIcon, path: "/parent/academic/homework" },
        { title: "Thành tích", icon: TrophyIcon, path: "/parent/academic/achievements" },
      ]
    },
    {
      id: "tuition",
      title: "Học phí & Thanh toán",
      icon: BanknotesIcon,
      path: "/parent/tuition",
      badge: { value: "Mới", color: "red" },
      children: [
        { title: "Hóa đơn học phí", icon: DocumentTextIcon, path: "/parent/tuition/invoices" },
        { title: "Lịch sử thanh toán", icon: ClockIcon, path: "/parent/tuition/history" },
        { title: "Phương thức thanh toán", icon: BanknotesIcon, path: "/parent/tuition/methods" },
      ]
    },
    {
      id: "settings",
      title: "Cài đặt",
      icon: Cog6ToothIcon,
      path: "/parent/settings",
    },
  ];

  return (
    <div className="bg-white border-r border-gray-200 w-64 h-screen flex flex-col shadow-xl overflow-x-hidden">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
            <HeartIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <Typography variant="h6" className="font-bold text-white">
              Parent Portal
            </Typography>
            <Typography variant="small" className="text-blue-100">
              Cổng thông tin phụ huynh
            </Typography>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <List className="space-y-1 min-w-0">
          {menuItems.map((item) => {
            const isOpen = openSections.includes(item.id);
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.id}>
                {hasChildren ? (
                  <Accordion
                    open={isOpen}
                    icon={
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        } text-current`}
                      />
                    }
                  >
                    <AccordionHeader
                      onClick={() => toggleSection(item.id)}
                      className={`border-0 py-3 px-3 rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 ${
                        isActiveLink(item.path)
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                          : 'text-gray-700'
                      }`}
                    >
                      <ListItemPrefix>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                      </ListItemPrefix>
                      <Typography variant="small" className="font-semibold truncate flex-1">
                        {item.title}
                      </Typography>
                      {item.badge && (
                        <Chip
                          value={item.badge.value}
                          size="sm"
                          className={`ml-2 ${
                            item.badge.color === 'red' ? 'bg-red-500' : 'bg-blue-500'
                          } text-white`}
                        />
                      )}
                    </AccordionHeader>
                    <AccordionBody className="py-1">
                      <List className="space-y-1 ml-2">
                        {item.children?.map((child, index) => {
                          const ChildIcon = child.icon;
                          return (
                            <ListItem
                              key={index}
                              className={`py-2.5 px-3 rounded-lg transition-all duration-200 ${
                                isActiveLink(child.path)
                                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold'
                                  : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                              }`}
                            >
                              <Link to={child.path} className="flex items-center gap-3 w-full min-w-0">
                                <ChildIcon className="h-4 w-4 flex-shrink-0" />
                                <Typography variant="small" className="font-medium truncate">
                                  {child.title}
                                </Typography>
                              </Link>
                            </ListItem>
                          );
                        })}
                      </List>
                    </AccordionBody>
                  </Accordion>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 w-full py-3 px-3 rounded-xl transition-all duration-200 min-w-0 ${
                      isActiveLink(item.path)
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <Typography variant="small" className="font-semibold truncate flex-1">
                      {item.title}
                    </Typography>
                    {item.badge && (
                      <Chip
                        value={item.badge.value}
                        size="sm"
                        className={`${
                          item.badge.color === 'red' ? 'bg-red-500' : 'bg-blue-500'
                        } text-white`}
                      />
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </List>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">
              {user?.fullname?.trim()?.charAt(0)?.toUpperCase() || "P"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <Typography variant="small" className="font-semibold text-gray-800 truncate">
              {user?.fullname || "Phụ huynh"}
            </Typography>
            <Typography variant="small" className="text-gray-500 text-xs truncate">
              {user?.email || ""}
            </Typography>
            <Typography variant="small" className="text-gray-500 text-xs truncate">
              {user?.phone || ""}
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

export default ParentSidebar;
