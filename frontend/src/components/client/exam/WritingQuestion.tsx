import React, { useState, useEffect } from "react";
import { Save, Image as ImageIcon, Clock } from "lucide-react";
import type { WritingQuestion as WritingQuestionType } from "../../../types/entrance-exam/writing.types";

interface WritingQuestionProps {
  question: WritingQuestionType;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onSave: () => Promise<void>;
  saved: boolean;
}

export const WritingQuestion: React.FC<WritingQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
  onSave,
  saved,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [characterCount, setCharacterCount] = useState(answer.length);

  useEffect(() => {
    setCharacterCount(answer.length);
  }, [answer]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error("Error saving answer:", error);
      alert("Lỗi khi lưu câu trả lời");
    } finally {
      setIsSaving(false);
    }
  };

  const getPartNumber = (partType: string) => {
    const match = partType.match(/\d+/);
    return match ? match[0] : "";
  };

  const getImages = (question: WritingQuestionType) => {
    // Return all images provided by backend (usually 1 image per question)
    if (question.images && question.images.length > 0) {
      return question.images;
    }
    return [];
  };

  const images = getImages(question);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-gray-200">
      {/* Part Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">
            Part {getPartNumber(question.partType)}
          </div>
          <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
            Câu {question.questionIndex}
          </div>
          {question.suggestedTime && (
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{question.suggestedTime} phút</span>
            </div>
          )}
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <Save className="w-5 h-5" />
            <span className="font-semibold">Đã lưu</span>
          </div>
        )}
      </div>

      {/* Question Content */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {question.question}
        </h3>
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <ImageIcon className="w-5 h-5" />
            <span className="font-medium">Hình ảnh:</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {images.map((img: string, idx: number) => (
              <div key={idx} className="relative">
                <img
                  src={img}
                  alt={`Hình ${idx + 1}`}
                  className="w-full min-h-64 max-h-[600px] object-contain rounded-lg border-2 border-gray-200 bg-gray-50"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Area */}
      <div className="mb-4">
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Nhập câu trả lời của bạn..."
          className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors resize-none"
          maxLength={5000}
        />
       
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{characterCount}/5000 ký tự</span>
          {characterCount > 4500 && (
            <span className="text-orange-600">Sắp đạt giới hạn ký tự</span>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || !answer.trim()}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {saved ? "Cập nhật câu trả lời" : "Lưu câu trả lời"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};