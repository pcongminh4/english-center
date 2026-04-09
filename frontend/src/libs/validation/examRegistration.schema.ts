import { z } from "zod";

export const examRegistrationSchema = z.object({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  fullname: z.string().min(1, "Họ tên là bắt buộc"),
  phone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại không hợp lệ"),
  cccd: z
    .string()
    .min(1, "CCCD là bắt buộc")
    .regex(/^\d{12}$/, "CCCD phải gồm 12 chữ số"),
  examType: z.enum(["READING_LISTENING", "SPEAKING_WRITING"], {
    error: "Loại bài thi là bắt buộc",
  }),
});

export type ExamRegistrationFormData = z.infer<typeof examRegistrationSchema>;
