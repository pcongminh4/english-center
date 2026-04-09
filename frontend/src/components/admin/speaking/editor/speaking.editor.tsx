import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Typography,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Spinner,
  Input,
} from "@material-tailwind/react";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { createSpeaking, updateSpeaking, getSpeakingById, getSpeakingPart1, getSpeakingPart2, getSpeakingPart3, getSpeakingPart4, getSpeakingPart5 } from "../../../../services/speaking.service";
import type { SpeakingResponse } from "../../../../types/speaking/response";
import { createSpeakingSchema, type CreateSpeakingFormData } from "../../../../libs/validation/speaking.schema";
import Part1Editor from "./part1.editor";
import Part2Editor from "./part2.editor";
import Part3Editor from "./part3.editor";
import Part4Editor from "./part4.editor";
import Part5Editor from "./part5.editor";

type TabType = "general" | "part1" | "part2" | "part3" | "part4" | "part5";

const SpeakingExamEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [loading, setLoading] = useState(false);
  const [examId, setExamId] = useState<number | null>(isEditing ? Number(id) : null);
  const [, setExamData] = useState<SpeakingResponse | null>(null);
  const [part1Data, setPart1Data] = useState<any>(null);
  const [part2Data, setPart2Data] = useState<any>(null);
  const [part3Data, setPart3Data] = useState<any>(null);
  const [part4Data, setPart4Data] = useState<any>(null);
  const [part5Data, setPart5Data] = useState<any>(null);
  const [savedParts, setSavedParts] = useState<Record<string, boolean>>({
    part1: false,
    part2: false,
    part3: false,
    part4: false,
    part5: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateSpeakingFormData>({
    resolver: zodResolver(createSpeakingSchema) as any,
    defaultValues: {
      isActive: false,
    },
  });

  useEffect(() => {
    if (isEditing && examId) {
      loadExamData();
    }
  }, [isEditing, examId]);

  const loadExamData = async () => {
    try {
      const [examResponse, part1Response, part2Response, part3Response, part4Response, part5Response] = await Promise.all([
        getSpeakingById(examId!),
        getSpeakingPart1(examId!),
        getSpeakingPart2(examId!),
        getSpeakingPart3(examId!),
        getSpeakingPart4(examId!),
        getSpeakingPart5(examId!),
      ]);

      if (examResponse.success && examResponse.data) {
        setExamData(examResponse.data);
        setValue("name", examResponse.data.name);
        setValue("isActive", examResponse.data.isActive);
      }

      if (part1Response.success && part1Response.data && part1Response.data.length > 0) {
        setPart1Data(part1Response.data[0]);
        setSavedParts((prev) => ({ ...prev, part1: true }));
      }

      if (part2Response.success && part2Response.data && part2Response.data.length > 0) {
        setPart2Data(part2Response.data[0]);
        setSavedParts((prev) => ({ ...prev, part2: true }));
      }

      if (part3Response.success && part3Response.data && part3Response.data.length > 0) {
        setPart3Data(part3Response.data[0]);
        setSavedParts((prev) => ({ ...prev, part3: true }));
      }

      if (part4Response.success && part4Response.data && part4Response.data.length > 0) {
        setPart4Data(part4Response.data[0]);
        setSavedParts((prev) => ({ ...prev, part4: true }));
      }

      if (part5Response.success && part5Response.data && part5Response.data.length > 0) {
        setPart5Data(part5Response.data[0]);
        setSavedParts((prev) => ({ ...prev, part5: true }));
      }
    } catch (error) {
      console.error("Error loading exam data:", error);
      alert("Lỗi khi tải dữ liệu đề thi");
    }
  };

  const handleGeneralSubmit = async (data: any) => {
    try {
      setLoading(true);

      if (isEditing && examId) {
        const response = await updateSpeaking({ ...data, id: examId });
        if (response.success && response.data) {
          setExamData(response.data);
          alert("Cập nhật đề thi thành công!");
        }
      } else {
        const response = await createSpeaking(data);
        if (response.success && response.data) {
          setExamId(response.data.id);
          setExamData(response.data);
          alert("Tạo đề thi thành công!");
          setActiveTab("part1");
        }
      }
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      console.error("Error saving exam:", error);
      alert(apiError?.message || "Lỗi khi lưu đề thi!");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (!examId && tab !== "general") {
      alert("Vui lòng lưu thông tin chung trước!");
      return;
    }
    setActiveTab(tab);
  };

  const handlePartSave = (part: "part1" | "part2" | "part3" | "part4" | "part5") => {
    setSavedParts((prev) => ({ ...prev, [part]: true }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-xl border border-gray-200">
        <CardHeader
          floated={false}
          shadow={false}
          className="rounded-none bg-gradient-to-r from-purple-600 to-purple-400 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="text"
                className="text-white hover:bg-white/10"
                onClick={() => navigate("/admin/content/sw")}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <Typography variant="h4" color="white" className="font-bold">
                  {isEditing ? "Chỉnh Sửa Đề Thi Speaking" : "Tạo Đề Thi Speaking Mới"}
                </Typography>
                <Typography variant="small" color="white" className="mt-1 opacity-90">
                  {isEditing ? "Cập nhật thông tin đề thi" : "Điền đầy đủ thông tin để tạo đề thi"}
                </Typography>
              </div>
            </div>
            {examId && (
              <div className="text-white">
                <Typography variant="small" className="opacity-90">
                  ID: {examId}
                </Typography>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody className="p-6">
          {/* Progress Indicator */}
          {examId && (
            <div className="mb-6 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                {savedParts.part1 && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                <Typography variant="small" className={savedParts.part1 ? "text-green-600" : "text-gray-500"}>
                  Câu 1-2
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                {savedParts.part2 && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                <Typography variant="small" className={savedParts.part2 ? "text-green-600" : "text-gray-500"}>
                  Câu 3-4
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                {savedParts.part3 && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                <Typography variant="small" className={savedParts.part3 ? "text-green-600" : "text-gray-500"}>
                  Câu 5-7
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                {savedParts.part4 && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                <Typography variant="small" className={savedParts.part4 ? "text-green-600" : "text-gray-500"}>
                  Câu 8-10
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                {savedParts.part5 && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                <Typography variant="small" className={savedParts.part5 ? "text-green-600" : "text-gray-500"}>
                  Câu 11
                </Typography>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} orientation="horizontal">
            <TabsHeader className="bg-transparent border-b border-gray-200">
              <Tab
                value="general"
                onClick={() => handleTabChange("general")}
                className={activeTab === "general" ? "text-purple-600 border-purple-600" : ""}
              >
                1. Thông tin chung
              </Tab>
              <Tab
                value="part1"
                onClick={() => handleTabChange("part1")}
                disabled={!examId}
                className={activeTab === "part1" ? "text-purple-600 border-purple-600" : ""}
              >
                2. Câu 1-2
              </Tab>
              <Tab
                value="part2"
                onClick={() => handleTabChange("part2")}
                disabled={!examId}
                className={activeTab === "part2" ? "text-purple-600 border-purple-600" : ""}
              >
                3. Câu 3-4
              </Tab>
              <Tab
                value="part3"
                onClick={() => handleTabChange("part3")}
                disabled={!examId}
                className={activeTab === "part3" ? "text-purple-600 border-purple-600" : ""}
              >
                4. Câu 5-7
              </Tab>
              <Tab
                value="part4"
                onClick={() => handleTabChange("part4")}
                disabled={!examId}
                className={activeTab === "part4" ? "text-purple-600 border-purple-600" : ""}
              >
                5. Câu 8-10
              </Tab>
              <Tab
                value="part5"
                onClick={() => handleTabChange("part5")}
                disabled={!examId}
                className={activeTab === "part5" ? "text-purple-600 border-purple-600" : ""}
              >
                6. Câu 11
              </Tab>
            </TabsHeader>

            <TabsBody className="py-6">
              {/* General Info Tab */}
              <TabPanel value="general">
                <Card className="shadow-lg">
                  <CardBody>
                    <form onSubmit={handleSubmit(handleGeneralSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <Input
                            label="Tên đề thi"
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

                   {isEditing && (
                           <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            id="isActive"
                            {...register("isActive", { valueAsNumber: false })}
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                          />
                          <label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                            Kích hoạt đề thi
                          </label>
                        </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-4 pt-4">
                        <Button
                          variant="outlined"
                          onClick={() => navigate("/admin/content/sw")}
                          disabled={loading}
                        >
                          Hủy
                        </Button>
                        <Button type="submit" className="bg-purple-600" disabled={loading}>
                          {loading ? (
                            <>
                              <Spinner className="h-4 w-4" />
                              Đang lưu...
                            </>
                          ) : isEditing ? (
                            "Cập Nhật"
                          ) : (
                            "Tạo Đề Thi"
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Part 1 Tab */}
              <TabPanel value="part1">
                {examId && (
                  <Part1Editor
                    examId={examId}
                    index={0}
                    initialData={part1Data}
                    onSave={() => handlePartSave("part1")}
                  />
                )}
              </TabPanel>

              {/* Part 2 Tab */}
              <TabPanel value="part2">
                {examId && (
                  <Part2Editor
                    examId={examId}
                    index={2}
                    initialData={part2Data}
                    onSave={() => handlePartSave("part2")}
                  />
                )}
              </TabPanel>

              {/* Part 3 Tab */}
              <TabPanel value="part3">
                {examId && (
                  <Part3Editor
                    examId={examId}
                    index={0}
                    initialData={part3Data}
                    onSave={() => handlePartSave("part3")}
                  />
                )}
              </TabPanel>

              {/* Part 4 Tab */}
              <TabPanel value="part4">
                {examId && (
                  <Part4Editor
                    examId={examId}
                    index={4}
                    initialData={part4Data}
                    onSave={() => handlePartSave("part4")}
                  />
                )}
              </TabPanel>

              {/* Part 5 Tab */}
              <TabPanel value="part5">
                {examId && (
                  <Part5Editor
                    examId={examId}
                    index={0}
                    initialData={part5Data}
                    onSave={() => handlePartSave("part5")}
                  />
                )}
              </TabPanel>
            </TabsBody>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
};

export default SpeakingExamEditor;