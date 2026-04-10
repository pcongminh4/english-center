import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  getScheduleSessionsAttendance,
  generateQR,
  manualCheckIn,
  getFullAttendanceHistory,
  cancelAttendance,
} from "../../../services/attendance.service";
import type { SessionAttendance, FullAttendanceData } from "../../../services/attendance.service";

interface TeacherCourseAttendanceProps {
  scheduleId: number;
  courseName: string;
}

const TeacherCourseAttendance = ({ scheduleId, courseName }: TeacherCourseAttendanceProps) => {
  const [sessions, setSessions] = useState<SessionAttendance[]>([]);
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSession, setExpandedSession] = useState<SessionAttendance | null>(null);
  const [localQRCreatedAt, setLocalQRCreatedAt] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Record<string, FullAttendanceData>>({});
  const [generatingQR, setGeneratingQR] = useState<Record<number, boolean>>({});
  const [checkingIn, setCheckingIn] = useState<Record<number, boolean>>({});
  const [canceling, setCanceling] = useState<Record<number, boolean>>({});
  const [studentErrors, setStudentErrors] = useState<Record<number, string>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [, setTick] = useState(0);

  useEffect(() => {
    loadSessions();
  }, [scheduleId]);

  // Live timer to update QR expiry status every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const getTodayString = () => {
    const now = new Date();
    // Use Vietnam timezone (UTC+7) to get today's date
    const vietnamOffset = 7 * 60; // 7 hours in minutes
    const vietnamTime = new Date(now.getTime() + (vietnamOffset + now.getTimezoneOffset()) * 60000);
    return `${vietnamTime.getFullYear()}-${String(vietnamTime.getMonth() + 1).padStart(2, '0')}-${String(vietnamTime.getDate()).padStart(2, '0')}`;
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await getScheduleSessionsAttendance(scheduleId);
      const today = getTodayString();
      const filteredSessions = data.sessions
        .filter(s => s.actualDate.split('T')[0] <= today)
        .sort((a, b) => b.actualDate.localeCompare(a.actualDate));
      setSessions(filteredSessions);
      setTotalRegistered(data.totalRegistered);
      setError("");
      
      // Update expanded session if it exists in new data
      if (expandedSession) {
        const updatedSession = data.sessions.find(
          s => s.id === expandedSession.id && s.actualDate === expandedSession.actualDate
        );
        if (updatedSession) {
          setExpandedSession(updatedSession);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu điểm danh");
    } finally {
      setLoading(false);
    }
  };

  const getSessionKey = (session: SessionAttendance) => 
    `${session.id}_${new Date(session.actualDate).getTime()}`;

  const loadSessionDetails = async (session: SessionAttendance) => {
    try {
      const data = await getFullAttendanceHistory(session.id, session.actualDate);
      const key = getSessionKey(session);
      setSessionDetails((prev) => ({ ...prev, [key]: data }));
    } catch (err: any) {
      console.error("Không thể tải chi tiết điểm danh:", err);
    }
  };

  const handleGenerateQR = async () => {
    if (!expandedSession) return;

    setGeneratingQR((prev) => ({ ...prev, [expandedSession.id]: true }));
    try {
      await generateQR(expandedSession.id, expandedSession.actualDate);
      
      // Update local timestamp for immediate UI update (won't be overwritten by data reload)
      setLocalQRCreatedAt(new Date().toISOString());
      
      await loadSessions();
      await loadSessionDetails(expandedSession);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tạo mã QR");
    } finally {
      setGeneratingQR((prev) => ({ ...prev, [expandedSession.id]: false }));
    }
  };

  const handleManualCheckIn = async (studentId: number | string) => {
    if (!expandedSession) return;

    const numericStudentId = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
    
    setCheckingIn((prev) => ({ ...prev, [numericStudentId]: true }));
    setStudentErrors((prev) => ({ ...prev, [numericStudentId]: '' })); // Clear previous error for this student
    
    try {
      await manualCheckIn(expandedSession.id, numericStudentId, expandedSession.actualDate);
      setError(""); // Clear global error on success
    } catch (err: any) {
      console.error("Manual check-in error:", err);
      const errorMessage = err.response?.data?.message || "Không thể điểm danh thủ công";
      
      // If error is "already checked in", optimistically update local state
      if (errorMessage === "Học sinh đã điểm danh rồi") {
        setStudentErrors((prev) => ({ ...prev, [numericStudentId]: '' })); // Clear error
        setError(""); // Clear global error
        
        // Optimistically update local state to mark student as attended
        const key = getSessionKey(expandedSession);
        setSessionDetails(prev => {
          const currentDetails = prev[key];
          if (!currentDetails) return prev;
          
          return {
            ...prev,
            [key]: {
              ...currentDetails,
              students: currentDetails.students.map(student =>
                student.studentId === numericStudentId
                  ? { ...student, attended: true }
                  : student
              )
            }
          };
        });
      } else {
        setStudentErrors((prev) => ({ ...prev, [numericStudentId]: errorMessage })); // Set inline error for this student
        setError(""); // Clear global error - use inline error instead
      }
    } finally {
      // Always reload to sync attended status from server (works for both success and error cases)
      await loadSessionDetails(expandedSession);
      await loadSessions();
      setCheckingIn((prev) => ({ ...prev, [numericStudentId]: false }));
    }
  };

  const handleCancelAttendance = async (studentId: number) => {
    if (!expandedSession) return;

    setCanceling((prev) => ({ ...prev, [studentId]: true }));
    setStudentErrors((prev) => ({ ...prev, [studentId]: '' })); // Clear previous error for this student
    
    try {
      await cancelAttendance(expandedSession.id, studentId, expandedSession.actualDate);
      setError(""); // Clear global error on success
    } catch (err: any) {
      console.error("Cancel attendance error:", err);
      const errorMessage = err.response?.data?.message || "Không thể hủy điểm danh";
      setStudentErrors((prev) => ({ ...prev, [studentId]: errorMessage })); // Set inline error for this student
      setError(""); // Clear global error - use inline error instead
    } finally {
      // Always reload to sync attended status from server
      await loadSessionDetails(expandedSession);
      await loadSessions();
      setCanceling((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const toggleSession = async (session: SessionAttendance) => {
    const key = getSessionKey(session);
    
    if (expandedSession && expandedSession.id === session.id && expandedSession.actualDate === session.actualDate) {
      // Collapse if clicking same session
      setExpandedSession(null);
      setLocalQRCreatedAt(null); // Reset local timestamp
    } else {
      // Expand clicked session
      setExpandedSession(session);
      setLocalQRCreatedAt(null); // Reset local timestamp when switching sessions
      if (!sessionDetails[key] && !loadingDetails[key]) {
        setLoadingDetails(prev => ({ ...prev, [key]: true }));
        try {
          await loadSessionDetails(session);
        } finally {
          setLoadingDetails(prev => ({ ...prev, [key]: false }));
        }
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };
  
  const getQRExpiryStatus = (qrCreatedAt: string | null) => {
    if (!qrCreatedAt) return null;
    const created = new Date(qrCreatedAt).getTime();
    const now = Date.now();
    const elapsed = now - created;
    const expiryTime = 30 * 60 * 1000; // 30 minutes (must match backend isQRExpired)
    const remaining = expiryTime - elapsed;

    if (remaining <= 0) {
      return { status: "expired", text: "Đã hết hạn" };
    } else if (remaining < 10 * 60 * 1000) {
      return { status: "warning", text: `${Math.ceil(remaining / 60000)} phút còn lại` };
    } else {
      return { status: "active", text: `${Math.ceil(remaining / 60000)} phút còn lại` };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý điểm danh</h2>
          <p className="text-gray-600 mt-1">{courseName}</p>
        </div>
        <div className="text-sm text-gray-500">
          Tổng số học sinh: <span className="font-semibold text-gray-900">{totalRegistered}</span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">Chưa có buổi học nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Table Header */}
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                  Ngày học
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Thứ
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Giờ học
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Có mặt
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Vắng mặt
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((session) => {
                const key = getSessionKey(session);
                const isExpanded = expandedSession?.id === session.id && expandedSession?.actualDate === session.actualDate;
                // Use localQRCreatedAt first (for regenerated QR), then expandedSession, then session data
                const qrStatus = getQRExpiryStatus(
                  isExpanded && localQRCreatedAt ? localQRCreatedAt :
                  isExpanded && expandedSession ? expandedSession.qrCreatedAt :
                  session.qrCreatedAt
                );

                return (
                  <React.Fragment key={key}>
                    <tr
                      key={`row-${key}`}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        session.status === "FINISHED" ? "opacity-50 bg-gray-100" : ""
                      }`}
                      onClick={() => toggleSession(session)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(session.actualDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.day}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.startTime} - {session.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {session.attendedCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {session.absentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {session.status === "FINISHED" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                            Đã kết thúc
                          </span>
                        ) : session.status === "ACTIVE" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Đang diễn ra
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Lên kế hoạch
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSession(session);
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Row - Using expandedSession state */}
                    {isExpanded && expandedSession && (
                      <tr key={`detail-${key}`} className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* QR Code Section */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">Mã QR điểm danh</h4>
                              {expandedSession.qrCode ? (
                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                  <div className="flex justify-center mb-4">
                                    <QRCodeSVG value={expandedSession.qrCode} size={200} level="H" />
                                  </div>
                                  {qrStatus && (
                                    <div
                                      className={`text-center text-sm font-medium mb-4 ${
                                        qrStatus.status === "expired"
                                          ? "text-red-600"
                                          : qrStatus.status === "warning"
                                          ? "text-yellow-600"
                                          : "text-green-600"
                                      }`}
                                    >
                                      {qrStatus.text}
                                    </div>
                                  )}
                                  {expandedSession.status === "ACTIVE" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateQR();
                                      }}
                                      disabled={generatingQR[expandedSession.id]}
                                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                      {generatingQR[expandedSession.id] ? "Đang tạo..." : "Tạo lại mã QR"}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                                  <p className="text-gray-500 mb-4">Chưa tạo mã QR cho buổi học này</p>
                                  {expandedSession.status === "ACTIVE" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateQR();
                                      }}
                                      disabled={generatingQR[expandedSession.id]}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                      {generatingQR[expandedSession.id] ? "Đang tạo..." : "Tạo mã QR"}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Students List */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">Danh sách điểm danh</h4>
                              {loadingDetails[key] ? (
                                <div className="flex items-center justify-center py-12">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                              ) : sessionDetails[key] ? (
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {sessionDetails[key].students.map((student) => (
                                      <div
                                        key={student.studentId}
                                        className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0"
                                      >
                                        <div className="flex items-center">
                                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-semibold text-sm">
                                              {student.student.user.fullname.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900 text-sm">
                                              {student.student.user.fullname}
                                            </div>
                                            <div className="text-xs text-gray-500">{student.student.user.email}</div>
                                            {/* Inline error message for this student */}
                                            {studentErrors[student.studentId] && (
                                              <div className="text-xs text-red-600 mt-1">
                                                {studentErrors[student.studentId]}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {student.attended ? (
                                            <div className="flex items-center gap-1">
                                              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Đã điểm danh
                                              </div>
                                              {/* Show cancel button only during ACTIVE sessions */}
                                              {expandedSession.status === "ACTIVE" && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelAttendance(student.studentId);
                                                  }}
                                                  disabled={canceling[student.studentId]}
                                                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                                                  title="Hủy điểm danh"
                                                >
                                                  {canceling[student.studentId] ? (
                                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-0V8a8 8 0 00-8 0H4z"></path>
                                                    </svg>
                                                  ) : (
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                  )}
                                                </button>
                                              )}
                                            </div>
                                          ) : expandedSession.status === "FINISHED" ? (
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                              Vắng mặt
                                            </div>
                                          ) : expandedSession.status === "PLANNED" ? (
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                              Chưa bắt đầu
                                            </div>
                                          ) : (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleManualCheckIn(student.studentId);
                                              }}
                                              disabled={checkingIn[student.studentId]}
                                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                              {checkingIn[student.studentId] ? "Đang điểm danh..." : "Điểm danh"}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-12 text-gray-500">
                                  Không thể tải danh sách điểm danh
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherCourseAttendance;