import { useEffect, useRef, useState, useCallback } from "react";
import { Typography } from "@material-tailwind/react";
import type { ListeningGroup } from "../../../../types/entrance-exam/candidate.types";
import AutoCountdown from "./auto-countdown";

interface GroupPlayerProps {
  group: ListeningGroup;
  answers: Record<string, number>;
  onAnswer: (questionIndex: number, answerId: number) => void;
  onFinished: () => void;
  isCurrent: boolean;
}

const LABELS = ["A", "B", "C", "D"] as const;
const COUNTDOWN_SECONDS = 5;

const GroupPlayer = ({
  group,
  answers,
  onAnswer,
  onFinished,
  isCurrent,
}: GroupPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioEnded, setAudioEnded] = useState(false);

  // Auto-play audio when this slide becomes current
  useEffect(() => {
    if (!isCurrent) return;
    setAudioEnded(false);

    if (group.audio && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        setAudioEnded(true);
      });
    } else {
      setAudioEnded(true);
    }
  }, [isCurrent, group.audio]);

  const handleAudioEnd = useCallback(() => {
    setAudioEnded(true);
  }, []);

  if (!isCurrent) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
      {/* Group header */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
          Nhóm {group.index}
        </span>
        <Typography variant="small" className="text-gray-500">
          Câu {group.fromQuestionIndex} – {group.toQuestionIndex}
        </Typography>
      </div>

      {/* Image */}
      {group.image && (
        <div className="rounded-lg overflow-hidden border bg-gray-50">
          <img
            src={group.image}
            alt={`Group ${group.index}`}
            className="w-full max-h-72 object-contain"
          />
        </div>
      )}

      {/* Hidden audio — auto-plays, no controls */}
      {group.audio && (
        <div className="flex items-center gap-3">
          <audio
            ref={audioRef}
            onEnded={handleAudioEnd}
            preload="auto"
          >
            <source src={group.audio} />
          </audio>
          {!audioEnded && (
            <div className="flex items-center gap-2 text-purple-600 animate-pulse">
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

      {/* Questions in group */}
      <div className="space-y-4 pl-2 border-l-2 border-purple-200">
        {group.questions.map((q) => {
          const selectedAnswer = answers[`L-${q.index}`] ?? null;

          return (
            <div key={q.index} className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {q.index}
                </span>
                {q.question && (
                  <Typography className="text-gray-800 font-medium pt-0.5">
                    {q.question}
                  </Typography>
                )}
              </div>

              <div className="grid gap-1.5 ml-9">
                {LABELS.map((label, idx) => {
                  const answerId = idx + 1;
                  const answerText = q[`answer${label}` as keyof typeof q] as string | undefined;
                  const isSelected = selectedAnswer === answerId;

                  return (
                    <label
                      key={label}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.index}`}
                        value={answerId}
                        checked={isSelected}
                        onChange={() => onAnswer(q.index, answerId)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="font-bold text-blue-700 w-5">{label}</span>
                      <span className={`${answerText ? 'text-gray-800' : 'text-gray-500 font-medium'}`}>
                        {answerText || `(đáp án ${label})`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupPlayer;
