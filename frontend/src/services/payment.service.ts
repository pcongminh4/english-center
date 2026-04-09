import api from "../configs/axios.config";
import type { ApiResponse } from "../types/api.type";
import type {
  PaymentHistoryResponse,
  PaymentInvoiceResponse,
} from "../types/payment/response";

export const getPaymentHistory = async (
  params: { page?: number; limit?: number; status?: string } = {},
): Promise<ApiResponse<PaymentHistoryResponse>> => {
  const response = await api.get<ApiResponse<PaymentHistoryResponse>>(
    "/payment/history",
    { params },
  );
  return response.data;
};

export const getPaymentInvoice = async (
  txnRef: string,
): Promise<ApiResponse<PaymentInvoiceResponse>> => {
  const response = await api.get<ApiResponse<PaymentInvoiceResponse>>(
    `/payment/invoice/${txnRef}`,
  );
  return response.data;
};
