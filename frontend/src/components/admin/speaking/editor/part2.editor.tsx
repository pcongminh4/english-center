import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardBody,
  Button,
  Typography,
  Spinner,
} from "@material-tailwind/react";
import { upsertSpeakingPart2 } from "../../../../services/speaking.service";
import type { SpeakingThreeFour } from "../../../../types/speaking/response";
import ImageUploadField from "../../../common/ImageUploadField";

interface Part2EditorProps {
  examId: number;
  index: number;
  initialData?: SpeakingThreeFour;
  onSave?: () => void;
}

const Part2Editor: React.FC<Part2EditorProps> = ({
  examId,
  index,
  initialData,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageThreeFile, setImageThreeFile] = useState<File | null>(null);
  const [imageFourFile, setImageFourFile] = useState<File | null>(null);

  const { handleSubmit } = useForm();

  const onSubmit = async () => {
    if (!imageThreeFile && !initialData?.imageThree) {
      alert("Vui lòng chọn ảnh cho câu 3");
      return;
    }
    if (!imageFourFile && !initialData?.imageFour) {
      alert("Vui lòng chọn ảnh cho câu 4");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("speakingExamId", examId.toString());
      formData.append("index", index.toString());
      if (imageThreeFile) {
        formData.append("imageThree", imageThreeFile);
      }
      if (imageFourFile) {
        formData.append("imageFour", imageFourFile);
      }

      const response = await upsertSpeakingPart2(examId, formData);

      if (response.success) {
        alert("Lưu Câu 3-4 thành công!");
        setSaved(true);
        setImageThreeFile(null);
        setImageFourFile(null);
        onSave?.();
      }
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      console.error("Lỗi khi lưu Câu 3-4:", error);
      alert(apiError?.message || "Lưu Câu 3-4 thất bại!");
      setSaved(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardBody>
        <div className="mb-6">
          <Typography variant="h5" color="blue-gray" className="font-bold mb-2">
            Câu 3-4: Describe a Picture
          </Typography>
          <Typography variant="small" color="gray">
            Mô tả hình ảnh có sẵn
          </Typography>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ImageUploadField
                label="Ảnh Câu 3 *"
                fieldName="imageThree"
                maxFiles={1}
                maxFileSize={5}
                accept="image/*"
                initialImages={initialData?.imageThree ? [initialData.imageThree] : []}
                onFilesChange={(_fieldName, files) => {
                  if (files.length > 0) {
                    setImageThreeFile(files[0]);
                  }
                }}
              />
            </div>

            <div>
              <ImageUploadField
                label="Ảnh Câu 4 *"
                fieldName="imageFour"
                maxFiles={1}
                maxFileSize={5}
                accept="image/*"
                initialImages={initialData?.imageFour ? [initialData.imageFour] : []}
                onFilesChange={(_fieldName, files) => {
                  if (files.length > 0) {
                    setImageFourFile(files[0]);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Đang lưu...
                </>
              ) : (
                "Lưu Phần Này"
              )}
            </Button>
          </div>
        </form>

        {saved && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Typography variant="small" color="green" className="font-semibold">
              ✓ Đã lưu thành công
            </Typography>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default Part2Editor;