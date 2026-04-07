import { User, Calendar, BookOpen } from 'lucide-react';

interface StudentProfileCardProps {
  avatar?: string;
  studentId: string;
  fullname: string;
  dob: string;
  currentClass: string;
}

export const StudentProfileCard = ({
  avatar,
  studentId,
  fullname,
  dob,
  currentClass,
}: StudentProfileCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Avatar Section */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img
              src={avatar}
              alt={fullname}
              className="w-16 h-16 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-xl">
              {fullname.split(' ').map(n => n[0]).join('')}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-white text-lg font-semibold">{fullname}</h3>
            <p className="text-blue-100 text-sm">Mã học viên: {studentId}</p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <User className="text-blue-600" size={20} />
          <div>
            <p className="text-xs text-gray-500">Họ tên</p>
            <p className="font-medium text-gray-800">{fullname}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="text-blue-600" size={20} />
          <div>
            <p className="text-xs text-gray-500">Ngày sinh</p>
            <p className="font-medium text-gray-800">{dob}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BookOpen className="text-blue-600" size={20} />
          <div>
            <p className="text-xs text-gray-500">Lớp đang theo học</p>
            <p className="font-medium text-gray-800">{currentClass}</p>
          </div>
        </div>
      </div>
    </div>
  );
};