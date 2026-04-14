# Phân Tích Luồng Nghiệp Vụ Nhập Học & Thanh Toán (Enrollment & Payment Flow)

Tài liệu này mô tả chi tiết toàn bộ chu trình sống của một hồ sơ đăng ký khóa học, kể từ lúc học viên hoàn thành bài test đầu vào, giữ chỗ cho đến khi chuyển khoản thành công và chính thức trở thành học viên của trung tâm.

---

## Giai đoạn 1: Hoàn tất kiểm tra năng lực (Admission -> RegistrationToken)

**Thời điểm:** Khi ứng viên nộp bài thi phần cuối cùng (Reading).
**Xử lý tại:** Bảng `Admission`, `RegistrationToken` | `entranceExam.service.ts`, `email.service.ts`

1. Hàm chấm điểm backend tự động tổng hợp câu đúng và quy đổi ra một hệ số thang điểm cuối cùng. Trạng thái phiếu ghi danh (`Admission`) chuyển sang `COMPLETED`.  
2. Hệ thống (Backend) tự động khởi tạo ngẫu nhiên một mã đăng ký duy nhất (`RegistrationToken`) gắn liền với `admissionId`. Token này được set thời gian hết hạn (`expiresAt`) **chính xác là 24 giờ** tính từ thời điểm tạo.
3. NodeMailer (`email.service.ts`) được kích hoạt ngầm, gửi bảng điểm điện tử đẹp mắt vào **Email** của người thi.
4. Trong email có đính kèm một nút dẫn hướng về hệ thống Frontend chứa Query Params mã token: `http://localhost:5173/dang-ky-khoa-hoc?token=xxxxxxxx-xxxx-...`

---

## Giai đoạn 2: Tiếp nhận liên kết và Xác thực (Token Validation)

**Thời điểm:** Người dùng nhấp vào link đăng ký trong Email.
**Xử lý tại:** Bảng `RegistrationToken` | Frontend `enrollment.page.tsx` + Zustand Store

1. Frontend truy cập vào `EnrollmentFlowPage`, bắt sự kiện URL có chứa tham số `?token=`.
2. Gửi lệnh lấy Token Validation tới Backend API (`/api/enrollments/validate-token/:token`).
3. Backend kiểm tra tính bảo mật của `RegistrationToken`:
   - Token có tồn tại không?
   - Token đã hết hạn 24 giờ chưa?
   - `Admission` tương ứng với mã token nãy đã ghi danh khóa học xong chưa? (Ngăn chặn tình trạng 1 link dùng đăng ký nhiều lần thành công).
4. Nếu hợp lệ, hệ thống trả thông tin `email`, `fullname`, `phone`, `cccd` của học sinh.
5. Về mặt giao diện UI Frontend, Zustard Store sẽ mở trạng thái Step 1 mở đầu Flow với dữ liệu được mồi sẵn.

---

## Giai đoạn 3: Điền hồ sơ, Chọn Lịch và "Giữ Chỗ Tạm Thời" (Draft & Seat Reservation)

**Thời điểm:** Dòng chảy Wizard do học sinh điền từ Step 1 đến Step 2 trên UI.
**Xử lý tại:** Bảng `EnrollmentDraft`, `SeatReservation`, `Schedule` | Frontend Form + Backend `createDraftService`

1. **Điền hồ sơ (Student Form):** Học viên cung cấp mật khẩu cá nhân muốn tạo, ngày sinh, và có thể cấp thêm thông tin Phụ huynh đi kèm (nếu là trẻ vị thành niên).
2. **Chọn lịch học (Schedule Select):**
   - Backend sẽ trả về list danh sách các Lịch học (`Schedule`) tuỳ thuộc vào bài test đầu vào thuộc kỹ năng nào (Ví dụ Reading-Listening thì đề xuất khóa cấp Reading-Listening). 
   - Backend chỉ hiển thị các ca học khi tính toán **Available Slots (Lỗ trống) > 0**. Số suất lấp trống được tính bằng: Số người đăng ký thức tế (`registrations`) cộng với các phiếu giữ ghế ảo chưa hết hạn (`seatReservations`).
