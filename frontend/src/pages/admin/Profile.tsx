import { useEffect, useMemo, useState } from "react";
import { Button, Input, Typography } from "@material-tailwind/react";
import type { UpdateUserRequest } from "../../types/user/request";
import type { UserResponse } from "../../types/user/response";
import { getUserMeService, updateUserMeService } from "../../services/user.service";
import { useAuthStore } from "../../stores/auth.store";

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [user, setUser] = useState<UserResponse | null>(null);
  const [form, setForm] = useState<UpdateUserRequest>({
    fullname: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const res = await getUserMeService();
        const fetchedUser = res.data;
        if (!fetchedUser) {
          setUser(null);
          setErrorMessage("Không thể tải thông tin quản trị viên. Dữ liệu phản hồi không hợp lệ.");
          return;
        }

        setUser(fetchedUser);
        setForm({
          fullname: fetchedUser.fullname ?? "",
          email: fetchedUser.email ?? "",
          phone: fetchedUser.phone ?? "",
          password: "",
        });
      } catch (error) {
        console.error("Load admin profile failed:", error);
        setUser(null);
        setErrorMessage("Không thể tải thông tin quản trị viên. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      (form.fullname ?? "") !== (user.fullname ?? "") ||
      (form.email ?? "") !== (user.email ?? "") ||
      (form.phone ?? "") !== (user.phone ?? "") ||
      Boolean(form.password)
    );
  }, [form, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload: UpdateUserRequest = {
        fullname: form.fullname?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        ...(form.password?.trim() ? { password: form.password.trim() } : {}),
      };

      const res = await updateUserMeService(payload);
      const updatedUser = res.data;
      if (!updatedUser) {
        setErrorMessage("Cập nhật thất bại. Dữ liệu phản hồi không hợp lệ.");
        return;
      }

      setUser(updatedUser);
      setForm({
        fullname: updatedUser.fullname ?? "",
        email: updatedUser.email ?? "",
        phone: updatedUser.phone ?? "",
        password: "",
      });

      useAuthStore.getState().updateUser({
        fullname: updatedUser.fullname ?? "",
        email: updatedUser.email ?? "",
        phone: updatedUser.phone ?? "",
      });

      setSuccessMessage("Cập nhật thông tin thành công.");
    } catch (error: unknown) {
      console.error("Update admin profile failed:", error);
      if (typeof error === "object" && error !== null && "message" in error) {
        setErrorMessage(String(error.message));
      } else {
        setErrorMessage("Cập nhật thất bại. Vui lòng thử lại.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (errorMessage && !user) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
        <Typography variant="h6" className="font-bold text-red-600">
          Đã xảy ra lỗi
        </Typography>
        <Typography className="mt-2 text-sm text-slate-600">{errorMessage}</Typography>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Typography variant="h6" className="font-bold text-slate-800">
          Không tìm thấy thông tin quản trị viên
        </Typography>
        <Typography className="mt-2 text-sm text-slate-600">
          Vui lòng đăng nhập lại hoặc liên hệ quản trị hệ thống.
        </Typography>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Typography variant="h4" className="font-bold text-gray-900">
          Thông tin cá nhân
        </Typography>
        <Typography className="mt-1 text-sm text-gray-600">
          Cập nhật thông tin tài khoản quản trị viên của bạn.
        </Typography>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              crossOrigin={undefined}
              label="Họ và tên"
              value={form.fullname || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, fullname: e.target.value }))}
              disabled={saving}
            />
          </div>

          <Input
            crossOrigin={undefined}
            label="Email"
            value={form.email || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            disabled={saving}
          />

          <Input
            crossOrigin={undefined}
            label="Số điện thoại"
            value={form.phone || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            disabled={saving}
          />

          <div className="md:col-span-2">
            <Input
              crossOrigin={undefined}
              type="password"
              label="Mật khẩu mới (tùy chọn)"
              value={form.password || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              disabled={saving}
            />
            <Typography className="mt-2 text-xs text-gray-500">
              Để trống nếu bạn không muốn đổi mật khẩu.
            </Typography>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button type="submit" disabled={saving || !isDirty} className="bg-blue-600">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfile;
