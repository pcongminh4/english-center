import axiosInstance from "../configs/axios.config";

export type DashboardPeriodType = "day" | "month" | "year";

export interface DashboardPeriodFilter {
  periodType?: DashboardPeriodType;
  date?: string;
  month?: string;
  year?: number;
}

export interface AdminDashboardOverview {
  period: {
    type: DashboardPeriodType;
    label: string;
    start: string;
    end: string;
  };
  enrollment: {
    totalCompletedEnrollments: number;
    totalPendingEnrollments: number;
    totalFailedEnrollments: number;
    enrollmentRate: number;
    byStatus: Record<string, number>;
  };
  revenue: {
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    successRate: number;
    byPaymentStatus: {
      SUCCESS: number;
      FAILED: number;
      PENDING: number;
      CANCELLED: number;
      EXPIRED: number;
    };
  };
  courses: {
    totalActive: number;
    totalInactive: number;
    topCourses: Array<{
      id: number;
      name: string;
      enrollmentCount: number;
      revenue: number;
      registrationPercentage: number;
    }>;
  };
  students: {
    totalRegistered: number;
    totalActive: number;
    avgScoreRL: number;
    avgScoreSW: number;
  };
  admissions: {
    totalRegistered: number;
    totalCompleted: number;
    completionRate: number;
    byType: {
      READING_LISTENING: number;
      SPEAKING_WRITING: number;
    };
  };
  attendance: {
    avgAttendanceRate: number;
    totalAbsentRecords: number;
  };
}

export interface ParentDashboardOverview {
  period: {
    type: DashboardPeriodType;
    label: string;
  };
  children: Array<{
    studentId: number;
    userId: number;
    fullname: string;
    email: string;
    scoreRL: number;
    scoreSW: number;
    enrolledCourses: number;
    activeSchedules: number;
    attendanceRate: number;
  }>;
  payments: {
    totalSpent: number;
    totalTransactions: number;
    successfulPayments: number;
    failedPayments: number;
    upcomingPayments: Array<{
      enrollmentDraftId: number;
      studentName: string;
      courseName: string;
      amount: number;
      status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED";
      createdAt: string;
    }>;
  };
  enrolledCourses: Array<{
    courseId: number;
    courseName: string;
    courseSkill: "READING_LISTENING" | "SPEAKING_WRITING";
    studentId: number;
    studentName: string;
    totalSessions: number;
    attendedSessions: number;
    testScores: Array<{
      testName: string;
      score: number;
      maxScore: number;
    }>;
    enrollmentStatus: "COMPLETED";
  }>;
  attendance: {
    byChild: Array<{
      studentId: number;
      studentName: string;
      attendanceRate: number;
      totalSessions: number;
      attendedSessions: number;
      absentSessions: number;
    }>;
  };
  financialSummary: {
    totalRevenuePaid: number;
    pendingAmount: number;
    averageSpentPerChild: number;
    children: Array<{
      studentId: number;
      studentName: string;
      totalSpent: number;
      courseCount: number;
    }>;
  };
}

const buildPeriodParams = (filter?: DashboardPeriodFilter) => {
  if (!filter) return {};

  if (filter.periodType === "day") {
    return {
      periodType: "day",
      date: filter.date,
    };
  }

  if (filter.periodType === "year") {
    return {
      periodType: "year",
      year: filter.year,
    };
  }

  return {
    periodType: "month",
    month: filter.month,
  };
};

export const dashboardService = {
  getAdminDashboardOverview: async (
    filter?: DashboardPeriodFilter,
  ): Promise<AdminDashboardOverview> => {
    const response = await axiosInstance.get<{
      success: boolean;
      data: AdminDashboardOverview;
    }>("/dashboard/admin/overview", {
      params: buildPeriodParams(filter),
    });

    return response.data.data as unknown as AdminDashboardOverview;
  },

  getParentDashboardOverview: async (
    studentId?: number,
    filter?: DashboardPeriodFilter,
  ): Promise<ParentDashboardOverview> => {
    const response = await axiosInstance.get<{
      success: boolean;
      data: ParentDashboardOverview;
    }>("/dashboard/parent/overview", {
      params: {
        ...(typeof studentId === "number" ? { studentId } : {}),
        ...buildPeriodParams(filter),
      },
    });

    return response.data.data as unknown as ParentDashboardOverview;
  },
};
