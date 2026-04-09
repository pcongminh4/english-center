export interface PaymentHistoryItem {
  id: number;
  txnRef: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  createdAt: string;
  finalizedAt: string | null;
  studentUserId: number | null;
  payerUserId: number | null;
  studentUser: { id: number; fullname: string; email: string } | null;
  payerUser: { id: number; fullname: string; email: string } | null;
  studentName: string;
  studentEmail: string;
  courseName: string | undefined;
}

export interface PaymentHistoryResponse {
  data: PaymentHistoryItem[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaymentInvoiceResponse {
  txnRef: string;
  paymentId: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount: number;
  paidAt: string | null;
  paymentMeta: {
    vnpTransactionNo: string | null;
    vnpBankCode: string | null;
    vnpPayDate: string | null;
    vnpResponseCode: string | null;
  };
  student: {
    fullname: string;
    email: string;
    phone: string;
    userId: number | null;
  };
  payer: {
    userId: number;
    fullname: string;
    email: string;
  } | null;
  course: {
    id: number;
    name: string;
    originalPrice: number | null;
    salePercent: number;
    finalPrice: number;
  } | null;
  schedule: {
    id: number;
    startTime: string;
    endTime: string;
  } | null;
}