3. **Gửi đơn khởi tạo (Create Draft API):**
   - Học sinh chọn được Lịch bèn nhấn nút Đi tiếp.
   - Backend thu thập cấu trúc JSON thông tin ứng viên tạo ngay bảng `EnrollmentDraft` (Status: `DRAFT`).
   - Kèm theo tạo một đối tượng **`SeatReservation`**. Đây là cơ chế chống cháy hàng (Lock seat). Ghế này sẽ chỉ có trạng thái `ACTIVE` (khoá ghế giữ suất) cực kỳ **áp lực với thời hạn duy nhất 30 phút**. Trong 30 phút, nếu người dùng không thanh toán tiền thì huỷ.

---

## Giai đoạn 4: Tạo đơn Thanh Toán & Chuyển hướng VNPay (Payment Setup)

**Thời điểm:** Step 3 Checkout UI, người dùng xác nhận số tiền.
**Xử lý tại:** Bảng `PaymentTransaction`, `EnrollmentDraft` | Backend `createPaymentUrlService`

1. API yêu cầu khởi tạo mã thanh toán được gọi.
2. Backend tra cứu `Schedule`, biết được Khoá học (`Course`) có mức giá nào (`price`) và có khuyến mãi (`sale`) nào không. Tính toán ra số tiền thực tế (VND).
3. `EnrollmentDraft` chuyển thành Status `PENDING_PAYMENT`.
4. Tạo record `PaymentTransaction` với trạng thái `PENDING`. Mã code đơn hàng gửi qua VNPay gốc rễ được lấy là thời gian tạo nối với draftId `txnRef`.
5. Sinh ra URL mã hóa bảo mật gửi trình duyệt. Trình duyệt văng người dùng ra khỏi web trung tâm, đẩy qua nền tảng Sandbox/Live của VNPay.

---

## Giai đoạn 5: Giao Dịch Chuyển Khoản & Xác Nhận Bảo Mật Bắt Chéo (IPN + Return URL)

**Thời điểm:** Người dùng scan QR thanh toán bên Bank, hệ thống Bank trả kết quả.
**Xử lý tại:** Bảng `EnrollmentDraft`, `PaymentTransaction`, `SeatReservation` và `User`, `StudentInfo`, `ScheduleRegistration`.

**VNPay có cơ cấu hai chốt chặn đảm bảo sai số thất thoát tiền là 0%:**

### Luồng 1 (Ngầm): IPN (Instant Payment Notification / Webhook)
Ngay khi trừ tiền, Server của VNPay gọi API "Ngầm" `ipnHandler` thẳng chọc vào Server Trung tâm và mang theo Checksum.
- Nếu checksum hợp lệ, `vnpResponseCode=00` (Giao dịch trừ tiền thật). Hệ thống chuyển `PaymentTransaction` sang `SUCCESS`.
- Và Quan trọng nhất - **Finalize Enrollment (Chốt Sổ Sinh Viên)** chạy:
  - Tạo tài khoản (`User`) Role `STUDENT`.
  - Nạp thẳng file học bạ điểm đầu vào cho học viên này (`StudentInfo`).
  - Nối hồ sơ `Parent` của phụ huynh (nếu có).
  - Khởi tạo ghi danh `ScheduleRegistration` và `StudentRegisterCourse` -> Học viên chính thức là thành viên của lớp học. Mở khóa tổng số lượng đăng kí `totalRegister` + 1.
  - Hủy hiệu lực giữ chỗ ảo `SeatReservation` (chuyển sang trạng thái `CONVERTED`), biến `EnrollmentDraft` sang chữ `COMPLETED`.
- Nếu VNPay báo `FAILED` (Bị hủy giao dịch / Sai PIN / Không kích hoạt thẻ): Xóa bỏ dòng giữ chỗ `SeatReservation` trả ghế cho hệ thống cộng đồng đăng ký tự do, báo trạng thái Draft `FAILED`.

### Luồng 2 (Hiển Thị Trình Duyệt): Return URL Redirect
Cổng VNPay điều hướng trình duyệt quay ngược về Route Frontend `/payment-result`.
- Tại đây, hệ thống chọc Server API một lần nữa `returnHandlerService` với nội dung y chang IPN.
- Cơ chế ***Idempotent* (Hành động có tính đồng bộ an toàn):** Nếu luồng IPN ngầm ở trên chưa kịp kích hoạt mà đường truyền Internet khách hàng nhanh quá lao vào. Thì nó hoạt động y chang Luồng IPN chốt sổ sinh viên để kịp thời cho người dùng hiển thị giao diện báo *"Tick Xanh - Bạn đã thanh toán thành công khóa học"*.  

---

Kết thúc hoàn toàn dòng sự kiện (Life-cycle) Ghi danh thành công tân học viên.
