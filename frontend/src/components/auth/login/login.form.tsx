import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Card,
  CardBody,
  Input,
  Button,
  Typography,
  Spinner,
  Checkbox,
} from "@material-tailwind/react";
import { PhoneIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import {
  loginSchema,
  type LoginFormData,
} from "../../../libs/validation/login.schema";
import { loginService } from "../../../services/auth.service";
import { useAuthStore } from "../../../stores/auth.store";

const LoginForm = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if redirected due to expired session
  useEffect(() => {
    if (sessionStorage.getItem("session_expired") === "true") {
      sessionStorage.removeItem("session_expired");
      toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!", {
        autoClose: 5000,
        closeOnClick: true,
      });
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      clearErrors();
      const payload: LoginFormData = { ...data };
      const user = await loginService(payload);
      if (user && user.data) {
        console.log("Login successful!");
        // Store user data in Zustand store
        setAuth(user.data, user.data.token ?? "");
        sessionStorage.setItem("access_token", user.data.token ?? "");
        // Navigate based on role
        if (user.data.role === "ADMIN") {
          navigate("/admin");
        } else if (user.data.role === "TEACHER") {
          navigate("/teacher/courses");
        } else if (user.data.role === "PARENT") {
          navigate("/parent");
        } else if (user.data.role === "STUDENT") {
          navigate("/student/dashboard");
        } else {
          navigate("/auth/login");
        }
        return;
      }
    } catch (err) {
      // Simulate API call
      console.error("Login failed:", err);
      // Simulate validation
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Typography
            variant="h2"
            className="font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-3"
          >
            Chào mừng trở lại
          </Typography>
          <Typography
            variant="paragraph"
            className="text-gray-600 max-w-xs mx-auto"
          >
            Đăng nhập để truy cập hệ thống tuyển sinh và khám phá cơ hội học tập
            tuyệt vời
          </Typography>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-lg bg-white/90 shadow-2xl border-0 overflow-hidden rounded-2xl">
          <CardBody className="p-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-xs font-bold">
                          !
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Typography
                        variant="small"
                        className="text-red-800 font-medium"
                      >
                        {error}
                      </Typography>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
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
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
              {/* Phone Field */}
              <div className="space-y-2">
                <Typography
                  variant="small"
                  className="font-semibold text-gray-700"
                >
                  Số điện thoại
                </Typography>
                <div className="relative">
                  <Input
                    {...register("phone")}
                    type="tel"
                    placeholder="Nhập số điện thoại (10 số)"
                    className="h-12 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 rounded-lg pl-11 pr-4 transition-all duration-200"
                    labelProps={{
                      className: "hidden",
                    }}
                    containerProps={{ className: "min-w-full" }}
                    error={!!errors.phone}
                    disabled={isLoading}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {errors.phone && (
                  <Typography
                    variant="small"
                    color="red"
                    className="flex items-center gap-1 mt-1"
                  >
                    {errors.phone.message}
                  </Typography>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Typography
                  variant="small"
                  className="font-semibold text-gray-700"
                >
                  Mật khẩu
                </Typography>
                <div className="relative">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className="h-12 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 rounded-lg pl-4 pr-12 transition-all duration-200"
                    labelProps={{
                      className: "hidden",
                    }}
                    containerProps={{ className: "min-w-full" }}
                    error={!!errors.password}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <Typography
                    variant="small"
                    color="red"
                    className="flex items-center gap-1 mt-1"
                  >
                    {errors.password.message}
                  </Typography>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="border-gray-300 rounded"
                    color="indigo"
                  />
                  <Typography
                    variant="small"
                    className="ml-2 text-gray-600 cursor-pointer select-none font-medium"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    Ghi nhớ đăng nhập
                  </Typography>
                </div>
                <Button
                  variant="text"
                  size="sm"
                  className="text-indigo-600 hover:text-indigo-700 normal-case p-0 font-medium"
                  disabled={isLoading}
                >
                  Quên mật khẩu?
                </Button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 normal-case shadow-lg hover:shadow-xl transition-all duration-300 h-12 rounded-lg font-semibold text-white"
                disabled={!isValid || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner className="h-5 w-5" />
                    <span>Đang đăng nhập...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Đăng nhập</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <div className="px-4 bg-white text-gray-500 font-medium">
                  Hoặc
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <Typography variant="small" className="text-gray-600">
                Chưa có tài khoản?{" "}
                <Button
                  variant="text"
                  size="sm"
                  className="text-indigo-600 hover:text-indigo-700 normal-case p-0 font-semibold"
                  disabled={isLoading}
                >
                  Đăng ký ngay
                </Button>
              </Typography>
            </div>
          </CardBody>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <Typography variant="small" className="text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Hỗ trợ kỹ thuật: 1900 1234 | 8:00 - 17:00 (T2-T6)
            </div>
          </Typography>
          <Typography variant="small" className="text-gray-400 mt-2">
            © {new Date().getFullYear()} Đại học ABC. Tất cả quyền được bảo lưu.
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
