import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import {
  getCourseRegistrationStatsService,
  getPeriodRange,
  getRevenueStatsService,
  StatisticsPeriodFilter,
} from "./statistics.service";

const roundTo2 = (value: number) => Math.round(value * 100) / 100;

type EnrollmentStatusSummary = {
  [key: string]: number;
};

type PaymentStatusSummary = {
  SUCCESS: number;
  FAILED: number;
  PENDING: number;
  CANCELLED: number;
  EXPIRED: number;
};

export interface AdminDashboardOverview {
  period: {
    type: "day" | "month" | "year";
    label: string;
    start: Date;
    end: Date;
  };
  enrollment: {
    totalCompletedEnrollments: number;
    totalPendingEnrollments: number;
    totalFailedEnrollments: number;
    enrollmentRate: number;
    byStatus: EnrollmentStatusSummary;
  };
  revenue: {
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    successRate: number;
    byPaymentStatus: PaymentStatusSummary;
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
    type: "day" | "month" | "year";
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
      createdAt: Date;
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

export const getAdminDashboardOverviewService = async (
  filter?: StatisticsPeriodFilter,
): Promise<AdminDashboardOverview> => {
  const period = getPeriodRange(filter);

  const [
    enrollmentGrouped,
    payments,
    totalActiveCourses,
    totalInactiveCourses,
    totalStudents,
    studentAvgScores,
    totalAdmissions,
    totalCompletedAdmissions,
    admissionsByType,
    scheduleAttendanceRows,
    courseRegistrationStats,
    revenueStats,
    activeStudentGroups,
  ] = await Promise.all([
    prisma.enrollmentDraft.groupBy({
      by: ["status"],
      where: {
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.paymentTransaction.findMany({
      where: {
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      select: {
        status: true,
        amount: true,
      },
    }),
    prisma.course.count({ where: { status: "ACTIVE" } }),
    prisma.course.count({ where: { status: "INACTIVE" } }),
    prisma.studentInfo.count({
      where: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
    }),
    prisma.studentInfo.aggregate({
      where: {
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      _avg: {
        scoreRl: true,
        scoreSw: true,
      },
    }),
    prisma.admission.count({
      where: {
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
    }),
    prisma.admission.count({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
    }),
    prisma.admission.groupBy({
      by: ["type"],
      where: {
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.scheduleAttendance.findMany({
      where: {
        date: {
          gte: period.start,
          lte: period.end,
        },
      },
      select: {
        id: true,
        totalAbsent: true,
        records: {
          select: {
            id: true,
          },
        },
      },
    }),
    getCourseRegistrationStatsService(filter),
    getRevenueStatsService(undefined, filter),
    prisma.scheduleRegistration.groupBy({
      by: ["studentId"],
      where: {
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const enrollmentByStatus: EnrollmentStatusSummary = enrollmentGrouped.reduce(
    (acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    },
    {} as EnrollmentStatusSummary,
  );

  const totalEnrollmentInPeriod = Object.values(enrollmentByStatus).reduce(
    (sum, count) => sum + count,
    0,
  );

  const totalCompletedEnrollments = enrollmentByStatus.COMPLETED ?? 0;
  const totalPendingEnrollments = enrollmentByStatus.PENDING_PAYMENT ?? 0;
  const totalFailedEnrollments = enrollmentByStatus.FAILED ?? 0;
  const enrollmentRate =
    totalEnrollmentInPeriod > 0
      ? roundTo2((totalCompletedEnrollments / totalEnrollmentInPeriod) * 100)
      : 0;

  const paymentStatusSummary: PaymentStatusSummary = {
    SUCCESS: 0,
    FAILED: 0,
    PENDING: 0,
    CANCELLED: 0,
    EXPIRED: 0,
  };

  let totalRevenue = 0;
  payments.forEach((payment) => {
    paymentStatusSummary[payment.status] += 1;
    if (payment.status === "SUCCESS") {
      totalRevenue += payment.amount;
    }
  });

  const totalTransactions = payments.length;
  const successfulTransactions = paymentStatusSummary.SUCCESS;
  const successRate =
    totalTransactions > 0
      ? roundTo2((successfulTransactions / totalTransactions) * 100)
      : 0;

  const averageTransactionValue =
    successfulTransactions > 0
      ? roundTo2(totalRevenue / successfulTransactions)
      : 0;

  const revenueByCourse = new Map<number, number>();
  revenueStats.courses.forEach((course) => {
    revenueByCourse.set(course.courseId, course.totalAmount);
  });

  const topCourses = courseRegistrationStats.courses.slice(0, 5).map((course) => ({
    id: course.courseId,
    name: course.courseName,
    enrollmentCount: course.registrationCount,
    revenue: revenueByCourse.get(course.courseId) ?? 0,
    registrationPercentage: course.percentage,
  }));

  const admissionsByTypeSummary = {
    READING_LISTENING: 0,
    SPEAKING_WRITING: 0,
  };

  admissionsByType.forEach((item) => {
    admissionsByTypeSummary[item.type] = item._count._all;
  });

  const totalPresentRecords = scheduleAttendanceRows.reduce(
    (sum, row) => sum + row.records.length,
    0,
  );
  const totalAbsentRecords = scheduleAttendanceRows.reduce(
    (sum, row) => sum + row.totalAbsent,
    0,
  );
  const totalExpectedRecords = totalPresentRecords + totalAbsentRecords;
  const avgAttendanceRate =
    totalExpectedRecords > 0
      ? roundTo2((totalPresentRecords / totalExpectedRecords) * 100)
      : 0;

  return {
    period: {
      type: period.periodType,
      label: period.periodLabel,
      start: period.start,
      end: period.end,
    },
    enrollment: {
      totalCompletedEnrollments,
      totalPendingEnrollments,
      totalFailedEnrollments,
      enrollmentRate,
      byStatus: enrollmentByStatus,
    },
    revenue: {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      successRate,
      byPaymentStatus: paymentStatusSummary,
    },
    courses: {
      totalActive: totalActiveCourses,
      totalInactive: totalInactiveCourses,
      topCourses,
    },
    students: {
      totalRegistered: totalStudents,
      totalActive: activeStudentGroups.length,
      avgScoreRL: roundTo2(studentAvgScores._avg.scoreRl ?? 0),
      avgScoreSW: roundTo2(studentAvgScores._avg.scoreSw ?? 0),
    },
    admissions: {
      totalRegistered: totalAdmissions,
      totalCompleted: totalCompletedAdmissions,
      completionRate:
        totalAdmissions > 0
          ? roundTo2((totalCompletedAdmissions / totalAdmissions) * 100)
          : 0,
      byType: admissionsByTypeSummary,
    },
    attendance: {
      avgAttendanceRate,
      totalAbsentRecords,
    },
  };
};

export const getParentDashboardOverviewService = async (
  userId: number,
  filter?: StatisticsPeriodFilter,
  studentId?: number,
): Promise<ParentDashboardOverview> => {
  const period = getPeriodRange(filter);

  const parent = await prisma.parentInfo.findFirst({
    where: {
      userId,
      deletedAt: null,
      user: {
        deletedAt: null,
      },
    },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!parent) {
    throw new AppError("Không tìm thấy thông tin phụ huynh", 404);
  }

  const allChildStudents = parent.students
    .map((item) => item.student)
    .filter((student) => !student.deletedAt && !student.user.deletedAt);

  const selectedChildren =
    typeof studentId === "number"
      ? allChildStudents.filter((child) => child.id === studentId)
      : allChildStudents;

  if (typeof studentId === "number" && selectedChildren.length === 0) {
    throw new AppError("Bạn không có quyền truy cập dữ liệu của học sinh này", 403);
  }

  const studentIds = selectedChildren.map((child) => child.id);
  const childUserIds = selectedChildren.map((child) => child.userId);

  if (studentIds.length === 0) {
    return {
      period: {
        type: period.periodType,
        label: period.periodLabel,
      },
      children: [],
      payments: {
        totalSpent: 0,
        totalTransactions: 0,
        successfulPayments: 0,
        failedPayments: 0,
        upcomingPayments: [],
      },
      enrolledCourses: [],
      attendance: {
        byChild: [],
      },
      financialSummary: {
        totalRevenuePaid: 0,
        pendingAmount: 0,
        averageSpentPerChild: 0,
        children: [],
      },
    };
  }

  const [studentDetails, periodPayments] = await Promise.all([
    prisma.studentInfo.findMany({
      where: {
        id: {
          in: studentIds,
        },
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
        scheduleRegistrations: {
          include: {
            schedule: {
              include: {
                course: true,
                sessions: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        scoreCourses: {
          include: {
            courseTest: {
              select: {
                id: true,
                name: true,
                courseId: true,
              },
            },
          },
        },
      },
    }),
    prisma.paymentTransaction.findMany({
      where: {
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
        OR: [
          { payerUserId: userId },
          {
            studentUserId: {
              in: childUserIds.length > 0 ? childUserIds : [-1],
            },
          },
        ],
      },
      include: {
        studentUser: {
          select: {
            id: true,
            fullname: true,
          },
        },
        enrollmentDraft: {
          select: {
            id: true,
            seatReservation: {
              select: {
                schedule: {
                  select: {
                    course: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const studentSessionIdsMap = new Map<number, Set<number>>();
  const allSessionIds = new Set<number>();

  studentDetails.forEach((student) => {
    const sessionIds = new Set<number>();
    student.scheduleRegistrations.forEach((registration) => {
      registration.schedule.sessions.forEach((session) => {
        sessionIds.add(session.id);
        allSessionIds.add(session.id);
      });
    });
    studentSessionIdsMap.set(student.id, sessionIds);
  });

  const sessionIdList = Array.from(allSessionIds);

  const [periodScheduleAttendances, periodAttendanceRecords, allAttendanceRecords] =
    sessionIdList.length > 0
      ? await Promise.all([
          prisma.scheduleAttendance.findMany({
            where: {
              scheduleDayId: {
                in: sessionIdList,
              },
              date: {
                gte: period.start,
                lte: period.end,
              },
            },
            select: {
              id: true,
              scheduleDayId: true,
            },
          }),
          prisma.attendanceRecord.findMany({
            where: {
              studentId: {
                in: studentIds,
              },
              scheduleAttendance: {
                date: {
                  gte: period.start,
                  lte: period.end,
                },
                scheduleSession: {
                  id: {
                    in: sessionIdList,
                  },
                },
              },
            },
            select: {
              id: true,
              studentId: true,
              scheduleAttendanceId: true,
            },
          }),
          prisma.attendanceRecord.findMany({
            where: {
              studentId: {
                in: studentIds,
              },
              scheduleAttendance: {
                scheduleSession: {
                  id: {
                    in: sessionIdList,
                  },
                },
              },
            },
            select: {
              id: true,
              studentId: true,
              scheduleAttendance: {
                select: {
                  scheduleSession: {
                    select: {
                      scheduleId: true,
                    },
                  },
                },
              },
            },
          }),
        ])
      : [[], [], []];

  const periodAttendanceByStudent = new Map<number, { expected: number; attended: number }>();

  studentDetails.forEach((student) => {
    periodAttendanceByStudent.set(student.id, {
      expected: 0,
      attended: 0,
    });
  });

  periodScheduleAttendances.forEach((attendance) => {
    studentSessionIdsMap.forEach((sessionIds, studentIdKey) => {
      if (sessionIds.has(attendance.scheduleDayId)) {
        const current = periodAttendanceByStudent.get(studentIdKey);
        if (current) {
          current.expected += 1;
        }
      }
    });
  });

  periodAttendanceRecords.forEach((record) => {
    const current = periodAttendanceByStudent.get(record.studentId);
    if (current) {
      current.attended += 1;
    }
  });

  const attendanceBySchedule = new Map<string, number>();
  allAttendanceRecords.forEach((record) => {
    const scheduleId = record.scheduleAttendance.scheduleSession.scheduleId;
    const key = `${record.studentId}-${scheduleId}`;
    attendanceBySchedule.set(key, (attendanceBySchedule.get(key) ?? 0) + 1);
  });

  const now = new Date();

  const children = studentDetails.map((student) => {
    const attendance = periodAttendanceByStudent.get(student.id) ?? {
      expected: 0,
      attended: 0,
    };
    const distinctCourseCount = new Set(
      student.scheduleRegistrations.map((registration) => registration.schedule.course.id),
    ).size;

    const activeSchedules = student.scheduleRegistrations.filter((registration) => {
      return (
        new Date(registration.schedule.startTime) <= now &&
        now <= new Date(registration.schedule.endTime)
      );
    }).length;

    return {
      studentId: student.id,
      userId: student.userId,
      fullname: student.user.fullname,
      email: student.user.email,
      scoreRL: student.scoreRl,
      scoreSW: student.scoreSw,
      enrolledCourses: distinctCourseCount,
      activeSchedules,
      attendanceRate:
        attendance.expected > 0
          ? roundTo2((attendance.attended / attendance.expected) * 100)
          : 0,
    };
  });

  const enrolledCourses = studentDetails.flatMap((student) => {
    return student.scheduleRegistrations.map((registration) => {
      const tests = student.scoreCourses.filter(
        (scoreCourse) => scoreCourse.courseTest.courseId === registration.schedule.course.id,
      );

      const testScores = tests.map((scoreCourse) => ({
        testName: scoreCourse.courseTest.name,
        score: scoreCourse.score,
        maxScore: 100,
      }));

      const attendedSessions =
        attendanceBySchedule.get(`${student.id}-${registration.schedule.id}`) ?? 0;

      return {
        courseId: registration.schedule.course.id,
        courseName: registration.schedule.course.name,
        courseSkill: registration.schedule.course.courseSkill,
        studentId: student.id,
        studentName: student.user.fullname,
        totalSessions: registration.schedule.totalSlot,
        attendedSessions,
        testScores,
        enrollmentStatus: "COMPLETED" as const,
      };
    });
  });

  const successfulPayments = periodPayments.filter(
    (payment) => payment.status === "SUCCESS",
  );
  const failedPayments = periodPayments.filter((payment) => payment.status === "FAILED");
  const pendingPayments = periodPayments.filter((payment) => payment.status === "PENDING");

  const totalSpent = successfulPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const pendingAmount = pendingPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const childSpendingMap = new Map<number, number>();
  successfulPayments.forEach((payment) => {
    if (!payment.studentUserId) return;
    childSpendingMap.set(
      payment.studentUserId,
      (childSpendingMap.get(payment.studentUserId) ?? 0) + payment.amount,
    );
  });

  const financialByChild = studentDetails.map((student) => ({
    studentId: student.id,
    studentName: student.user.fullname,
    totalSpent: childSpendingMap.get(student.userId) ?? 0,
    courseCount: new Set(
      student.scheduleRegistrations.map((registration) => registration.schedule.course.id),
    ).size,
  }));

  const attendanceByChild = studentDetails.map((student) => {
    const attendance = periodAttendanceByStudent.get(student.id) ?? {
      expected: 0,
      attended: 0,
    };

    const absentSessions = Math.max(attendance.expected - attendance.attended, 0);

    return {
      studentId: student.id,
      studentName: student.user.fullname,
      attendanceRate:
        attendance.expected > 0
          ? roundTo2((attendance.attended / attendance.expected) * 100)
          : 0,
      totalSessions: attendance.expected,
      attendedSessions: attendance.attended,
      absentSessions,
    };
  });

  return {
    period: {
      type: period.periodType,
      label: period.periodLabel,
    },
    children,
    payments: {
      totalSpent,
      totalTransactions: periodPayments.length,
      successfulPayments: successfulPayments.length,
      failedPayments: failedPayments.length,
      upcomingPayments: pendingPayments.slice(0, 5).map((payment) => ({
        enrollmentDraftId: payment.enrollmentDraftId,
        studentName: payment.studentUser?.fullname ?? "Chưa xác định",
        courseName:
          payment.enrollmentDraft?.seatReservation?.schedule?.course?.name ??
          "Chưa xác định",
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      })),
    },
    enrolledCourses,
    attendance: {
      byChild: attendanceByChild,
    },
    financialSummary: {
      totalRevenuePaid: totalSpent,
      pendingAmount,
      averageSpentPerChild:
        financialByChild.length > 0
          ? roundTo2(totalSpent / financialByChild.length)
          : 0,
      children: financialByChild,
    },
  };
};
