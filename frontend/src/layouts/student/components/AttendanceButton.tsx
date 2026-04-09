import { useState } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

interface AttendanceButtonProps {
  classStartTime: string;
  classEndTime: string;
  onCheckIn: () => Promise<void>;
  isCheckedIn: boolean;
}

export const AttendanceButton = ({
  classStartTime,
  classEndTime: _classEndTime,
  onCheckIn,
  isCheckedIn,
}: AttendanceButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // Convert time string (e.g., "08:00") to minutes
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check if button should be enabled
  const isWithinCheckInWindow = () => {
    const currentMinutes = getCurrentTime();
    const startMinutes = timeToMinutes(classStartTime);
    
    // Enable: 15 minutes before to 30 minutes after
    const earlyThreshold = 15;
    const lateThreshold = 30;
    
    return (
      currentMinutes >= startMinutes - earlyThreshold &&
      currentMinutes <= startMinutes + lateThreshold
    );
  };

  const getButtonState = () => {
    if (isCheckedIn) {
      return {
        disabled: true,
        text: 'Đã điểm danh',
        icon: <CheckCircle size={16} />,
        bgColor: 'bg-green-500',
        textColor: 'text-white',
      };
    }

    if (isWithinCheckInWindow()) {
      return {
        disabled: false,
        text: 'Điểm danh',
        icon: <CheckCircle size={16} />,
        bgColor: 'bg-blue-600 hover:bg-blue-700',
        textColor: 'text-white',
      };
    }

    const currentMinutes = getCurrentTime();
    const startMinutes = timeToMinutes(classStartTime);
    
    if (currentMinutes < startMinutes - 15) {
      return {
        disabled: true,
        text: 'Chưa đến giờ',
        icon: <Clock size={16} />,
        bgColor: 'bg-gray-300',
        textColor: 'text-gray-600',
      };
    }

    return {
      disabled: true,
      text: 'Đã quá giờ',
      icon: <AlertCircle size={16} />,
      bgColor: 'bg-gray-300',
      textColor: 'text-gray-600',
    };
  };

  const handleCheckIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onCheckIn();
      toast.success('Điểm danh thành công!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      toast.error('Điểm danh thất bại. Vui lòng thử lại!', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonState = getButtonState();

  return (
    <button
      onClick={handleCheckIn}
      disabled={buttonState.disabled || isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium
        transition-all duration-200
        ${buttonState.bgColor} ${buttonState.textColor}
        ${buttonState.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${isLoading ? 'opacity-75' : ''}
      `}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        buttonState.icon
      )}
      <span>{buttonState.text}</span>
    </button>
  );
};