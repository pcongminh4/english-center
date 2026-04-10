import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  getFullAttendanceHistory,
  generateQR,
  manualCheckIn,
  cancelAttendance,
} from '../../services/attendance.service';
import type { FullAttendanceData } from '../../services/attendance.service';

const ClassAttendance = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [attendance, setAttendance] = useState<FullAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAttendance = useCallback(async () => {
    try {
      if (!sessionId) return;
      const data = await getFullAttendanceHistory(Number(sessionId));
      setAttendance(data);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông tin điểm danh');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const handleRegenerateQR = async () => {
    setRegenerating(true);
    setError('');
    try {
      if (!sessionId) return;
      await generateQR(Number(sessionId));
      await fetchAttendance();
      setSuccessMsg('Tạo lại mã QR thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo lại mã QR');
    } finally {
      setRegenerating(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualStudentId || !sessionId) return;
    setManualLoading(true);
    setError('');
    try {
      const result = await manualCheckIn(Number(sessionId), Number(manualStudentId));
      setManualStudentId('');
      setSuccessMsg(result.message || 'Điểm danh thủ công thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchAttendance();
    } catch (err: any) {
      setError(err?.message || 'Không thể điểm danh thủ công');
    } finally {
      setManualLoading(false);
    }
  };

  const handleCancelAttendance = async (studentId: number) => {
    if (!sessionId) return;
    setCancelLoading(studentId);
    setError('');
    try {
      await cancelAttendance(Number(sessionId), studentId);
      setSuccessMsg('Hủy điểm danh thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchAttendance();
    } catch (err: any) {
      setError(err?.message || 'Không thể hủy điểm danh');
    } finally {
      setCancelLoading(null);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 15000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  // Auto-hide success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải dữ liệu điểm danh...</p>
        </div>
      </div>
    );
  }

  if (error && !attendance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => { setError(''); setLoading(true); fetchAttendance(); }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!attendance) return null;

  const attendedCount = attendance.attendedCount;
  const totalCount = attendance.totalRegistered;
  const absentCount = totalCount - attendedCount;
  const attendanceRate = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Success Toast */}
        {successMsg && (
          <div className="fixed top-4 right-4 z-50 animate-bounce">
            <div className="bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{successMsg}</span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && attendance && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Điểm Danh Lớp Học</h1>
              <p className="text-sm text-gray-500">
                {attendance.day} | {attendance.startTime} - {attendance.endTime}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: QR Code + Stats */}
          <div className="lg:col-span-1 space-y-5">
            {/* QR Code Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">📱</span> Mã QR Điểm Danh
              </h2>

              {attendance.qrCode ? (
                <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-center mb-4">
                  <QRCodeSVG value={attendance.qrCode} size={220} level="H" />
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-xl flex flex-col items-center justify-center mb-4 text-center">
                  <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <p className="text-gray-400 text-sm">Chưa tạo mã QR</p>
                </div>
              )}

              <button
                onClick={handleRegenerateQR}
                disabled={regenerating}
                className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {regenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {attendance.qrCode ? 'Tạo lại mã QR' : 'Tạo mã QR'}
                  </>
                )}
              </button>

              {/* QR Timer Info */}
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-sm">⏰</span>
                  <p className="text-xs text-amber-700">
                    Mã QR có hiệu lực trong <strong>30 phút</strong> từ khi tạo. Học viên chỉ có thể quét mã một lần.
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Thống kê
              </h3>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Tỷ lệ điểm danh</span>
                  <span className="font-bold text-blue-600">{attendanceRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      attendanceRate >= 80 ? 'bg-green-500' : attendanceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${attendanceRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-600">{attendedCount}</div>
                  <div className="text-xs text-green-600 mt-0.5">Có mặt</div>
                </div>
                <div className="bg-red-50 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                  <div className="text-xs text-red-600 mt-0.5">Vắng mặt</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
                  <div className="text-xs text-blue-600 mt-0.5">Tổng số</div>
                </div>
              </div>
            </div>

            {/* Manual Check-in */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Điểm danh thủ công
              </h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  placeholder="Nhập mã học sinh..."
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleManualCheckIn}
                  disabled={!manualStudentId || manualLoading}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm whitespace-nowrap"
                >
                  {manualLoading ? '...' : 'Điểm danh'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Student List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">👥</span> Danh Sách Học Viên
                </h2>
                <button
                  onClick={fetchAttendance}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Làm mới
                </button>
              </div>

              {attendance.students.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-400">Chưa có học viên nào đăng ký</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {attendance.students.map((student) => {
                    const fullName = student.student?.user?.fullname || 'N/A';
                    const email = student.student?.user?.email || '';
                    const initial = fullName.charAt(0).toUpperCase();

                    return (
                      <div
                        key={student.studentId}
                        className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                          student.attended ? 'bg-green-50/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                            student.attended
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {initial}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{fullName}</div>
                            <div className="text-xs text-gray-400">ID: {student.studentId} • {email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {student.attended ? (
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-xs text-green-600 font-medium">Đã điểm danh</div>
                                {student.checkInTime && (
                                  <div className="text-xs text-gray-400">{student.checkInTime}</div>
                                )}
                              </div>
                              <button
                                onClick={() => handleCancelAttendance(student.studentId)}
                                disabled={cancelLoading === student.studentId}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Hủy điểm danh"
                              >
                                {cancelLoading === student.studentId ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                              Chưa điểm danh
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Danh sách tự động cập nhật mỗi 15 giây • Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassAttendance;