import { useState, useEffect } from "react";
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Select,
  Option,
  Spinner,
  Input,
  Button,
} from "@material-tailwind/react";
import {
  PieChart as _PieChart,
  Pie as _Pie,
  Cell as _Cell,
  BarChart as _BarChart,
  Bar as _Bar,
  XAxis as _XAxis,
  YAxis as _YAxis,
  CartesianGrid as _CartesianGrid,
  Tooltip as _Tooltip,
  Legend as _Legend,
} from "recharts";
import type { FC } from "react";
// Casts needed: recharts v3 bundles its own @types/react which conflicts with React 18 types
const PieChart = _PieChart as FC<any>;
const Pie = _Pie as FC<any>;
const Cell = _Cell as FC<any>;
const BarChart = _BarChart as FC<any>;
const Bar = _Bar as FC<any>;
const XAxis = _XAxis as FC<any>;
const YAxis = _YAxis as FC<any>;
const CartesianGrid = _CartesianGrid as FC<any>;
const Tooltip = _Tooltip as FC<any>;
const Legend = _Legend as FC<any>;
import {
  ChartPieIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { statisticsService } from "../../../services/statistics.service";
import type {
  CourseRegistrationStats,
  RevenueStats,
  CourseForFilter,
  StatisticsPeriodFilter,
  StatisticsPeriodType,
} from "../../../services/statistics.service";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

const MONTHS_VN = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const today = new Date();
const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
const defaultYear = today.getFullYear().toString();

const StatisticsPage = () => {
  const [activeTab, setActiveTab] = useState<string>("registrations");
  const [loading, setLoading] = useState(true);
  const [registrationStats, setRegistrationStats] = useState<CourseRegistrationStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [courses, setCourses] = useState<CourseForFilter[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [periodType, setPeriodType] = useState<Extract<StatisticsPeriodType, "month" | "year">>("month");
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const yearOptions = Array.from({ length: 6 }, (_, index) => (today.getFullYear() - index).toString());
  const currentPeriodFilter: StatisticsPeriodFilter =
    periodType === "year"
      ? { periodType, year: Number(selectedYear) }
      : { periodType, month: selectedMonth };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await statisticsService.getCoursesForFilter();
        setCourses(data);
      } catch (error) {
        console.error("Error loading courses:", error);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    const loadRegistrationStats = async () => {
      setLoading(true);
      try {
        const data = await statisticsService.getCourseRegistrationStats(currentPeriodFilter);
        setRegistrationStats(data);
      } catch (error) {
        console.error("Error loading registration stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRegistrationStats();
  }, [periodType, selectedMonth, selectedYear]);

  useEffect(() => {
    const loadRevenueStats = async () => {
      setLoading(true);
      try {
        const courseId = selectedCourseId ? parseInt(selectedCourseId) : undefined;
        const data = await statisticsService.getRevenueStats(courseId, currentPeriodFilter);
        setRevenueStats(data);
      } catch (error) {
        console.error("Error loading revenue stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRevenueStats();
  }, [selectedCourseId, periodType, selectedMonth, selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleResetPeriodFilter = () => {
    setPeriodType("month");
    setSelectedMonth(defaultMonth);
    setSelectedYear(defaultYear);
  };

  const periodDisplayLabel =
    registrationStats?.periodLabel ||
    (periodType === "month"
      ? MONTHS_VN[Math.max(0, Number(selectedMonth.split("-")[1] || "1") - 1)]
      : periodType === "year"
        ? `Năm ${selectedYear}`
        : "-");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{data.courseName}</p>
          <p className="text-blue-600">
            Số lượng: <span className="font-bold">{data.registrationCount}</span>
          </p>
          <p className="text-green-600">
            Tỷ lệ: <span className="font-bold">{data.percentage}%</span>
          </p>
          <p className="text-gray-600">
            Giá: <span className="font-medium">{formatCurrency(data.finalPrice)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RevenueTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{data.courseName}</p>
          <p className="text-green-600">
            Doanh thu: <span className="font-bold">{formatCurrency(data.totalAmount)}</span>
          </p>
          <p className="text-blue-600">
            Số giao dịch: <span className="font-bold">{data.transactionCount}</span>
          </p>
          <p className="text-gray-600">
            Giá khóa học: <span className="font-medium">{formatCurrency(data.finalPrice)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading && !registrationStats) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Thống kê tuyển sinh</h1>
        <p className="text-blue-100 mt-1">Theo dõi và phân tích dữ liệu đăng ký khóa học</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button
              variant={periodType === "month" ? "filled" : "outlined"}
              className={periodType === "month" ? "bg-blue-600" : "border-blue-600 text-blue-600"}
              onClick={() => setPeriodType("month")}
            >
              Theo tháng
            </Button>
            <Button
              variant={periodType === "year" ? "filled" : "outlined"}
              className={periodType === "year" ? "bg-blue-600" : "border-blue-600 text-blue-600"}
              onClick={() => setPeriodType("year")}
            >
              Theo năm
            </Button>

            {periodType === "month" && (
              <div className="min-w-[220px] flex-1">
                <Input
                  label="Chọn tháng"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            )}

            {periodType === "year" && (
              <div className="relative min-w-[220px] flex-1">
                <label
                  htmlFor="statistics-period-year"
                  className="pointer-events-none absolute left-3 -top-2.5 z-10 bg-white px-1 text-xs text-blue-gray-400"
                >
                  Chọn năm
                </label>
                <select
                  id="statistics-period-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full appearance-none rounded-[7px] border border-blue-gray-200 bg-transparent px-3 py-[0.65rem] pr-10 text-sm text-blue-gray-700 outline-none transition-all focus:border-2 focus:border-gray-900"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-gray-400" />
              </div>
            )}
          </div>

          <div className="flex items-end">
            <Button
              variant="outlined"
              className="w-full border-blue-600 text-blue-600"
              onClick={handleResetPeriodFilter}
            >
              Đặt lại thời gian
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onChange={(value: string) => setActiveTab(value)}>
        <TabsHeader className="bg-white rounded-xl shadow-sm">
          <Tab value="registrations" className="flex items-center gap-2">
            <ChartPieIcon className="h-5 w-5" />
            <span>Đăng ký khóa học</span>
          </Tab>
          <Tab value="revenue" className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5" />
            <span>Doanh thu</span>
          </Tab>
        </TabsHeader>

        <TabsBody>
          <TabPanel value="registrations" className="p-0 pt-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner className="h-12 w-12 text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <UserGroupIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Tổng đăng ký</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {registrationStats?.totalRegistrations || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <CalendarIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Thời gian</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {periodDisplayLabel || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <ChartPieIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Số khóa học</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {registrationStats?.courses.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Biểu đồ tỷ lệ đăng ký theo khóa học
                  </h3>
                  {registrationStats && registrationStats.courses.length > 0 ? (
                    <div style={{ width: "100%", height: 350 }}>
                      <PieChart width={500} height={350}>
                        <Pie
                          data={registrationStats.courses}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="registrationCount"
                          nameKey="courseName"
                          label={({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {registrationStats.courses.map((_entry: typeof registrationStats.courses[0], index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      Chưa có dữ liệu đăng ký trong khoảng thời gian này
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Chi tiết đăng ký theo khóa học
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {registrationStats?.courses.map((course, index) => (
                      <div
                        key={course.courseId}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium text-gray-800">{course.courseName}</p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(course.finalPrice)} / học viên
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">{course.registrationCount} HV</p>
                          <p className="text-sm text-blue-600 font-semibold">{course.percentage}%</p>
                        </div>
                      </div>
                    ))}
                    {(!registrationStats || registrationStats.courses.length === 0) && (
                      <div className="text-center text-gray-500 py-8">
                        Chưa có dữ liệu đăng ký
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabPanel>

          <TabPanel value="revenue" className="p-0 pt-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner className="h-12 w-12 text-blue-600" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Select
                      label="Lọc theo khóa học"
                      value={selectedCourseId}
                      onChange={(value) => setSelectedCourseId(value as string || "")}
                    >
                      <Option value="">Tất cả khóa học</Option>
                      {courses.map((course) => (
                        <Option key={course.id} value={course.id.toString()}>
                          {course.name}
                        </Option>
                      ))}
                    </Select>
                    <div className="flex items-center rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                      Kỳ thống kê: {revenueStats?.periodLabel || registrationStats?.periodLabel || "-"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-3 rounded-lg">
                        <CurrencyDollarIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-green-100 text-sm">Tổng doanh thu</p>
                        <p className="text-2xl font-bold">
                          {revenueStats ? formatCurrency(revenueStats.totalRevenue) : "0đ"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <UserGroupIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Số giao dịch</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {revenueStats?.transactionCount || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <ChartPieIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Số khóa có doanh thu</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {revenueStats?.courses.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Doanh thu theo khóa học
                  </h3>
                  {revenueStats && revenueStats.courses.length > 0 ? (
                    <div style={{ width: "100%", height: 400 }}>
                      <BarChart data={revenueStats.courses} width={800} height={400}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="courseName"
                          tick={{ fontSize: 12 }}
                          angle={-20}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value: number) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip content={<RevenueTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="totalAmount"
                          name="Doanh thu (VNĐ)"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      Chưa có dữ liệu doanh thu
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Chi tiết doanh thu theo khóa học
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                            Khóa học
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                            Số giao dịch
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                            Giá khóa học
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                            Doanh thu
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueStats?.courses.map((course) => (
                          <tr
                            key={course.courseId}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-800">{course.courseName}</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
                                {course.transactionCount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">
                              {formatCurrency(course.finalPrice)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-bold text-green-600">
                                {formatCurrency(course.totalAmount)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!revenueStats || revenueStats.courses.length === 0) && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-500">
                              Chưa có dữ liệu doanh thu
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {revenueStats && revenueStats.courses.length > 0 && (
                        <tfoot>
                          <tr className="bg-gray-50">
                            <td className="py-3 px-4 font-bold text-gray-800">Tổng cộng</td>
                            <td className="py-3 px-4 text-right">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-bold">
                                {revenueStats.transactionCount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">-</td>
                            <td className="py-3 px-4 text-right font-bold text-green-600 text-lg">
                              {formatCurrency(revenueStats.totalRevenue)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabPanel>
        </TabsBody>
      </Tabs>
    </div>
  );
};

export default StatisticsPage;
