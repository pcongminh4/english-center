import { useEffect, useState } from 'react';
import { Receipt, ChevronLeft, ChevronRight, Eye, X, CheckCircle2, Clock, XCircle, Ban } from 'lucide-react';
import { getPaymentHistory, getPaymentInvoice } from '../../services/payment.service';
import type { PaymentHistoryItem, PaymentInvoiceResponse } from '../../types/payment/response';
import formatDate from '../../helpers/formatDate';
import formatPrice from '../../helpers/formatPrice';

const STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SUCCESS: { label: 'Thành công', color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle2 size={14} /> },
  PENDING: { label: 'Đang chờ', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock size={14} /> },
  FAILED: { label: 'Thất bại', color: 'text-red-600 bg-red-50 border-red-200', icon: <XCircle size={14} /> },
  CANCELLED: { label: 'Đã hủy', color: 'text-gray-500 bg-gray-50 border-gray-200', icon: <Ban size={14} /> },
};

const InvoiceModal = ({
  txnRef,
  onClose,
}: {
  txnRef: string;
  onClose: () => void;
}) => {
  const [invoice, setInvoice] = useState<PaymentInvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await getPaymentInvoice(txnRef);
        const raw = res.data as unknown as PaymentInvoiceResponse;
        setInvoice(raw);
      } catch {
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [txnRef]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-blue-600">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Receipt size={20} />
            Chi tiết hóa đơn
          </h2>
          <button onClick={onClose} className="text-white hover:bg-blue-700 rounded-lg p-1.5">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !invoice ? (
            <p className="text-center text-gray-500">Không tải được hóa đơn.</p>
          ) : (
            <>
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Trạng thái</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_LABEL[invoice.status]?.color}`}>
                  {STATUS_LABEL[invoice.status]?.icon}
                  {STATUS_LABEL[invoice.status]?.label ?? invoice.status}
                </span>
              </div>

              {/* TxnRef */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Mã giao dịch</span>
                <span className="text-sm font-mono font-medium text-gray-800">{invoice.txnRef}</span>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Số tiền</span>
                <span className="text-base font-bold text-blue-600">{formatPrice(invoice.amount)}</span>
              </div>

              {/* Paid at */}
              {invoice.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Ngày thanh toán</span>
                  <span className="text-sm text-gray-800">{formatDate(invoice.paidAt)}</span>
                </div>
              )}

              <hr className="border-gray-100" />

              {/* Course */}
              {invoice.course && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Khóa học</p>
                  <p className="text-sm font-medium text-gray-800">{invoice.course.name}</p>
                  {invoice.course.salePercent > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Giá gốc: {formatPrice(invoice.course.originalPrice ?? 0)} &nbsp;·&nbsp; Giảm: {invoice.course.salePercent}%
                    </p>
                  )}
                </div>
              )}

              {/* Student */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Học viên</p>
                <p className="text-sm text-gray-800">{invoice.student.fullname}</p>
                <p className="text-xs text-gray-500">{invoice.student.email}</p>
              </div>

              {/* Payer */}
              {invoice.payer && invoice.payer.userId !== invoice.student.userId && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Người thanh toán</p>
                  <p className="text-sm text-gray-800">{invoice.payer.fullname}</p>
                  <p className="text-xs text-gray-500">{invoice.payer.email}</p>
                </div>
              )}

              {/* Bank info */}
              {invoice.paymentMeta.vnpBankCode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Ngân hàng</span>
                  <span className="text-sm text-gray-800">{invoice.paymentMeta.vnpBankCode}</span>
                </div>
              )}
              {invoice.paymentMeta.vnpTransactionNo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Mã VNPay</span>
                  <span className="text-sm font-mono text-gray-800">{invoice.paymentMeta.vnpTransactionNo}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentHistory = () => {
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTxnRef, setSelectedTxnRef] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await getPaymentHistory({
          page,
          limit,
          ...(statusFilter ? { status: statusFilter } : {}),
        });
        const payload = res.data as unknown as {
          data: PaymentHistoryItem[];
          totalPages: number;
          totalItems: number;
        };
        setItems(Array.isArray(payload?.data) ? payload.data : []);
        setTotalPages(payload?.totalPages ?? 1);
        setTotalItems(payload?.totalItems ?? 0);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page, statusFilter]);

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Receipt className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lịch sử thanh toán</h1>
          <p className="text-sm text-gray-500">Xem lại các giao dịch thanh toán đã thực hiện</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-medium text-gray-600">Trạng thái:</label>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả</option>
          <option value="SUCCESS">Thành công</option>
          <option value="PENDING">Đang chờ</option>
          <option value="FAILED">Thất bại</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        {totalItems > 0 && (
          <span className="ml-auto text-sm text-gray-400">{totalItems} giao dịch</span>
        )}
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Receipt size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-base">Chưa có giao dịch nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="text-left px-5 py-3 font-semibold">Mã GD</th>
                <th className="text-left px-5 py-3 font-semibold">Khóa học</th>
                <th className="text-left px-5 py-3 font-semibold">Học viên</th>
                <th className="text-right px-5 py-3 font-semibold">Số tiền</th>
                <th className="text-center px-5 py-3 font-semibold">Trạng thái</th>
                <th className="text-center px-5 py-3 font-semibold">Ngày tạo</th>
                <th className="text-center px-5 py-3 font-semibold">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const statusInfo = STATUS_LABEL[item.status] ?? { label: item.status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: null };
                return (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-gray-600 text-xs">{item.txnRef}</td>
                    <td className="px-5 py-3.5 text-gray-800 max-w-[160px] truncate">{item.courseName ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-700">{item.studentName}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-blue-600">{formatPrice(item.amount)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedTxnRef(item.txnRef)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        <Eye size={14} />
                        Xem
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">
            Trang <strong>{page}</strong> / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedTxnRef && (
        <InvoiceModal txnRef={selectedTxnRef} onClose={() => setSelectedTxnRef(null)} />
      )}
    </div>
  );
};

export default PaymentHistory;
