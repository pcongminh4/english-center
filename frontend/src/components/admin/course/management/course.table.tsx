import {
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import type { Course } from "../../../../types/course/response";
import { CalendarDaysIcon } from "lucide-react";

interface CourseTableProps {
  courses: Course[];
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onManageTests: (id: number) => void;
  onAssignSchedule: (id: number) => void;
}

const CourseTable: React.FC<CourseTableProps> = ({
  courses,
  loading,
  onEdit,
  onDelete,
  onManageTests,
  onAssignSchedule,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      ACTIVE: { color: "bg-green-100 text-green-800", label: "Kích hoạt" },
      INACTIVE: { color: "bg-gray-100 text-gray-600", label: "Không hoạt động" },
      PLANNING: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Đang lên kế hoạch",
      },
    };

    const statusConfig = statusMap[status] || {
      color: "bg-gray-100 text-gray-600",
      label: status,
    };

    return (
      <span
        className={`px-2 inline-flex items-center rounded-full text-xs font-medium ${statusConfig.color}`}
      >
        {statusConfig.label}
      </span>
    );
  };

  const getCourseSkillBadge = (skill: string) => {
    const skillMap: Record<string, { color: string; label: string }> = {
      READING_LISTENING: {
        color: "bg-blue-100 text-blue-800",
        label: "Đọc & Nghe",
      },
      SPEAKING_WRITING: {
        color: "bg-purple-100 text-purple-800",
        label: "Nói & Viết",
      },
      ALL: { color: "bg-indigo-100 text-indigo-800", label: "Tất cả" },
    };

    const skillConfig = skillMap[skill] || {
      color: "bg-gray-100 text-gray-600",
      label: skill,
    };

    return (
      <span
        className={`px-2 inline-flex items-center rounded-full text-xs font-medium ${skillConfig.color}`}
      >
        {skillConfig.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-200 border-t-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>Chưa có khóa học nào.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ảnh
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tên Khóa
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Loại
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kỹ năng
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Giá
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sale
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ngày Tạo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng Thái
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hành Động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {courses.map((course) => (
            <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.name}
                      className="w-16 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Không có ảnh</span>
                    </div>
                  )}
                </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {course.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    course.type === "COURSE" ? "bg-blue-100" : "bg-purple-100"
                  }`}
                ></span>
                {course.type === "COURSE" ? "Khóa học" : "Luyện thi"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {getCourseSkillBadge(course.courseSkill)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {course.sale > 0 ? (
                  <>
                    <span className="text-red-500 line-through mr-2">
                      {formatCurrency(course.price)}
                    </span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(
                        course.price - (course.price * course.sale) / 100,
                      )}
                    </span>
                  </>
                ) : (
                  <span className="text-green-600 font-medium">
                    {formatCurrency(course.price)}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {course.sale > 0 ? `${course.sale}%` : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(course.createdAt).toLocaleDateString("vi-VN")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {getStatusBadge(course.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  {course.status === "ACTIVE" && (
                    <button
                      onClick={() => onAssignSchedule(course.id)}
                      className="text-emerald-600 hover:text-emerald-800 p-1 rounded transition-colors"
                      title="Phân công khóa học"
                    >
                      <CalendarDaysIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onManageTests(course.id)}
                    className="text-purple-600 hover:text-purple-800 p-1 rounded transition-colors"
                    title="Quản lý bài kiểm tra"
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(course.id)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                    title="Sửa"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(course.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                    title="Xóa"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseTable;
