import React, { useState } from "react";
import { Save, Image as ImageIcon } from "lucide-react";
import { AudioRecorder } from "./AudioRecorder";
import type { SpeakingQuestion as SpeakingQuestionType } from "../../../types/entrance-exam/speaking.types";

interface SpeakingQuestionProps {
  question: SpeakingQuestionType;
  onSave: (audioBlob: Blob) => Promise<void>;
  saved: boolean;
  showPassage?: boolean;
  showImages?: boolean;
}

export const SpeakingQuestion: React.FC<SpeakingQuestionProps> = ({
  question,
  onSave,
  saved,
  showPassage = true,
  showImages = true,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(question.audioRecord || undefined);

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } else {
      setAudioUrl(undefined);
    }
  };

  const handleSave = async () => {
    if (!audioBlob || audioBlob.size === 0) {
      alert("Vui lòng ghi âm câu trả lời");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(audioBlob);
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Part Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
            Part {getPartNumber(question.partType)}
          </div>
          <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
            Câu {question.questionIndex}
          </div>
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

      {/* Images (Part 3-4, 8-10) */}
      {showImages && question.images && question.images.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <ImageIcon className="w-5 h-5" />
            <span className="font-medium">Hình ảnh:</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {question.images.map((img: string, idx: number) => (
              <div key={idx} className="relative">
                <img
                  src={img}
                  alt={`Hình ${idx + 1}`}
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Passage (Part 5-7, 8-10) */}
      {/* {showPassage && question.passage && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Đoạn văn:</span>
          </div>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {question.passage}
            </p>
          </div>
        </div>
      )} */}

      {/* Audio Recorder */}
      <div className="mt-6">
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          existingAudioUrl={audioUrl}
        />
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || saved || !audioBlob || audioBlob.size === 0}
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
              Lưu câu trả lời
            </>
          )}
        </button>
      </div>
    </div>
  );
};