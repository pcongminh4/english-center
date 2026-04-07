import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  IconButton,
  Input,
  Avatar,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import {
  MagnifyingGlassIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "../../stores/auth.store";

interface AdminHeaderProps {
  toggleSidebar: () => void;
  openSidebar: boolean;
}

const AdminHeader = memo(({ toggleSidebar, openSidebar }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    // Clear auth state
    useAuthStore.getState().logout();
    // Clear session storage
    sessionStorage.removeItem("access_token");
    // Navigate to home page
    navigate("/");
  };

  const handleProfile = () => {
    navigate("/admin/profile");
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Left Section - Toggle and Search */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Menu Toggle */}
          <IconButton
            variant="text"
            size="sm"
            className="hover:bg-blue-50 text-gray-700 transition-all"
            onClick={toggleSidebar}
          >
            {openSidebar ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </IconButton>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="!pl-10 !pr-4 !border-gray-300 focus:!border-blue-500 focus:!ring-blue-200 rounded-lg"
                containerProps={{ className: "min-w-0" }}
                labelProps={{ className: "hidden" }}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Search Icon - Mobile */}
          <IconButton
            variant="text"
            size="sm"
            className="md:hidden hover:bg-blue-50 text-gray-700"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </IconButton>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative">
            <IconButton
              variant="text"
              size="sm"
              className="hover:bg-blue-50 text-gray-700 relative transition-all"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </IconButton>
          </div>

          {/* User Menu */}
          <Menu>
            <MenuHandler>
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 sm:p-2 transition-colors">
                <Avatar
                  src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=32&h=32&fit=crop&crop=face"
                  alt="Admin"
                  size="sm"
                  className="border-2 border-blue-600 ring-2 ring-blue-100"
                />
                <div className="hidden lg:block">
                  <Typography variant="small" className="font-semibold text-gray-800">
                    {user?.fullname || "Quản trị viên"}
                  </Typography>
                  <Typography variant="small" className="text-gray-500 text-xs">
                    {user?.email || "admin@university.edu.vn"}
                  </Typography>
                </div>
              </div>
            </MenuHandler>
            <MenuList className="w-64 border-gray-200 shadow-xl">
              <MenuItem 
                onClick={handleProfile}
                className="flex items-center gap-3 hover:bg-blue-50 text-gray-700 py-3"
              >
                <Avatar
                  src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=32&h=32&fit=crop&crop=face"
                  alt="Admin"
                  size="sm"
                  className="border-2 border-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <Typography variant="small" className="font-semibold text-gray-800 truncate">
                    {user?.fullname || "Quản trị viên"}
                  </Typography>
                  <Typography variant="small" className="text-gray-500 text-xs truncate">
                    {user?.email || "admin@university.edu.vn"}
                  </Typography>
                </div>
              </MenuItem>
              <hr className="my-1 border-gray-200" />
              <MenuItem 
                onClick={handleProfile}
                className="flex items-center gap-2 hover:bg-blue-50 text-gray-700 py-2"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                <Typography variant="small">Cài đặt tài khoản</Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-red-50 text-red-600 py-2"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <Typography variant="small">Đăng xuất</Typography>
              </MenuItem>
            </MenuList>
          </Menu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden px-4 pb-4 border-t border-gray-200 bg-gray-50">
          <div className="relative mt-3">
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!pl-10 !pr-4 !border-gray-300 focus:!border-blue-500 focus:!ring-blue-200 rounded-lg"
              labelProps={{ className: "hidden" }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AdminHeader.displayName = "AdminHeader";

export default AdminHeader;
