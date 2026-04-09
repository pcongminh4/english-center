import { useEffect, useMemo, useState } from 'react';
import { Filter, CheckCircle2, RotateCw, ChevronDown, FileText, User } from 'lucide-react';
import { getStudentsByParentMeService } from '../../services/student.service';
import { getCourseTestsByCourseId } from '../../services/coursetest.service';
import { getScoreCourseByCourseTestAndStudent } from '../../services/score-course.service';
import type { StudentResponse } from '../../types/student/response';
import type { CourseTest } from '../../types/coursetest/response';
import formatDate from '../../helpers/formatDate';

const CourseManagement = () => {
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [testsByCourseId, setTestsByCourseId] = useState<Record<number, CourseTest[]>>({});
  const [loadingTestsByCourseId, setLoadingTestsByCourseId] = useState<Record<number, boolean>>({});
  const [scoresByCourseTestId, setScoresByCourseTestId] = useState<Record<number, number | null>>({});
  const [loadingScoresByCourseTestId, setLoadingScoresByCourseTestId] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedCourseId((currentId) => (currentId === id ? null : id));
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const response = await getStudentsByParentMeService();
        const list = Array.isArray(response.data) ? response.data : [];

        setStudents(list);
        setSelectedStudentId(list[0]?.id ?? null);
      } catch (error) {
        console.error('Load students by parent failed:', error);
        setStudents([]);
        setSelectedStudentId(null);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || null,
    [students, selectedStudentId],
  );

  // Refined mapping inside useMemo
const courses = useMemo(() => {
  if (!selectedStudent?.schedules) return [];

  const now = Date.now();

  return selectedStudent.schedules.map((schedule) => {
    const endAt = new Date(schedule.endTime).getTime();
    const isActive = endAt >= now;
    
    // Safely extract course info
    const courseInfo = schedule.course;
    
    return {
      registrationId: schedule.registrationId,
      courseId: schedule.course?.courseId,
      name: courseInfo?.name ?? 'Khóa học không tên',
      skill: (courseInfo?.skill || 'General')
        .replace(/_/g, ' & ')
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase()), 
      thumbnail: courseInfo?.thumbnail,
      status: isActive ? 'ACTIVE' : 'COMPLETED',
      statusLabel: isActive ? 'Đang học' : 'Đã hoàn thành',
      dateLabel: `${formatDate(schedule.startTime)} - ${formatDate(schedule.endTime)}`,
    };
  });
}, [selectedStudent]);

// Fetch tests for each course
useEffect(() => {
  console.log("🔍 Kiểm tra mảng courses:", courses);
  if (courses.length === 0) {
    setTestsByCourseId({});
    setLoadingTestsByCourseId({});
    return;
  }

  const courseIdsToFetch = courses
    .map((course) => course.courseId)
    .filter((courseId): courseId is number => courseId !== null);

  if (courseIdsToFetch.length === 0) {
    setTestsByCourseId({});
    setLoadingTestsByCourseId({});
    return;
  }

  let cancelled = false;

  const fetchAllTests = async () => {
    // Set loading states
    const loadingStates = Object.fromEntries(
      courseIdsToFetch.map((courseId) => [courseId, true]),
    );
    setLoadingTestsByCourseId(loadingStates);

    const results: Record<number, CourseTest[]> = {};

    for (const courseId of courseIdsToFetch) {
      try {
        console.log(`🚀 Đang gọi API lấy bài test cho Course ID: ${courseId}`);
        const response = await getCourseTestsByCourseId(courseId);
        // Handle the paginated response structure: { success, message, data: { data: [...] } }
        const testsData = Array.isArray(response.data?.data) ? response.data.data : [];
        results[courseId] = testsData;
      } catch (error) {
        console.error(`Error fetching tests for course ${courseId}:`, error);
        results[courseId] = [];
      }
    }

    if (!cancelled) {
      setTestsByCourseId(results);
      // Clear loading states
      const clearedLoadingStates = Object.fromEntries(
        courseIdsToFetch.map((courseId) => [courseId, false]),
      );
      setLoadingTestsByCourseId(clearedLoadingStates);
    }
  };

  fetchAllTests();

  return () => {
    cancelled = true;
  };
}, [courses]);

