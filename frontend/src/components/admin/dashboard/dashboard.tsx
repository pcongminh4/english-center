import { useEffect, useMemo, useState } from "react";
import { dashboardService, type AdminDashboardOverview } from "../../../services/dashboard.service";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

const CHART_COLORS = ["bg-blue-500", "bg-indigo-500", "bg-teal-500", "bg-amber-500", "bg-rose-500"];

const AdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await dashboardService.getAdminDashboardOverview({
        periodType: "month",
        month: new Date().toISOString().slice(0, 7),
      });
      setData(response);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
      setError("Không thể tải dữ liệu tổng quan Admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const paymentStatusData = useMemo(() => {
    if (!data) return [];

    return Object.entries(data.revenue.byPaymentStatus)
      .map(([status, value]) => ({
        name: status,
        value,
      }))
      .filter((item) => item.value > 0);
  }, [data]);

  const topCoursesData = useMemo(() => {
    if (!data) return [];

    return data.courses.topCourses.map((course) => ({
      name: course.name.length > 20 ? `${course.name.slice(0, 20)}...` : course.name,
      enrollments: course.enrollmentCount,
      revenue: course.revenue,
    }));
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
          onClick={() => void fetchDashboard()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Tải lại
        </button>
      </div>
    );
  }

  const kpis = [
    {
      title: "Doanh thu thành công",
      value: currencyFormatter.format(data.revenue.totalRevenue),
      subtitle: `${data.revenue.successRate}% giao dịch thành công`,
    },
    {
      title: "Đơn đăng ký hoàn tất",
      value: data.enrollment.totalCompletedEnrollments.toLocaleString("vi-VN"),
      subtitle: `${data.enrollment.enrollmentRate}% hoàn tất`,
    },
    {
      title: "Học viên hoạt động",
      value: data.students.totalActive.toLocaleString("vi-VN"),
      subtitle: `Tổng học viên: ${data.students.totalRegistered.toLocaleString("vi-VN")}`,
    },
    {
      title: "Tỉ lệ điểm danh",
      value: `${percentFormatter.format(data.attendance.avgAttendanceRate)}%`,
      subtitle: `Vắng mặt: ${data.attendance.totalAbsentRecords.toLocaleString("vi-VN")}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Tổng quan quản trị</h1>
        <p className="mt-2 text-blue-100">
          Kỳ báo cáo: <span className="font-semibold">{data.period.label}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{item.title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">{item.value}</p>
            <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Phân bổ trạng thái thanh toán</h2>
          <div className="mt-4 space-y-4">
            {paymentStatusData.length > 0 ? (
              paymentStatusData.map((item, index) => {
                const percentage =
                  data.revenue.totalTransactions > 0
                    ? Math.round((item.value / data.revenue.totalTransactions) * 100)
                    : 0;

                return (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="text-gray-500">
                        {item.value} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${CHART_COLORS[index % CHART_COLORS.length]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                Chưa có dữ liệu thanh toán trong kỳ
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Top khóa học theo đăng ký</h2>
          <div className="mt-4 space-y-4">
            {topCoursesData.length > 0 ? (
              topCoursesData.map((course, index) => {
                const maxEnrollments = Math.max(...topCoursesData.map((item) => item.enrollments), 1);
                const width = Math.round((course.enrollments / maxEnrollments) * 100);

                return (
                  <div key={`${course.name}-${index}`}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{course.name}</span>
                      <span className="text-gray-500">{course.enrollments} lượt</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                Chưa có dữ liệu đăng ký trong kỳ
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Phễu tuyển sinh</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Tổng hồ sơ</p>
            <p className="mt-1 text-xl font-bold text-blue-900">
              {data.admissions.totalRegistered.toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Hoàn tất</p>
            <p className="mt-1 text-xl font-bold text-emerald-900">
              {data.admissions.totalCompleted.toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-sm text-indigo-700">Tỉ lệ hoàn tất</p>
            <p className="mt-1 text-xl font-bold text-indigo-900">
              {percentFormatter.format(data.admissions.completionRate)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
