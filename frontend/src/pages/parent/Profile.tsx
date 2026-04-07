import { useEffect, useMemo, useState } from "react";
import { Button, Input, Typography } from "@material-tailwind/react";
import type { ParentResponse } from "../../types/parent/response";
import type { UpdateParentRequest } from "../../types/parent/request";
import { getParentMeService, updateParentMeService } from "../../services/parent.service";
import { useAuthStore } from "../../stores/auth.store";

const ParentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [parent, setParent] = useState<ParentResponse | null>(null);
  const [form, setForm] = useState<UpdateParentRequest>({
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

        const res = await getParentMeService();
        const fetchedParent = res.data;
        if (!fetchedParent) {
          setParent(null);
          setErrorMessage("Không thể tải thông tin phụ huynh. Dữ liệu phản hồi không hợp lệ.");
          return;
        }

        setParent(fetchedParent);
        setForm({
          fullname: fetchedParent.fullname ?? "",
          email: fetchedParent.email ?? "",
          phone: fetchedParent.phone ?? "",
          password: "",
        });
      } catch (error) {
        console.error("Load parent profile failed:", error);
        setParent(null);
        setErrorMessage("Không thể tải thông tin phụ huynh. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const isDirty = useMemo(() => {
    if (!parent) return false;
    return (
      (form.fullname ?? "") !== (parent.fullname ?? "") ||
      (form.email ?? "") !== (parent.email ?? "") ||
      (form.phone ?? "") !== (parent.phone ?? "") ||
      Boolean(form.password)
    );
  }, [form, parent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parent) return;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload: UpdateParentRequest = {
        fullname: form.fullname?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        ...(form.password?.trim() ? { password: form.password.trim() } : {}),
      };

      const res = await updateParentMeService(payload);
      const updatedParent = res.data;
      if (!updatedParent) {
        setErrorMessage("Cập nhật thất bại. Dữ liệu phản hồi không hợp lệ.");
        return;
      }

      setParent(updatedParent);
      setForm({
        fullname: updatedParent.fullname ?? "",
        email: updatedParent.email ?? "",
        phone: updatedParent.phone ?? "",
        password: "",
      });

      // Sync latest profile info to header/sidebar immediately.
      useAuthStore.getState().updateUser({
        fullname: updatedParent.fullname ?? "",
        email: updatedParent.email ?? "",
        phone: updatedParent.phone ?? "",
      });
      setSuccessMessage("Cập nhật thông tin thành công.");
    } catch (error: any) {
      console.error("Update parent profile failed:", error);
      setErrorMessage(error?.message || "Cập nhật thất bại. Vui lòng thử lại.");
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

  if (errorMessage && !parent) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
        <Typography variant="h6" className="font-bold text-red-600">
          Đã xảy ra lỗi
        </Typography>
        <Typography className="mt-2 text-sm text-slate-600">{errorMessage}</Typography>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Typography variant="h6" className="font-bold text-slate-800">
          Không tìm thấy thông tin phụ huynh
        </Typography>
        <Typography className="mt-2 text-sm text-slate-600">
          Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.
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
          Cập nhật thông tin tài khoản phụ huynh của bạn.
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
              label="Mật khẩu mới (tuỳ chọn)"
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
          <Button
            type="submit"
            disabled={saving || !isDirty}
            className="bg-blue-600"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ParentProfile;

