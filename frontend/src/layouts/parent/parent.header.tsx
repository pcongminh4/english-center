import { useNavigate } from "react-router-dom";
import {
  Typography,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "../../stores/auth.store";

const ParentHeader = ({ 
  toggleSidebar,
  openSidebar 
}: { 
  toggleSidebar: () => void;
  openSidebar: boolean;
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const initial = user?.fullname?.trim()?.charAt(0)?.toUpperCase() || "P";

  const handleLogout = () => {
    // Clear auth state
    useAuthStore.getState().logout();
    // Clear session storage
    sessionStorage.removeItem("access_token");
    // Navigate to home page
    navigate("/");
  };

  const handleProfile = () => {
    navigate("/parent/profile");
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

          {/* Title */}
          <div className="hidden sm:block">
            <Typography variant="h6" className="font-bold text-gray-900">
              Cổng thông tin phụ huynh
            </Typography>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Menu */}
          <Menu>
            <MenuHandler>
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 sm:p-2 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center border-2 border-blue-600 ring-2 ring-blue-100">
                  <span className="text-white font-bold text-sm">{initial}</span>
                </div>
                <div className="hidden lg:block">
                  <Typography variant="small" className="font-semibold text-gray-800">
                    {user?.fullname || "Phụ huynh"}
                  </Typography>
                  <Typography variant="small" className="text-gray-500 text-xs">
                    {user?.email && user?.phone
                      ? `${user.email} • ${user.phone}`
                      : user?.phone || user?.email || ""}
                  </Typography>
                </div>
              </div>
            </MenuHandler>
            <MenuList className="w-64 border-gray-200 shadow-xl">
              <MenuItem 
                onClick={handleProfile}
                className="flex items-center gap-3 hover:bg-blue-50 text-gray-700 py-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center border-2 border-blue-600">
                  <span className="text-white font-bold text-sm">{initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Typography variant="small" className="font-semibold text-gray-800 truncate">
                    {user?.fullname || "Phụ huynh"}
                  </Typography>
                  <Typography variant="small" className="text-gray-500 text-xs truncate">
                    {user?.email || ""}
                  </Typography>
                  <Typography
                    variant="small"
                    className="text-gray-500 text-xs truncate"
                  >
                    {user?.phone || ""}
                  </Typography>
                </div>
              </MenuItem>
              <hr className="my-1 border-gray-200" />
              <MenuItem 
                onClick={handleProfile}
                className="flex items-center gap-2 hover:bg-blue-50 text-gray-700 py-2"
              >
                <UserCircleIcon className="h-4 w-4" />
                <Typography variant="small">Thông tin cá nhân</Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleProfile}
                className="flex items-center gap-2 hover:bg-blue-50 text-gray-700 py-2"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                <Typography variant="small">Cài đặt</Typography>
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
    </div>
  );
};

export default ParentHeader;
