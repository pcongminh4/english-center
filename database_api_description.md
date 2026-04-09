# Tài Liệu Cấu Trúc Cơ Sở Dữ Liệu và API (English Center)

Tài liệu này tổng hợp và mô tả toàn bộ cấu trúc cơ sở dữ liệu (từ Prisma Schema) cũng như hệ thống API (từ các Controllers) của ứng dụng quản lý trung tâm tiếng Anh.

---

## 1. Người Dùng và Phân Quyền (User & Authorization)

Bao gồm các bảng liên quan đến việc xác thực, định danh và lưu hồ sơ thông tin cá nhân tùy theo từng nhóm đối tượng sử dụng hệ thống.

* **Bảng `User`**: Lưu thông tin cốt lõi của tất cả thành viên (Admin, Teacher, Student, Parent). Cấp thông tin xác thực login như `email`, `password`, `phone`, và phân định cấp bậc qua `role`.
    * **API Controllers**: `auth.controller.ts` (Login, Register), `user.controller.ts` (CRUD thông tin quản trị).
* **Bảng `TeacherInfo`**: Bảng thông tin chi tiết dành riêng cho Giáo viên, chứa bằng cấp (`degree`), ảnh đại diện (`avatar`) và trạng thái đang tham gia giảng dạy.
    * **API Controllers**: `teacher.controller.ts`, `teacher.portal.controller.ts` (Dành cho giáo viên xem thông tin portal của họ).
* **Bảng `TeacherFreeDay`**: Lưu lịch rảnh (availability) của các giáo viên theo từng thứ trong tuần, giúp trung tâm dễ dàng bố trí lớp.
    * **API Controllers**: `teacherFreeDay.controller.ts`.
* **Bảng `StudentInfo`**: Lưu hồ sơ đặc biệt của Học viên như Điểm Đầu vào/Đầu ra hiện tại (`scoreRl`, `scoreSw`), CCCD, Ngày sinh.
    * **API Controllers**: `student.controller.ts` (Quản lý học viên và lộ trình).
* **Bảng `ParentInfo` & `ParentStudent`**: Thông tin Phụ huynh và bảng trung gian liên kết Phụ huynh với Học viên, hỗ trợ tính năng phụ huynh theo dõi tiến trình của con mình.
    * **API Controllers**: `parent.controller.ts`.

---

## 2. Quản Lý Khóa Học & Bài Kiểm Tra (Course Management)

Hệ thống quản lý nội dung học thuật, giá cả, và điểm số liên quan đến các khóa huấn luyện.

* **Bảng `Course`**: Lưu mô tả khoá học, môn học (Teaching skill), giá tiền, sự kiện giảm giá, số buổi học, min/max band điểm điều kiện.
    * **API Controllers**: `course.controller.ts`.
* **Bảng `CourseTest`**: Lưu trữ đề thi kiểm tra định kỳ trong nội bộ lớp học của một khóa cụ thể (file, đường dẫn audio bài nghe).
    * **API Controllers**: `coursetest.controller.ts`.
* **Bảng `ScoreCourse`**: Chứa điểm thi nội bộ định kỳ của học viên đối với phần `CourseTest` đã được làm/chấm.
* **Bảng `StudentRegisterCourse`**: Bảng dữ liệu trung gian biểu hiện một Học viên đã mua/có quyền tham gia một Khóa học nào đó.
* **Bảng `Grade`**: Dữ liệu lưu điểm số tổng kết cuối khóa của học viên báo gồm: Exam score, Participation score, Final score và trạng thái kết quả (Pass/Fail/Not Graded).
    * **API Controllers**: `grade.controller.ts`.

---

## 3. Quản Lý Phòng Học, Lịch Học & Điểm Danh (Schedule & Attendance)

Phân bổ nguồn tài nguyên lớp học, giờ học và đánh giá chuyên cần cho học viên.

* **Bảng `Classroom`**: Thông tin các căn phòng học tại trung tâm vật lý, tên phòng và sức chứa tối đa.
    * **API Controllers**: `classroom.controller.ts`.
