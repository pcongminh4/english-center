import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Spinner,
} from "@material-tailwind/react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { getAllSpeakingExams, deleteSpeaking, toggleActiveSpeaking } from "../../../../services/speaking.service";
import type { SpeakingResponse } from "../../../../types/speaking/response";
import type { GetSpeakingRequest } from "../../../../types/speaking/request";
import SpeakingPagination from "./speaking.pagination";
import { BoltIcon } from "lucide-react";

const SpeakingExamList: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<SpeakingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    examId: number | null;
    examName: string;
  }>({ open: false, examId: null, examName: "" });
  const [toggleDialog, setToggleDialog] = useState<{
    open: boolean;
    examId: number | null;
    examName: string;
    isActive: boolean;
  }>({ open: false, examId: null, examName: "", isActive: false });

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      const params: GetSpeakingRequest = {
        page: currentPage,
        limit: 10,
      };
      const response = await getAllSpeakingExams(params);
      if (response.success && response.data?.data) {
        setExams(response.data.data);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);
      }
    } catch (error) {
      console.error("Error loading exams:", error);
      alert("Lỗi khi tải danh sách đề thi");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleDelete = async () => {
    if (!deleteDialog.examId) return;

    try {
      const response = await deleteSpeaking(deleteDialog.examId);
      if (response.success) {
        alert("Xóa đề thi thành công!");
        setDeleteDialog({ open: false, examId: null, examName: "" });
        loadExams();
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Lỗi khi xóa đề thi");
    }
  };

  const handleToggleActive = async () => {
    if (!toggleDialog.examId) return;

    try {
      const response = await toggleActiveSpeaking(toggleDialog.examId);
      if (response.success) {
        alert(
          toggleDialog.isActive
            ? "Vô hiệu hóa đề thi thành công!"
            : "Kích hoạt đề thi thành công!"
        );
        setToggleDialog({ open: false, examId: null, examName: "", isActive: false });
        loadExams();
      }
    } catch (error) {
      console.error("Error toggling exam status:", error);
        alert(
        "Lỗi khi thay đổi trạng thái đề thi: " +
          (error as { message?: string }).message,
      );
      setToggleDialog({
        open: false,
        examId: null,
        examName: "",
        isActive: false,
      });
    }
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
            <div>
              <Typography variant="h4" color="white" className="font-bold">
                Đề Thi Speaking
              </Typography>
              <Typography variant="small" color="white" className="mt-1 opacity-90">
                Tổng số: {totalItems} đề thi
              </Typography>
            </div>
            <Button
              onClick={() => navigate("/admin/content/sw/speaking/new")}
              className="bg-white text-purple-600 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Tạo Đề Thi Mới
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="h-12 w-12" />
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12">
              <Typography variant="h6" color="gray" className="mb-2">
                Chưa có đề thi nào
              </Typography>
              <Typography variant="small" color="gray">
                Nhấn nút "Tạo Đề Thi Mới" để bắt đầu
              </Typography>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Tên đề thi
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Số câu hỏi
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Trạng thái
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Ngày tạo
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600">{exam.id}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {exam.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{exam.totalQuestion}</td>
                      <td className="py-3 px-4">
                        <Chip
                          value={exam.isActive ? "Đang kích hoạt" : "Vô hiệu"}
                          color={exam.isActive ? "green" : "gray"}
                          variant="outlined"
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {new Date(exam.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <IconButton
                            variant="text"
                            size="sm"
                            onClick={() => navigate(`/admin/content/sw/speaking/${exam.id}`)}
                            title="Chỉnh sửa"
                          >
                            <PencilIcon className="h-4 w-4 text-purple-600" />
                          </IconButton>
                          <IconButton
                            variant="text"
                            size="sm"
                            onClick={() =>
                              setToggleDialog({
                                open: true,
                                examId: exam.id,
                                examName: exam.name,
                                isActive: exam.isActive,
                              })
                            }
                            title={exam.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            {exam.isActive ? (
                              <BoltIcon className="h-4 w-4 text-orange-600" />
                            ) : (
                              <BoltIcon className="h-4 w-4 text-green-600" />
                            )}
                          </IconButton>
                          <IconButton
                            variant="text"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                examId: exam.id,
                                examName: exam.name,
                              })
                            }
                            title="Xóa"
                          >
                            <TrashIcon className="h-4 w-4 text-red-600" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <SpeakingPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardBody>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} handler={() => setDeleteDialog({ ...deleteDialog, open: false })}>
        <DialogHeader>Xác nhận xóa</DialogHeader>
        <DialogBody>
          Bạn có chắc chắn muốn xóa đề thi "{deleteDialog.examName}"? Hành động này không thể hoàn tác.
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button
            variant="outlined"
            onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
          >
            Hủy
          </Button>
          <Button color="red" onClick={handleDelete}>
            Xóa
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Toggle Active Confirmation Dialog */}
      <Dialog
        open={toggleDialog.open}
        handler={() => setToggleDialog({ ...toggleDialog, open: false })}
      >
        <DialogHeader>
          {toggleDialog.isActive ? "Vô hiệu hóa đề thi" : "Kích hoạt đề thi"}
        </DialogHeader>
        <DialogBody>
          Bạn có chắc chắn muốn{" "}
          {toggleDialog.isActive ? "vô hiệu hóa" : "kích hoạt"} đề thi "
          {toggleDialog.examName}"?
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button
            variant="outlined"
            onClick={() => setToggleDialog({ ...toggleDialog, open: false })}
          >
            Hủy
          </Button>
          <Button color="blue" onClick={handleToggleActive}>
            {toggleDialog.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default SpeakingExamList;