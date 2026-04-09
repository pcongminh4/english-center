import { useEffect, useRef, useState, useCallback } from "react";
import { Typography } from "@material-tailwind/react";
import type { ListeningQuestion } from "../../../../types/entrance-exam/candidate.types";
import AutoCountdown from "./auto-countdown";

interface SingleQuestionPlayerProps {
  question: ListeningQuestion;
  selectedAnswer: number | null;
  onAnswer: (questionIndex: number, answerId: number) => void;
  onFinished: () => void;
  isCurrent: boolean;
  /** Number of answer choices to display. Defaults to 4 (A-D). Part 2 uses 3 (A-C). */
  answerCount?: number;
}

const ALL_LABELS = ["A", "B", "C", "D"] as const;
const COUNTDOWN_SECONDS = 3;

const SingleQuestionPlayer = ({
  question,
  selectedAnswer,
  onAnswer,
  onFinished,
  isCurrent,
  answerCount = 4,
}: SingleQuestionPlayerProps) => {
  const LABELS = ALL_LABELS.slice(0, answerCount) as readonly ("A" | "B" | "C" | "D")[];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioEnded, setAudioEnded] = useState(false);

  // Auto-play audio when this slide becomes current
  useEffect(() => {
    if (!isCurrent) return;
    setAudioEnded(false);

    if (question.audio && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser blocked autoplay — mark as ended so user can still answer
        setAudioEnded(true);
      });
    } else {
      // No audio — start countdown immediately
      setAudioEnded(true);
    }
  }, [isCurrent, question.audio]);

  const handleAudioEnd = useCallback(() => {
    setAudioEnded(true);
  }, []);

  if (!isCurrent) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
      {/* Question number and text */}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
          {question.index}
        </span>
        {question.question && (
          <Typography className="text-gray-800 font-medium pt-1">
            {question.question}
          </Typography>
        )}
      </div>

      {/* Image */}
      {question.image && (
        <div className="rounded-lg overflow-hidden border bg-gray-50">
          <img
            src={question.image}
            alt={`Question ${question.index}`}
            className="w-full max-h-64 object-contain"
          />
        </div>
      )}

      {/* Hidden audio — auto-plays, no controls */}
      {question.audio && (
        <div className="flex items-center gap-3">
          <audio
            ref={audioRef}
            onEnded={handleAudioEnd}
            preload="auto"
          >
            <source src={question.audio} />
          </audio>
          {!audioEnded && (
            <div className="flex items-center gap-2 text-blue-600 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Đang phát audio...</span>
            </div>
          )}
        </div>
      )}

      {/* Countdown after audio ends */}
      {audioEnded && (
        <div className="flex justify-center">
          <AutoCountdown seconds={COUNTDOWN_SECONDS} onExpire={onFinished} />
        </div>
      )}

      {/* Answer choices - always show A B C D labels */}
      <div className="grid gap-2">
        {LABELS.map((label, idx) => {
          const answerId = idx + 1;
          const answerText = question[`answer${label}` as keyof ListeningQuestion] as string | undefined;
          const isSelected = selectedAnswer === answerId;

          return (
            <label
              key={label}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.index}`}
                value={answerId}
                checked={isSelected}
                onChange={() => onAnswer(question.index, answerId)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <span className="font-bold text-lg text-blue-700 w-6">{label}</span>
              <span className={`${answerText ? 'text-gray-800' : 'text-gray-500 font-medium'}`}>
                {answerText || `(đáp án ${label})`}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default SingleQuestionPlayer;
