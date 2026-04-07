import prisma from "../config/database";

type StatisticsPeriodType = "day" | "month" | "year";

export interface StatisticsPeriodFilter {
  periodType?: StatisticsPeriodType;
  date?: string;
  month?: string;
  year?: number;
}

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

export const getPeriodRange = (filter?: StatisticsPeriodFilter) => {
  const now = new Date();
  const periodType = filter?.periodType ?? "month";

  if (periodType === "day") {
    const rawDate = filter?.date ? new Date(`${filter.date}T00:00:00`) : now;
    const selectedDate = isValidDate(rawDate) ? rawDate : now;
    const start = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0,
      0,
      0,
      0
    );
    const end = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      23,
      59,
      59,
      999
    );

    return {
      periodType,
      start,
      end,
      month: selectedDate.getMonth() + 1,
      year: selectedDate.getFullYear(),
      periodLabel: selectedDate.toLocaleDateString("vi-VN"),
    };
  }

  if (periodType === "year") {
    const parsedYear = Number(filter?.year);
    const selectedYear =
      Number.isInteger(parsedYear) && parsedYear > 0 ? parsedYear : now.getFullYear();
    const start = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
    const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    return {
      periodType,
      start,
      end,
      month: 0,
      year: selectedYear,
      periodLabel: `Năm ${selectedYear}`,
    };
  }

  const [parsedYear, parsedMonth] = (filter?.month ?? "").split("-").map(Number);
  const selectedYear =
    Number.isInteger(parsedYear) && parsedYear > 0 ? parsedYear : now.getFullYear();
  const selectedMonth =
    Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
      ? parsedMonth
      : now.getMonth() + 1;
  const start = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
  const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  return {
    periodType: "month" as const,
    start,
    end,
    month: selectedMonth,
    year: selectedYear,
    periodLabel: `Tháng ${selectedMonth}/${selectedYear}`,
  };
};

// ─── Get Course Registration Statistics for Current Month ───

