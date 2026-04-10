import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { scanQRCode } from '../../services/attendance.service';

interface ScanResult {
  success: boolean;
  message: string;
  time?: string;
}

const ScanQR = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isScanningRef = useRef(false);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    isScanningRef.current = false;
  }, []);

  useEffect(() => {
    if (!isScanning) return;

    let scanner: Html5QrcodeScanner | null = null;

    const startScanner = async () => {
      if (isScanningRef.current) return;
      isScanningRef.current = true;
      setCameraError('');

      try {
        scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          false
        );

        scannerRef.current = scanner;

        scanner.render(
          async (decodedText: string) => {
            // Prevent multiple scans
            if (isProcessing) return;
            setIsProcessing(true);
            setIsScanning(false);

            try {
              const result = await scanQRCode(decodedText);
              setScanResult(result);
              setError('');
            } catch (err: any) {
              const errorMessage = err?.message || 'Điểm danh thất bại';
              setError(errorMessage);
              setScanResult({ success: false, message: errorMessage });
            } finally {
              setIsProcessing(false);
            }

            // Stop scanner after successful scan
            stopScanner();
          },
          (_errorMessage: string) => {
            // Ignore continuous scan errors
          }
        );
      } catch (err) {
        console.error('Error starting scanner:', err);
        setCameraError('Không thể khởi tạo camera. Vui lòng kiểm tra quyền truy cập camera.');
        isScanningRef.current = false;
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
      isScanningRef.current = false;
    };
  }, [isScanning, isProcessing, stopScanner]);

  const handleReset = () => {
    setScanResult(null);
    setError('');
    setIsProcessing(false);
    setIsScanning(true);
    isScanningRef.current = false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Điểm Danh Bằng QR Code
          </h1>
          <p className="text-gray-500 text-sm">
            Quét mã QR do giáo viên cung cấp để điểm danh
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Scanning Area */}
          {isScanning && (
            <div className="p-6">
              <div className="mb-4 text-center">
                <p className="text-gray-600 font-medium mb-1">
                  📷 Đưa mã QR vào vùng quét
                </p>
                <p className="text-xs text-gray-400">
                  Mã QR có hiệu lực trong 30 phút kể từ khi tạo
                </p>
              </div>

              {/* Camera Container */}
              <div className="relative rounded-xl overflow-hidden border-2 border-blue-200 bg-white">
                <div id="qr-reader" className="w-full [&>div]:bg-transparent [&>div>video]:object-cover [&>div>img]:hidden"></div>
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-blue-600 text-sm font-medium">Đang xử lý...</p>
                    </div>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 text-sm">{cameraError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result Area */}
          {scanResult && (
            <div className="p-6">
              {scanResult.success ? (
                <div className="text-center py-4">
                  {/* Success Animation */}
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">
                    ✅ Điểm Danh Thành Công!
                  </h3>
                  <p className="text-gray-600 mb-4">{scanResult.message}</p>
                  {scanResult.time && (
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-left">
                        <p className="text-xs text-gray-500">Thời gian điểm danh</p>
                        <p className="text-lg font-bold text-gray-800">{scanResult.time}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  {/* Error Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-red-700 mb-2">
                    ❌ Điểm Danh Thất Bại
                  </h3>
                  <p className="text-gray-600 mb-2">{scanResult.message}</p>
                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg inline-block">
                      {error}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Quét Lại Mã QR
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-lg">📋</span> Hướng dẫn sử dụng
          </h3>
          <ul className="space-y-2.5">
            {[
              { icon: '📱', text: 'Cho phép camera truy cập khi được yêu cầu' },
              { icon: '📷', text: 'Đưa mã QR vào vùng quét trên màn hình' },
              { icon: '⚡', text: 'Hệ thống nhận diện và điểm danh tự động' },
              { icon: '⏰', text: 'Mã QR chỉ có hiệu lực trong 30 phút kể từ khi tạo' },
              { icon: '🔒', text: 'Bạn chỉ có thể điểm danh 1 lần cho mỗi buổi học' },
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-gray-600">
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;