* **Bảng `Schedule`**: Lịch mở lớp (Session), chỉ định cụ thể học khóa học nào (`courseId`), sử dụng phòng nào (`classroomId`) và giáo viên nào phụ trách (`teacherId`).
    * **API Controllers**: `schedule.controller.ts`.
* **Bảng `ScheduleSession`**: Cấu hình ca học chi tiết (Ví dụ: Lớp dạy học vào các ngày Thứ Hai, Thứ Tư; 17h - 19h).
* **Bảng `ScheduleRegistration`**: Dữ liệu ghi danh của một học viên vào một lớp (`Schedule`) cụ thể. Học viên nằm trong khóa học có thể chọn nhiều lịch để xếp lớp.
    * **API Controllers**: `scheduleRegistration.controller.ts`.
* **Bảng `ScheduleAttendance`**: Hồ sơ (Phiếu) điểm danh chung cho lớp học trong một ngày cụ thể (kèm QRCode điểm danh).
* **Bảng `AttendanceRecord`**: Lưu sự hiện diện của đích danh từng học viên có mặt vào ngày đó theo `ScheduleAttendance`.
    * **API Controllers**: `attendance.controller.ts` (Xử lý quét mã, check-in, check-out, xem sĩ số).

---

## 4. Quá Trình Nhập Học Sinh Mới & Bài Test Đầu Vào (Entrance Exam)

Tích hợp cổng kiểm tra năng lực, phân loại band điểm trình độ đầu vào.

* **Bảng `EntranceExam`**: Thông tin cấu trúc bài thi, thời gian thi tối đa. Có riêng hai định dạng: `READING_LISTENING` và `SPEAKING_WRITING`.
    * **API Controllers**: `entranceExam.controller.ts` (CRUD đề bài tổng quát), `seed.controller.ts` (Import đề thi test mẫu).
* **Bảng `Admission`**: Phiếu đăng ký dự thi. Lưu kết quả của ứng viên từ bên ngoài hệ thống. Tổng hợp điểm: Đọc, Viết, Nghe, Nói và Trạng thái hoàn thành.
* **Hệ Thống Bảng `AdmissionsListening`, `AdmissionsReading`, `AdmissionsSpeaking`, `AdmissionsWriting`**: Các bản ghi chứa kết quả/câu trả lời cụ thể của thí sinh theo quá trình thực hiện bài Admission.
* **Hệ Thống Bảng Ngân Hàng Đề Thi**: 
  * Cho Reading/Listening thi trắc nghiệm khách quan: Có `PartOne` tới `PartSeven`.
    * **API Controllers**: `entranceExamLR.controller.ts`.
  * Cho Speaking/Writing thi tự luận/nói audio: Các part từ bé trải tới lớn (`SpeakingOneTwo`, `WritingOneToFive`,...).
    * **API Controllers**: `speaking.controller.ts`, `writing.controller.ts`.

---

## 5. Quy Trình Thanh Toán & Ghi Danh Chờ (Enrollment & Payment)

Hệ thống cho phép bảo lưu ghế tạm thời và chuyển đổi học phí thanh toán bằng cổng VNPAY.

* **Bảng `EnrollmentDraft`**: Phiếu nháp quá trình Đăng ký ghi danh. Khi một ứng viên đạt bài Test đầu vào và có nguyện vọng vào lớp học, hệ thống tạo bản nháp này chờ quy trình tiếp theo.
    * **API Controllers**: `enrollment.controller.ts`.
* **Bảng `RegistrationToken`**: Token cấp phép / Liên kết ứng viên được quyền vào làm bài thi test hay đăng ký sau khi qua test.
* **Bảng `SeatReservation`**: Dữ liệu giữ chỗ (lock seat) trong một Lịch học (`Schedule`) với trạng thái cấu hình thời gian hết hạn (`expiresAt`).
* **Bảng `PaymentTransaction`**: Lịch sử và đối soát giao dịch thanh toán. Các trường dữ liệu được thiết kế tương thích với IPN của chuẩn VNPAY (Ví dụ: _vnpTransactionNo, vnpBankCode, vnpResponseCode_).
    * **API Controllers**: `payment.controller.ts` (Xử lý tạo đường dẫn redirect ngân hàng và nhận Notification webhook báo kết quả tiền về).