export const getCourseRegistrationStatsService = async (filter?: StatisticsPeriodFilter) => {
  const period = getPeriodRange(filter);

  // Get completed enrollments in selected period
  const enrollments = await prisma.enrollmentDraft.findMany({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: period.start,
        lte: period.end,
      },
    },
    include: {
      seatReservation: {
        include: {
          schedule: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  sale: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Group by course
  const courseStats: Record<string, { name: string; count: number; price: number; sale: number }> = {};

  for (const enrollment of enrollments) {
    const schedule = enrollment.seatReservation?.schedule;
    if (!schedule) continue;

    const course = schedule.course;
    const courseKey = course.id.toString();

    if (!courseStats[courseKey]) {
      courseStats[courseKey] = {
        name: course.name,
        count: 0,
        price: Number(course.price),
        sale: course.sale,
      };
    }
    courseStats[courseKey].count += 1;
  }

  // Convert to array and calculate percentages
  const totalRegistrations = Object.values(courseStats).reduce((sum, c) => sum + c.count, 0);

  const courseData = Object.entries(courseStats).map(([id, stats]) => ({
    courseId: parseInt(id),
    courseName: stats.name,
    registrationCount: stats.count,
    price: stats.price,
    sale: stats.sale,
    finalPrice: Math.round(stats.price * (1 - stats.sale / 100)),
    percentage: totalRegistrations > 0 ? Math.round((stats.count / totalRegistrations) * 100) : 0,
  }));

  // Sort by registration count descending
  courseData.sort((a, b) => b.registrationCount - a.registrationCount);

  return {
    totalRegistrations,
    month: period.month,
    year: period.year,
    periodType: period.periodType,
    periodLabel: period.periodLabel,
    courses: courseData,
  };
};

// ─── Get Revenue Statistics by Course ───

export const getRevenueStatsService = async (
  courseId?: number,
  filter?: StatisticsPeriodFilter
) => {
  const period = getPeriodRange(filter);

  // Build where clause for payments
  const whereClause: any = {
    status: "SUCCESS",
    finalizedAt: {
      not: null,
      gte: period.start,
      lte: period.end,
    },
  };

  if (courseId) {
    whereClause.enrollmentDraft = {
      seatReservation: {
        schedule: {
          coursesId: courseId,
        },
      },
    };
  }

  // Get all successful payments with course info
  const payments = await prisma.paymentTransaction.findMany({
    where: whereClause,
    include: {
      enrollmentDraft: {
        include: {
          seatReservation: {
            include: {
              schedule: {
                include: {
                  course: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      sale: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { finalizedAt: "desc" },
  });

  // Group by course
  const courseRevenue: Record<string, { 
    courseId: number; 
    courseName: string; 
    totalAmount: number; 
    transactionCount: number;
    price: number;
    sale: number;
  }> = {};

  for (const payment of payments) {
    const schedule = payment.enrollmentDraft?.seatReservation?.schedule;
    if (!schedule) continue;

    const course = schedule.course;
    const courseKey = course.id.toString();

    if (!courseRevenue[courseKey]) {
      courseRevenue[courseKey] = {
        courseId: course.id,
        courseName: course.name,
        totalAmount: 0,
        transactionCount: 0,
        price: Number(course.price),
        sale: course.sale,
      };
    }
    courseRevenue[courseKey].totalAmount += payment.amount;
    courseRevenue[courseKey].transactionCount += 1;
  }

  // Convert to array and sort by revenue
  const revenueData = Object.values(courseRevenue)
    .map(rev => ({
      ...rev,
      finalPrice: Math.round(rev.price * (1 - rev.sale / 100)),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const totalRevenue = revenueData.reduce((sum, r) => sum + r.totalAmount, 0);

  return {
    totalRevenue,
    transactionCount: payments.length,
    periodType: period.periodType,
    periodLabel: period.periodLabel,
    courses: revenueData,
  };
};

export const getRevenueStatsByUserService = async (
  userId: number,
  role: string,
  courseId?: number,
) => {
  const whereClause: any = {
    status: "SUCCESS",
    finalizedAt: { not: null },
  };

  if (courseId) {
    whereClause.enrollmentDraft = {
      seatReservation: {
        schedule: {
          coursesId: courseId,
        },
      },
    };
  }

  if (role === "STUDENT") {
    whereClause.OR = [{ studentUserId: userId }, { payerUserId: userId }];
  }

  if (role === "PARENT") {
    const parent = await prisma.parentInfo.findUnique({
      where: { userId },
      include: {
        students: {
          include: {
            student: {
              select: { userId: true },
            },
          },
        },
      },
    });

    const childUserIds = parent?.students
      .map((item) => item.student.userId)
      .filter((id) => Boolean(id));

    whereClause.OR = [
      { payerUserId: userId },
      {
        studentUserId: {
          in: childUserIds && childUserIds.length > 0 ? childUserIds : [-1],
        },
      },
    ];
  }

  const payments = await prisma.paymentTransaction.findMany({
    where: whereClause,
    include: {
      studentUser: {
        select: {
          id: true,
          fullname: true,
          email: true,
        },
      },
      payerUser: {
        select: {
          id: true,
          fullname: true,
          email: true,
        },
      },
      enrollmentDraft: {
        include: {
          seatReservation: {
            include: {
              schedule: {
                include: {
                  course: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      sale: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { finalizedAt: "desc" },
  });

  const courseRevenue: Record<
    string,
    {
      courseId: number;
      courseName: string;
      totalAmount: number;
      transactionCount: number;
      price: number;
      sale: number;
    }
  > = {};

  const userRevenue: Record<
    string,
    {
      userId: number;
      role: "STUDENT" | "PARENT";
      fullname: string;
      email: string;
      totalAmount: number;
      transactionCount: number;
    }
  > = {};

  for (const payment of payments) {
    const schedule = payment.enrollmentDraft?.seatReservation?.schedule;
    if (!schedule) continue;

    const course = schedule.course;
    const courseKey = course.id.toString();

    if (!courseRevenue[courseKey]) {
      courseRevenue[courseKey] = {
        courseId: course.id,
        courseName: course.name,
        totalAmount: 0,
        transactionCount: 0,
        price: Number(course.price),
        sale: course.sale,
      };
    }

    courseRevenue[courseKey].totalAmount += payment.amount;
    courseRevenue[courseKey].transactionCount += 1;

    if (payment.studentUser) {
      const studentKey = `STUDENT-${payment.studentUser.id}`;
      if (!userRevenue[studentKey]) {
        userRevenue[studentKey] = {
          userId: payment.studentUser.id,
          role: "STUDENT",
          fullname: payment.studentUser.fullname,
          email: payment.studentUser.email,
          totalAmount: 0,
          transactionCount: 0,
        };
      }
      userRevenue[studentKey].totalAmount += payment.amount;
      userRevenue[studentKey].transactionCount += 1;
    }

    if (payment.payerUser) {
      const parentKey = `PARENT-${payment.payerUser.id}`;
      if (!userRevenue[parentKey]) {
        userRevenue[parentKey] = {
          userId: payment.payerUser.id,
          role: "PARENT",
          fullname: payment.payerUser.fullname,
          email: payment.payerUser.email,
          totalAmount: 0,
          transactionCount: 0,
        };
      }
      userRevenue[parentKey].totalAmount += payment.amount;
      userRevenue[parentKey].transactionCount += 1;
    }
  }

  const revenueByCourse = Object.values(courseRevenue)
    .map((item) => ({
      ...item,
      finalPrice: Math.round(item.price * (1 - item.sale / 100)),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const revenueByUser = Object.values(userRevenue).sort(
    (a, b) => b.totalAmount - a.totalAmount,
  );

  const totalRevenue = revenueByCourse.reduce((sum, item) => sum + item.totalAmount, 0);

  return {
    totalRevenue,
    transactionCount: payments.length,
    courses: revenueByCourse,
    users: revenueByUser,
  };
};

// ─── Get All Courses for Filter ───

export const getAllCoursesForFilterService = async () => {
  const courses = await prisma.course.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      price: true,
      sale: true,
    },
    orderBy: { name: "asc" },
  });

  return courses.map(c => ({
    id: c.id,
    name: c.name,
    price: Number(c.price),
    sale: c.sale,
    finalPrice: Math.round(Number(c.price) * (1 - c.sale / 100)),
  }));
};

// ─── Get Admission Students (with pagination and filters) ───

interface GetAdmissionStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: number;
  startDate?: string;
  endDate?: string;
}

type AdmissionCourse = {
  id: number;
  name: string;
};

type AdmissionIdentity = {
  email: string;
  phone: string;
  cccd: string;
};

type MatchedStudentCourseSource = {
  user?: {
    fullname: string;
    email: string;
    phone: string;
  };
  registerCourses: Array<{
    course: AdmissionCourse;
  }>;
  scheduleRegistrations: Array<{
    schedule: {
      course: AdmissionCourse;
    };
  }>;
};

const extractUniqueCourses = (
  enrollmentDrafts: Array<{
    seatReservation: {
      schedule: {
        course: AdmissionCourse | null;
      } | null;
    } | null;
  }>
) => {
  const coursesMap = new Map<number, AdmissionCourse>();

  enrollmentDrafts.forEach((draft) => {
    const course = draft.seatReservation?.schedule?.course;
    if (course) {
      coursesMap.set(course.id, course);
    }
  });

  return Array.from(coursesMap.values());
};

const mergeUniqueCourses = (...courseLists: AdmissionCourse[][]) => {
  const coursesMap = new Map<number, AdmissionCourse>();

  courseLists.flat().forEach((course) => {
    coursesMap.set(course.id, course);
  });

  return Array.from(coursesMap.values());
};

const extractStudentCourses = (student: MatchedStudentCourseSource | null) => {
  if (!student) return [];

  const registerCourses = student.registerCourses.map((item) => item.course);
  const scheduleCourses = student.scheduleRegistrations.map(
    (item) => item.schedule.course
  );

  return mergeUniqueCourses(registerCourses, scheduleCourses);
};

const includesSearch = (value: string | null | undefined, keyword: string) => {
  if (!value) return false;
  return value.toLocaleLowerCase().includes(keyword);
};

const buildIdentityConditions = (identity: Partial<AdmissionIdentity>) => {
  const orConditions: Array<Record<string, unknown>> = [];

  if (identity.email?.trim()) {
    orConditions.push({
      user: {
        email: identity.email.trim(),
        deletedAt: null,
      },
    });
  }

  if (identity.phone?.trim()) {
    orConditions.push({
      user: {
        phone: identity.phone.trim(),
        deletedAt: null,
      },
    });
  }

  if (identity.cccd?.trim()) {
    orConditions.push({
      cccd: identity.cccd.trim(),
    });
  }

  return orConditions;
};

const findMatchedStudentByAdmission = async (
  admission: AdmissionIdentity,
  enrollmentDrafts: Array<{ candidateData?: unknown }>
) => {
  const orConditions: Array<Record<string, unknown>> = [
    ...buildIdentityConditions(admission),
  ];

  enrollmentDrafts.forEach((draft) => {
    const candidateData = draft.candidateData as Partial<AdmissionIdentity> | undefined;
    if (!candidateData) return;

    buildIdentityConditions(candidateData).forEach((condition) => {
      orConditions.push(condition);
    });
  });

  if (orConditions.length === 0) {
    return null;
  }

  return prisma.studentInfo.findFirst({
    where: {
      deletedAt: null,
      OR: orConditions as any[],
    },
    select: {
      user: {
        select: {
          fullname: true,
          email: true,
          phone: true,
        },
      },
      registerCourses: {
        select: {
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      scheduleRegistrations: {
        select: {
          schedule: {
            select: {
              course: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

export const getAdmissionStudentsService = async ({ 
  page = 1, 
  limit = 10, 
  search = "",
  courseId,
  startDate,
  endDate
}: GetAdmissionStudentsParams) => {
  const normalizedSearch = search.trim();
  
  // Build where clause
  const whereClause: any = {};
  
  // Filter by date range
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = end;
    }
  }

  const admissions = await prisma.admission.findMany({
    where: whereClause,
    select: {
      id: true,
      fullname: true,
      email: true,
      phone: true,
      cccd: true,
      createdAt: true,
      enrollmentDrafts: {
        where: {
          status: "COMPLETED",
        },
        select: {
          candidateData: true,
          seatReservation: {
            select: {
              schedule: {
                select: {
                  course: {
                    select: {
                      id: true,
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
    orderBy: { createdAt: "desc" },
  });

  const enrichedAdmissions = await Promise.all(
    admissions.map(async (admission) => {
      const draftCourses = extractUniqueCourses(admission.enrollmentDrafts);
      const matchedStudent = await findMatchedStudentByAdmission(
        admission,
        admission.enrollmentDrafts
      );
      const studentCourses = extractStudentCourses(matchedStudent);
      const mergedCourses = mergeUniqueCourses(draftCourses, studentCourses);
      const candidateIdentities = admission.enrollmentDrafts.map((draft) =>
        (draft.candidateData ?? {}) as Partial<AdmissionIdentity> & {
          fullname?: string;
        }
      );

      return {
        id: admission.id,
        fullname: admission.fullname,
        email: admission.email,
        phone: admission.phone,
        cccd: admission.cccd,
        createdAt: admission.createdAt,
        courses: mergedCourses,
        matchedStudentName: matchedStudent?.user?.fullname ?? "",
        matchedStudentEmail: matchedStudent?.user?.email ?? "",
        matchedStudentPhone: matchedStudent?.user?.phone ?? "",
        candidateIdentities,
      };
    })
  );

  const registeredAdmissions = enrichedAdmissions.filter((admission) => {
    if (admission.courses.length === 0) return false;
    if (courseId) {
      return admission.courses.some((course) => course.id === courseId);
    }
    return true;
  });

  const filteredAdmissions = normalizedSearch
    ? registeredAdmissions.filter((admission) => {
        const keyword = normalizedSearch.toLocaleLowerCase();

        if (
          includesSearch(admission.fullname, keyword) ||
          includesSearch(admission.email, keyword) ||
          includesSearch(admission.phone, keyword) ||
          includesSearch(admission.cccd, keyword) ||
          includesSearch(admission.matchedStudentName, keyword) ||
          includesSearch(admission.matchedStudentEmail, keyword) ||
          includesSearch(admission.matchedStudentPhone, keyword)
        ) {
          return true;
        }

        return admission.candidateIdentities.some((candidate) => {
          return (
            includesSearch(candidate.fullname, keyword) ||
            includesSearch(candidate.email, keyword) ||
            includesSearch(candidate.phone, keyword) ||
            includesSearch(candidate.cccd, keyword)
          );
        });
      })
    : registeredAdmissions;

  const total = filteredAdmissions.length;
  const skip = (page - 1) * limit;
  const data = filteredAdmissions.slice(skip, skip + limit).map(
    ({ matchedStudentName, matchedStudentEmail, matchedStudentPhone, candidateIdentities, ...admission }) =>
      admission
  );

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── Get Admission Student Detail ───

export const getAdmissionStudentDetailService = async (id: number) => {
  const admission = await prisma.admission.findUnique({
    where: { id },
    include: {
      enrollmentDrafts: {
        where: {
          status: "COMPLETED",
        },
        select: {
          candidateData: true,
          seatReservation: {
            include: {
              schedule: {
                include: {
                  course: {
                    select: {
                      id: true,
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
  });

  if (!admission) {
    return null;
  }

  const matchedStudent = await findMatchedStudentByAdmission(
    admission,
    admission.enrollmentDrafts
  );

  // Calculate age from CCCD if available
  // CCCD format: 12 digits - DOB at position 5-12 (yyyyMMdd)
  let age: number | null = null;
  let dob: string | null = null;
  if (admission.cccd && admission.cccd.length >= 12) {
    try {
      const birthDateStr = admission.cccd.substring(5, 13);
      const birthYear = parseInt(birthDateStr.substring(0, 4));
      const birthMonth = parseInt(birthDateStr.substring(4, 6)) - 1;
      const birthDay = parseInt(birthDateStr.substring(6, 8));
      
      if (!isNaN(birthYear) && !isNaN(birthMonth) && !isNaN(birthDay)) {
        const birthDate = new Date(birthYear, birthMonth, birthDay);
        dob = birthDate.toLocaleDateString("vi-VN");
        
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        age = calculatedAge;
      }
    } catch (error) {
      console.error("Error parsing CCCD for age:", error);
    }
  }

  // Get registered courses - filter out duplicates
  const draftCourses = extractUniqueCourses(admission.enrollmentDrafts);
  const studentCourses = extractStudentCourses(matchedStudent);
  const courses = mergeUniqueCourses(draftCourses, studentCourses);

  return {
    id: admission.id,
    fullname: admission.fullname,
    email: admission.email,
    phone: admission.phone,
    cccd: admission.cccd,
    age,
    dob,
    courses: courses,
    createdAt: admission.createdAt,
  };
};
