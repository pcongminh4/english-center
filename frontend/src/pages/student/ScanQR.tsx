import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

interface ScanResult {
  success: boolean;
  message: string;
  time?: string;
}

const ScanQR = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    const startScanner = async () => {
      if (isScanningRef.current) return;
      isScanningRef.current = true;

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
            try {
              setIsScanning(false);
              scanner?.clear();
              
              const token = localStorage.getItem('token');
              const response = await axios.post<ScanResult>(
                'http://localhost:3000/api/attendance/scan-qr',
                { qrCode: decodedText },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              setScanResult(response.data);
            } catch (err: any) {
              setError(err.response?.data?.message || 'Điểm danh thất bại');
              setScanResult({ success: false, message: 'Điểm danh thất bại' });
            }
          },
          (_errorMessage: string) => {
            // Ignore scan errors, they happen continuously
          }
        );
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError('Không thể khởi tạo camera');
        isScanningRef.current = false;
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
      isScanningRef.current = false;
    };
  }, []);

  const handleReset = () => {
    setScanResult(null);
    setError('');
    setIsScanning(true);
    isScanningRef.current = false;
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Điểm Danh Bằng QR Code
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {isScanning && (
            <>
              <div className="mb-6 text-center">
                <p className="text-gray-600 mb-2">
                  Đưa mã QR vào vùng quét để điểm danh
                </p>
                <p className="text-sm text-gray-500">
                  Mã QR có hiệu lực trong 30 phút
                </p>
              </div>
              <div id="qr-reader" className="mb-6"></div>
            </>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-center">{error}</p>
            </div>
          )}

          {scanResult && (
            <div className="text-center">
              {scanResult.success ? (
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                    <svg
                      className="w-10 h-10 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">
                    Điểm Danh Thành Công!
                  </h3>
                  <p className="text-gray-600 mb-4">{scanResult.message}</p>
                  {scanResult.time && (
                    <div className="inline-block px-4 py-2 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600">Thời gian điểm danh:</p>
                      <p className="text-lg font-semibold text-gray-800">{scanResult.time}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                    <svg
                      className="w-10 h-10 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-red-700 mb-2">
                    Điểm Danh Thất Bại
                  </h3>
                  <p className="text-gray-600">{scanResult.message}</p>
                </div>
              )}
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Quét Lại
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Hướng dẫn sử dụng:
          </h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>Cho phép camera truy cập khi được yêu cầu</li>
            <li>Đưa mã QR vào vùng quét trên màn hình</li>
            <li>Đợi hệ thống nhận diện và điểm danh tự động</li>
            <li>Mã QR chỉ có hiệu lực trong 30 phút kể từ khi tạo</li>
            <li>Bạn chỉ có thể điểm danh 1 lần cho mỗi buổi học</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;