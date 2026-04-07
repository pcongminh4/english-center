import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Input,
  Button,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  DocumentIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import type { UpdateCourseTestRequest as UpdateCourseTestRequestType } from "../../../../types/coursetest/request";
import type { UpdateCourseTestFormData } from "../../../../libs/validation/coursetest.schema";
import type { Course } from "../../../../types/course/response";
import {
  getCoursetestById,
  updateCoursetest,
} from "../../../../services/coursetest.service";
import { getAllCourses } from "../../../../services/course.service";

const CoursetestUpdate = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [existingFileTest, setExistingFileTest] = useState<string>("");
  const [existingAudioTest, setExistingAudioTest] = useState<string>("");
  const [courseId, setCourseId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateCourseTestFormData>();

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: "fileTest" | "audioTest",
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue(fieldName, file);
    }
  };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await getAllCourses({ page: 1, limit: 100 });
        setCourses(response.data?.data || []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách khóa học:", error);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    const loadCoursetest = async () => {
      if (!id) return;
      try {
        setLoadingData(true);
        const response = await getCoursetestById(Number(id));
        if (response.success && response.data) {
          // Set all values including courseId
          setValue("courseId", response.data.courseId);
          setCourseId(response.data.courseId);
          setValue("name", response.data.name);
          setValue("index", response.data.index);
          if (response.data.fileTest) {
            setExistingFileTest(response.data.fileTest);
          }
          if (response.data.audioTest) {
            setExistingAudioTest(response.data.audioTest);
          }
        }
      } catch {
        alert("Không thể tải thông tin bài kiểm tra!");
        navigate("/admin/courses");
      } finally {
        setLoadingData(false);
      }
    };

    loadCoursetest();
  }, [id, navigate, setValue]);

  const onSubmit = async (data: UpdateCourseTestFormData) => {
    if (!id) return;

    const updateData: UpdateCourseTestRequestType = {
      id: Number(id),
    };
    if (data.courseId !== undefined) updateData.courseId = data.courseId;
    if (data.name) updateData.name = data.name;
    if (data.index !== undefined) updateData.index = data.index;
    if (data.fileTest) updateData.fileTest = data.fileTest;
    if (data.audioTest) updateData.audioTest = data.audioTest;

    try {
      setLoading(true);
      const formData = new FormData();
      if (updateData.courseId !== undefined) {
        formData.append("courseId", updateData.courseId.toString());
      }
      if (updateData.name) formData.append("name", updateData.name);
      if (updateData.index !== undefined) {
        formData.append("index", updateData.index.toString());
      }
      if (updateData.fileTest instanceof File) {
        formData.append("fileTest", updateData.fileTest);
      }
      if (updateData.audioTest instanceof File) {
        formData.append("audioTest", updateData.audioTest);
      } else if (updateData.audioTest === null) {
        formData.append("audioTest", "null");
      }

      const response = await updateCoursetest(updateData);
      if (response.success) {
        alert("Cập nhật bài kiểm tra thành công!");
        if (courseId) {
          navigate(`/admin/coursetest?courseId=${courseId}`);
        } else {
          navigate("/admin/coursetest");
        }
      } else {
        alert(response.message || "Cập nhật bài kiểm tra thất bại!");
      }
    } catch (error: unknown) {
      const apiError = error as {
        message?: string;
      };
      console.error("Lỗi khi cập nhật bài kiểm tra:", error);
      alert(apiError?.message ?? "Cập nhật bài kiểm tra thất bại!");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardBody>
            <Typography className="text-center">Đang tải...</Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-xl border border-gray-200">
        <CardHeader
          floated={false}
          shadow={false}
          className="rounded-none bg-gradient-to-r from-blue-600 to-blue-400 p-6"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="text"
              className="text-white hover:bg-white/10"
              onClick={() => {
                if (courseId) {
                  navigate(`/admin/coursetest?courseId=${courseId}`);
                } else {
                  navigate("/admin/coursetest");
                }
              }}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <Typography variant="h4" color="white" className="font-bold">
                Cập Nhật Bài Kiểm Tra
              </Typography>
              <Typography
                variant="small"
                color="white"
                className="mt-1 opacity-90"
              >
                Chỉnh sửa thông tin bài kiểm tra
              </Typography>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Khóa học <span className="text-red-500">*</span>
              </label>
              <select
                {...register("courseId", {
                  required: "Vui lòng chọn khóa học",
                  valueAsNumber: true,
                })}
                className="block w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                disabled={loadingCourses}
              >
                <option value="">Chọn khóa học</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              {errors.courseId && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.courseId.message}
                </Typography>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Tên bài kiểm tra"
                  {...register("name")}
                  error={!!errors.name}
                  crossOrigin={undefined}
                />
                {errors.name && (
                  <Typography variant="small" color="red" className="mt-1">
                    {errors.name.message}
                  </Typography>
                )}
              </div>

              <div>
                <Input
                  label="Thứ tự bài kiểm tra"
                  type="number"
                  {...register("index", { valueAsNumber: true })}
                  error={!!errors.index}
                  crossOrigin={undefined}
                />
                {errors.index && (
                  <Typography variant="small" color="red" className="mt-1">
                    {errors.index.message}
                  </Typography>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="border border-gray-300 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File bài kiểm tra (PDF, DOCX, v.v.)
                  </label>
                  {existingFileTest && (
                    <div className="mb-2 text-sm text-blue-600">
                      File hiện tại: {existingFileTest}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <DocumentIcon className="h-10 w-10 text-gray-400" />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, "fileTest")}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {errors.fileTest && (
                    <Typography variant="small" color="red" className="mt-1">
                      {errors.fileTest.message?.toString()}
                    </Typography>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="border border-gray-300 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File âm thanh (MP3, WAV, v.v.)
                  </label>
                  {existingAudioTest && (
                    <div className="mb-2 text-sm text-blue-600">
                      File hiện tại: {existingAudioTest}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <MusicalNoteIcon className="h-10 w-10 text-gray-400" />
                    <input
                      type="file"
                      accept=".mp3,.wav,.m4a"
                      onChange={(e) => handleFileChange(e, "audioTest")}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {errors.audioTest && (
                    <Typography variant="small" color="red" className="mt-1">
                      {errors.audioTest.message?.toString()}
                    </Typography>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outlined"
                onClick={() => {
                  if (courseId) {
                    navigate(`/admin/coursetest?courseId=${courseId}`);
                  } else {
                    navigate("/admin/coursetest");
                  }
                }}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" className="bg-blue-600" disabled={loading}>
                {loading ? "Đang cập nhật..." : "Cập Nhật"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default CoursetestUpdate;
