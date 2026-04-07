import { useEffect, useMemo, useState } from "react";
import { dashboardService, type ParentDashboardOverview } from "../../services/dashboard.service";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const ParentDashboard = () => {
  const [data, setData] = useState<ParentDashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);

  const fetchDashboard = async (studentId?: number) => {
    try {
      setLoading(true);
      setError("");
      const response = await dashboardService.getParentDashboardOverview(studentId, {
        periodType: "month",
        month: new Date().toISOString().slice(0, 7),
      });
      setData(response);
    } catch (err) {
      console.error("Failed to load parent dashboard", err);
      setError("Không thể tải dữ liệu tổng quan phụ huynh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard(selectedStudentId);
  }, [selectedStudentId]);

  const avgAttendance = useMemo(() => {
    if (!data || data.children.length === 0) return 0;
    const sum = data.children.reduce((acc, item) => acc + item.attendanceRate, 0);
    return Math.round((sum / data.children.length) * 100) / 100;
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">{error || "Không có dữ liệu tổng quan"}</p>
        <button
          type="button"
          onClick={() => void fetchDashboard(selectedStudentId)}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Tổng quan phụ huynh</h1>
        <p className="mt-2 text-blue-100">
          Kỳ báo cáo: <span className="font-semibold">{data.period.label}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <label htmlFor="studentFilter" className="mb-2 block text-sm font-medium text-gray-600">
          Chọn học sinh
        </label>
        <select
          id="studentFilter"
          value={typeof selectedStudentId === "number" ? selectedStudentId : "all"}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedStudentId(value === "all" ? undefined : Number(value));
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
        >
          <option value="all">Tất cả học sinh</option>
          {data.children.map((child) => (
            <option key={child.studentId} value={child.studentId}>
              {child.fullname}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Số học sinh liên kết</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">{data.children.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổng chi tiêu</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">
            {currencyFormatter.format(data.payments.totalSpent)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Giao dịch thành công</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">{data.payments.successfulPayments}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Điểm danh trung bình</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">{avgAttendance}%</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Tổng quan theo học sinh</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.children.map((child) => (
            <div key={child.studentId} className="rounded-xl border border-gray-200 p-4">
              <p className="text-base font-semibold text-gray-800">{child.fullname}</p>
              <p className="text-sm text-gray-500">{child.email}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-600">Khóa học: <span className="font-semibold">{child.enrolledCourses}</span></p>
                <p className="text-gray-600">Lớp đang học: <span className="font-semibold">{child.activeSchedules}</span></p>
                <p className="text-gray-600">Điểm RL: <span className="font-semibold">{child.scoreRL}</span></p>
                <p className="text-gray-600">Điểm SW: <span className="font-semibold">{child.scoreSW}</span></p>
                <p className="text-gray-600 col-span-2">Tỉ lệ điểm danh: <span className="font-semibold">{child.attendanceRate}%</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Điểm danh theo học sinh</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-2 py-2">Học sinh</th>
                  <th className="px-2 py-2">Đã điểm danh</th>
                  <th className="px-2 py-2">Vắng</th>
                  <th className="px-2 py-2">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody>
                {data.attendance.byChild.map((row) => (
                  <tr key={row.studentId} className="border-b border-gray-100">
                    <td className="px-2 py-2 text-gray-700">{row.studentName}</td>
                    <td className="px-2 py-2 text-gray-700">{row.attendedSessions}</td>
                    <td className="px-2 py-2 text-gray-700">{row.absentSessions}</td>
                    <td className="px-2 py-2 font-semibold text-blue-700">{row.attendanceRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Khoản thanh toán chờ xử lý</h2>
          <div className="mt-4 space-y-3">
            {data.payments.upcomingPayments.length === 0 ? (
              <p className="text-sm text-gray-500">Không có khoản thanh toán đang chờ.</p>
            ) : (
              data.payments.upcomingPayments.map((payment) => (
                <div key={`${payment.enrollmentDraftId}-${payment.createdAt}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-semibold text-amber-900">{payment.studentName}</p>
                  <p className="text-xs text-amber-700">{payment.courseName}</p>
                  <p className="mt-1 text-sm font-bold text-amber-900">
                    {currencyFormatter.format(payment.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Khóa học & kết quả gần đây</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-2 py-2">Học sinh</th>
                <th className="px-2 py-2">Khóa học</th>
                <th className="px-2 py-2">Kỹ năng</th>
                <th className="px-2 py-2">Buổi học</th>
                <th className="px-2 py-2">Điểm test</th>
              </tr>
            </thead>
            <tbody>
              {data.enrolledCourses.map((course) => (
                <tr key={`${course.studentId}-${course.courseId}`} className="border-b border-gray-100">
                  <td className="px-2 py-2 text-gray-700">{course.studentName}</td>
                  <td className="px-2 py-2 text-gray-700">{course.courseName}</td>
                  <td className="px-2 py-2 text-gray-700">{course.courseSkill}</td>
                  <td className="px-2 py-2 text-gray-700">
                    {course.attendedSessions}/{course.totalSessions}
                  </td>
                  <td className="px-2 py-2 text-gray-700">
                    {course.testScores.length > 0
                      ? `${course.testScores[0].score}/${course.testScores[0].maxScore}`
                      : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