useEffect(() => {
  if (!selectedStudentId) {
    setScoresByCourseTestId({});
    setLoadingScoresByCourseTestId({});
    return;
  }

  const courseTestIds = Object.values(testsByCourseId)
    .flat()
    .map((test) => test.id);

  if (courseTestIds.length === 0) {
    setScoresByCourseTestId({});
    setLoadingScoresByCourseTestId({});
    return;
  }

  let cancelled = false;

  const fetchScoresByCourseTests = async () => {
    const loadingStates = Object.fromEntries(
      courseTestIds.map((courseTestId) => [courseTestId, true]),
    );
    setLoadingScoresByCourseTestId(loadingStates);

    const scoreResults: Record<number, number | null> = {};

    for (const courseTestId of courseTestIds) {
      try {
        const response = await getScoreCourseByCourseTestAndStudent(courseTestId, selectedStudentId);
        scoreResults[courseTestId] = response.data?.score ?? null;
      } catch (error) {
        console.error(
          `Error fetching score for course test ${courseTestId} and student ${selectedStudentId}:`,
          error,
        );
        scoreResults[courseTestId] = null;
      }
    }

    if (!cancelled) {
      setScoresByCourseTestId(scoreResults);

      const clearedLoadingStates = Object.fromEntries(
        courseTestIds.map((courseTestId) => [courseTestId, false]),
      );
      setLoadingScoresByCourseTestId(clearedLoadingStates);
    }
  };

  fetchScoresByCourseTests();

  return () => {
    cancelled = true;
  };
}, [testsByCourseId, selectedStudentId]);

  useEffect(() => {
    setExpandedCourseId(null);
  }, [selectedStudentId]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto mb-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Danh sách thành viên</h2>
        {loadingStudents ? (
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        ) : students.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {students.map((student) => {
              const isActive = selectedStudentId === student.id;

              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`flex items-center gap-3 rounded-xl px-6 py-3 transition-all ${
                    isActive
                      ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  <div className={`rounded-full p-2 ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                    <User size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold leading-tight">{student.fullname}</p>
                  </div>
                  {isActive && <CheckCircle2 size={16} className="ml-2 text-blue-300" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            Chưa có học sinh liên kết với tài khoản phụ huynh.
          </div>
        )}
      </div>

      {/* Header Section */}
      <div className="max-w-5xl mx-auto mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Learning Journey</h1>
          <p className="text-slate-500 mt-1">
            {selectedStudent
              ? `Manage and track ${selectedStudent.fullname}'s English proficiency progress.`
              : "Manage and track your child's English proficiency progress."}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm">
          <Filter size={18} />
          <span className="font-medium text-slate-700">Filter</span>
        </button>
      </div>

      {/* History & Results Label */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          HISTORY & RESULTS
        </div>
      </div>

      {/* Course Stack */}
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Học sinh này chưa có khóa học đã đăng ký.
          </div>
        )}

        {courses.map((course) => {
          const courseTests = course.courseId ? (testsByCourseId[course.courseId] ?? []) : [];
          const isLoadingTests = course.courseId ? loadingTestsByCourseId[course.courseId] ?? false : false;

          return (
          <div 
            key={course.registrationId} 
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col transition-all hover:shadow-md"
          >
            {/* Main Info Row */}
            <div className="flex flex-col md:flex-row items-center">
              {/* Thumbnail */}
              <div className="w-full md:w-64 h-48 bg-slate-100 flex-shrink-0 relative">
                <img 
                  src={course.thumbnail} 
                  alt={course.name} 
                  className="w-full h-full object-cover mix-blend-multiply opacity-80"
                />
              </div>

              {/* Content Info */}
              <div className="flex-grow p-6 w-full">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded tracking-wider uppercase">
                    {course.skill}
                  </span>
                  
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-base font-bold ${
                    course.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-500' : 'bg-green-50 text-green-500'
                  }`}>
                    {course.status === 'ACTIVE' ? <RotateCw size={12} className="animate-spin-slow" /> : <CheckCircle2 size={12} />}
                    {course.statusLabel}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-1">{course.name}</h3>
                <p className="text-sm text-slate-400 italic mb-6">{course.dateLabel}</p>

                {/* Action Button */}
                <div className="flex justify-end">
                  <button 
                    onClick={() => toggleExpand(course.registrationId)}
                    aria-expanded={expandedCourseId === course.registrationId}
                    className={`flex items-center gap-2 rounded-xl border px-6 py-2.5 font-medium transition-all duration-300 ${
                      expandedCourseId === course.registrationId 
                      ? 'border-slate-900 bg-[#4c60a4] text-white shadow-lg shadow-slate-900/10' 
                      : 'border-[#4c60a4] bg-[#4c60a4] text-white shadow-md shadow-[#4c60a4]/20 hover:bg-[#3f518b] hover:border-[#3f518b]'
                    }`}
                  >
                    {expandedCourseId === course.registrationId ? 'Ẩn bài kiểm tra' : 'Xem bài kiểm tra'}
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${expandedCourseId === course.registrationId ? 'rotate-180' : 'rotate-0'}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`grid overflow-hidden border-t border-slate-100 transition-[grid-template-rows,opacity] duration-300 ease-out ${
                expandedCourseId === course.registrationId ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="min-h-0 overflow-hidden bg-slate-50/80">
                <div
                  className={`space-y-3 p-6 transition-transform duration-300 ease-out ${
                    expandedCourseId === course.registrationId ? 'translate-y-0' : '-translate-y-2'
                  }`}
                >
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500">
                    <FileText size={16} />
                    DANH SÁCH BÀI KIỂM TRA
                  </h4>

                  {isLoadingTests && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-500">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                      Đang tải danh sách bài kiểm tra...
                    </div>
                  )}

                  {!isLoadingTests && courseTests.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white/90 p-4 text-sm text-slate-500">
                      Chưa có bài kiểm tra nào.
                    </div>
                  )}

                  {courseTests.map((test) => {
                    const testScore = scoresByCourseTestId[test.id];
                    const isLoadingScore = loadingScoresByCourseTestId[test.id] ?? false;

                    return (
                    <div
                      key={test.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-colors duration-200 hover:bg-white"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                          {test.index}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{test.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-medium text-slate-400">Kết quả</p>
                          <p
                            className={`text-lg font-bold ${
                              isLoadingScore
                                ? 'text-slate-400'
                                : testScore !== undefined && testScore !== null
                                  ? 'text-slate-800'
                                  : 'text-slate-300'
                            }`}
                          >
                            {isLoadingScore
                              ? '...'
                              : testScore !== undefined && testScore !== null
                                ? `${testScore} Điểm`
                                : '--'}
                          </p>
                        </div>
                        <div
                          className={`rounded-full p-2 transition-colors duration-200 ${
                            testScore !== undefined && testScore !== null && testScore >= 80
                              ? 'bg-yellow-50 text-yellow-500'
                              : testScore !== undefined && testScore !== null
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-slate-100 text-slate-300'
                          }`}
                        >
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
};

export default CourseManagement;