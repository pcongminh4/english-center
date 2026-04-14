import prisma from "../config/database";
import { AdmissionStatus } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import crypto from "crypto";
import {
  buildEntranceExamLRImageUrl,
  buildSpeakingImageUrl,
  buildSpeakingAudioUrl,
} from "../utils/fileUrl";
import {
  gradeSpeakingAnswer,
  calculateSpeakingScaledScore,
  gradeWritingAnswer,
  calculateWritingScaledScore,
} from "./aiGrading.service";
import { sendEmail } from "../utils/email.service";

/**
 * Escape special characters for safe HTML embedding
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Grade both Speaking and Writing sections together
 * Called when Writing is submitted
 */
export const gradeSpeakingAndWritingService = async (admission: any) => {
  if (admission.status !== AdmissionStatus.WRITING) {
    throw new AppError("Cannot grade in current state", 400);
  }

  // Get exam details
  const entranceExam = await prisma.entranceExam.findUnique({
    where: { id: admission.entranceExamId! },
    include: {
      speaking: true,
      writing: true,
    },
  });

  if (!entranceExam) {
    throw new AppError("Exam not found", 404);
  }

  // ============ GRADE SPEAKING ============
  console.log("Starting Speaking grading...");

  if (!entranceExam.speaking) {
    throw new AppError("Speaking exam not found", 404);
  }

  const speakingExam = await prisma.entranceExamSpeaking.findUnique({
    where: { id: entranceExam.speaking.id },
    include: {
      speakingOneTwos: {
        orderBy: { index: "asc" },
      },
      speakingThreeFours: {
        orderBy: { index: "asc" },
      },
      speakingFiveToSevens: {
        orderBy: { index: "asc" },
      },
      speakingEightToTens: {
        orderBy: { index: "asc" },
      },
      speakingElevens: {
        orderBy: { index: "asc" },
      },
    },
  });

  if (!speakingExam) {
    throw new AppError("Speaking exam not found", 404);
  }

  // Get user Speaking answers
  const speakingAnswers = await prisma.admissionsSpeaking.findMany({
    where: { admissionId: admission.id },
  });

  // Create audio path map
  const speakingAudioMap: Record<string, string> = {};
  speakingAnswers.forEach((a) => {
    speakingAudioMap[a.questionId.toString()] = a.audioRecord
      ? "/uploads/speaking-audio/" + a.audioRecord
      : "";
  });

  // Prepare Speaking questions for AI grading
  const speakingQuestionsToGrade: Array<{
    questionIndex: number;
    question: string;
    partType: string;
    audioPath: string;
    passage?: string;
  }> = [];

  let globalQuestionIndex = 1;

  // Part 1 (2 questions)
  speakingExam.speakingOneTwos.forEach((p) => {
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.questionOne,
      partType: "Part 1",
      audioPath: speakingAudioMap[`1`] || "",
    });
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.questionTwo,
      partType: "Part 1",
      audioPath: speakingAudioMap[`2`] || "",
    });
  });

  // Part 3 (2 questions)
  speakingExam.speakingThreeFours.forEach((p) => {
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: buildSpeakingImageUrl(p.imageThree)?.toString() || "",
      partType: "Part 2",
      audioPath: speakingAudioMap[`3`] || "",
    });
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: buildSpeakingImageUrl(p.imageFour)?.toString() || "",
      partType: "Part 2",
      audioPath: speakingAudioMap[`4`] || "",
    });
  });

  // Part 3 (3 questions) - include passage
  speakingExam.speakingFiveToSevens.forEach((p) => {
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.questionFive,
      partType: "Part 3",
      passage: p.passage,
      audioPath: speakingAudioMap[`5`] || "",
    });
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.questionSix,
      partType: "Part 3",
      passage: p.passage,
      audioPath: speakingAudioMap[`6`] || "",
    });
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.questionSeven,
      partType: "Part 3",
      passage: p.passage,
      audioPath: speakingAudioMap[`7`] || "",
    });
  });

  // Part 4 (3 questions) - include passage
  speakingExam.speakingEightToTens.forEach((p) => {
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.questionEight,
      partType: "Part 4",
      passage: p.passage,
      audioPath: speakingAudioMap[`8`] || "",
    });
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.questionNine,
      partType: "Part 4",
      passage: p.passage,
      audioPath: speakingAudioMap[`9`] || "",
    });
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.questionTen,
      partType: "Part 4",
      passage: p.passage,
      audioPath: speakingAudioMap[`10`] || "",
    });
  });

  // Part 5 (1 question)
  speakingExam.speakingElevens.forEach((p) => {
    speakingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.question,
      partType: "Part 5",
      audioPath: speakingAudioMap[`11`] || "",
    });
  });

  // Grade Speaking questions in parallel
  console.log(
    `Starting parallel Speaking grading for ${speakingQuestionsToGrade.length} questions...`,
  );
  const speakingGradingPromises = speakingQuestionsToGrade.map(async (q) => {
    const result = await gradeSpeakingAnswer(
      q.question,
      q.partType,
      q.audioPath,
      q.passage,
    );
    return {
      questionIndex: q.questionIndex,
      score: result.totalScore,
      scores: {
        pronunciation: result.pronunciation.score,
        grammar: result.grammar.score,
        vocabulary: result.vocabulary.score,
        fluency: result.fluency.score,
        taskAchievement: result.taskAchievement.score,
      },
      feedback: {
        pronunciation: result.pronunciation.feedback,
        grammar: result.grammar.feedback,
        vocabulary: result.vocabulary.feedback,
        fluency: result.fluency.feedback,
        taskAchievement: result.taskAchievement.feedback,
      },
      partType: q.partType,
    };
  });

  const speakingGradingResults = await Promise.all(speakingGradingPromises);
  console.log(
    `Completed Speaking grading for ${speakingGradingResults.length} questions`,
  );

  // Calculate Speaking total raw score
  let speakingTotalRawScore = 0;
  speakingGradingResults.forEach((result) => {
    speakingTotalRawScore += result.score;
  });

  // Calculate Speaking scaled score (10-200)
  const speakingScaledScore = calculateSpeakingScaledScore(
    speakingTotalRawScore,
    speakingQuestionsToGrade.length,
  );

  // ============ GRADE WRITING ============
  console.log("Starting Writing grading...");

  if (!entranceExam.writing) {
    throw new AppError("Writing exam not found", 404);
  }

  const writingExam = await prisma.entranceExamWriting.findUnique({
    where: { id: entranceExam.writing.id },
    include: {
      writingOneToFives: {
        orderBy: { index: "asc" },
      },
      writingSixSevens: {
        orderBy: { index: "asc" },
      },
      writingEights: {
        orderBy: { index: "asc" },
      },
    },
  });

  if (!writingExam) {
    throw new AppError("Writing exam not found", 404);
  }

  // Get user Writing answers
  const writingAnswers = await prisma.admissionsWriting.findMany({
    where: { admissionId: admission.id },
  });

  // Create answer map
  const writingAnswerMap: Record<string, string> = {};
  writingAnswers.forEach((a) => {
    writingAnswerMap[a.questionId.toString()] = a.answer || "";
  });

  // Prepare Writing questions for AI grading
  const writingQuestionsToGrade: Array<{
    questionIndex: number;
    question: string;
    partType: string;
    answer: string;
    images?: string;
  }> = [];

  globalQuestionIndex = 1;

  // Part 1 (5 questions) - based on pictures
  writingExam.writingOneToFives.forEach((p) => {
    const images: string[] = [];
    if (p.imageOne) images.push(buildEntranceExamLRImageUrl(p.imageOne) || "");
    if (p.imageTwo) images.push(buildEntranceExamLRImageUrl(p.imageTwo) || "");
    if (p.imageThree)
      images.push(buildEntranceExamLRImageUrl(p.imageThree) || "");
    if (p.imageFour)
      images.push(buildEntranceExamLRImageUrl(p.imageFour) || "");
    if (p.imageFive)
      images.push(buildEntranceExamLRImageUrl(p.imageFive) || "");
    // Generate questions dynamically (schema doesn't have question fields)
    const imagesStr = images.length > 0 ? images.join(",") : "";
    writingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: "Write a sentence based on picture 1",
      partType: "Part 1",
      answer: writingAnswerMap[`1`] || "",
      images: imagesStr,
    });
    writingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: "Write a sentence based on picture 2",
      partType: "Part 1",
      answer: writingAnswerMap[`2`] || "",
      images: imagesStr,
    });
    writingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: "Write a sentence based on picture 3",
      partType: "Part 1",
      answer: writingAnswerMap[`3`] || "",
      images: imagesStr,
    });
    writingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: "Write a sentence based on picture 4",
      partType: "Part 1",
      answer: writingAnswerMap[`4`] || "",
      images: imagesStr,
    });
    writingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: "Write a sentence based on picture 5",
      partType: "Part 1",
      answer: writingAnswerMap[`5`] || "",
      images: imagesStr,
    });
  });

  // Part 2 (2 questions) - written requests
  writingExam.writingSixSevens.forEach((p) => {
    const imageSixStr = p.imageSix
      ? buildEntranceExamLRImageUrl(p.imageSix) || undefined
      : undefined;
    const imageSevenStr = p.imageSeven
      ? buildEntranceExamLRImageUrl(p.imageSeven) || undefined
      : undefined;

    // Generate questions dynamically (schema doesn't have question fields)
    writingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: "Respond to a written request 1",
      partType: "Part 2",
      answer: writingAnswerMap[`6`] || "",
      images: imageSixStr,
    });
    writingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: "Respond to a written request 2",
      partType: "Part 2",
      answer: writingAnswerMap[`7`] || "",
      images: imageSevenStr,
    });
  });

  // Part 3 (1 question) - opinion essay
  writingExam.writingEights.forEach((p) => {
    writingQuestionsToGrade.push({
      questionIndex: globalQuestionIndex++,
      question: p.questionEight,
      partType: "Part 3",
      answer: writingAnswerMap[`8`] || "",
    });
  });

  // Grade Writing questions in parallel
  console.log(
    `Starting parallel Writing grading for ${writingQuestionsToGrade.length} questions...`,
  );
  const writingGradingPromises = writingQuestionsToGrade.map(async (q) => {
    const result = await gradeWritingAnswer(
      q.question,
      q.partType,
      q.answer,
      q.images,
    );
    return {
      questionIndex: q.questionIndex,
      score: result.totalScore,
      scores: {
        grammar: result.grammar.score,
        vocabulary: result.vocabulary.score,
        organization: result.organization.score,
        taskFulfillment: result.taskFulfillment.score,
        toneAndStyle: result.toneAndStyle.score,
      },
      feedback: {
        grammar: result.grammar.feedback,
        vocabulary: result.vocabulary.feedback,
        organization: result.organization.feedback,
        taskFulfillment: result.taskFulfillment.feedback,
        toneAndStyle: result.toneAndStyle.feedback,
      },
      partType: q.partType,
    };
  });

  const writingGradingResults = await Promise.all(writingGradingPromises);
  console.log(
    `Completed Writing grading for ${writingGradingResults.length} questions`,
  );

  // Calculate Writing total raw score
  let writingTotalRawScore = 0;
  writingGradingResults.forEach((result) => {
    writingTotalRawScore += result.score;
  });

  // Calculate Writing scaled score (10-200)
  const writingScaledScore = calculateWritingScaledScore(
    writingTotalRawScore,
    writingQuestionsToGrade.length,
  );

  // Calculate total scaled score (20-400)
  const totalScaledScore = speakingScaledScore + writingScaledScore;

  // ============ UPDATE ADMISSION ============
  await prisma.admission.update({
    where: { id: admission.id },
    data: {
      status: AdmissionStatus.COMPLETED,
      totalSpeaking: speakingTotalRawScore,
      scoreSpeaking: speakingScaledScore,
      totalWriting: writingTotalRawScore,
      scoreWriting: writingScaledScore,
    },
  });

  // ============ SEND EMAIL WITH RESULTS ============
  // Get candidate info
  const candidate = await prisma.admission.findUnique({
    where: { id: admission.id },
    select: {
      fullname: true,
      email: true,
    },
  });

  if (candidate?.email) {
    // Create registration token for course enrollment link (fire-and-forget, same as LR)
    const tokenValue = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    prisma.registrationToken.create({
      data: {
        token: tokenValue,
        admissionId: admission.id,
        expiresAt: tokenExpiresAt,
      },
    }).then(() => {
      sendResultEmail(
        candidate.email,
        candidate.fullname,
        speakingScaledScore,
        writingScaledScore,
        totalScaledScore,
        speakingGradingResults,
        writingGradingResults,
        tokenValue,
        tokenExpiresAt,
      ).catch((err) => console.error("Failed to send SW result email:", err));
    }).catch((err) => console.error("Failed to create registration token:", err));
  }

  return {
    speaking: {
      totalRawScore: speakingTotalRawScore,
      scaledScore: speakingScaledScore,
      gradingResults: speakingGradingResults,
    },
    writing: {
      totalRawScore: writingTotalRawScore,
      scaledScore: writingScaledScore,
      gradingResults: writingGradingResults,
    },
    totalScaledScore,
  };
};

/**
 * Send result email with detailed feedback
 */
const sendResultEmail = async (
  email: string,
  name: string,
  speakingScore: number,
  writingScore: number,
  totalScore: number,
  speakingResults: any[],
  writingResults: any[],
  registrationToken: string,
  tokenExpiresAt: Date,
) => {
  const speakingLevel = getScoreLevel(speakingScore, 200);
  const writingLevel = getScoreLevel(writingScore, 200);
  const totalLevel = getScoreLevel(totalScore, 400);
  const suggestedCourses = getSuggestedCourses(totalScore);

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const courseUrl = `${clientUrl}/dang-ky-khoa-hoc?token=${registrationToken}`;

  const expiryLabel = tokenExpiresAt
    ? tokenExpiresAt.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Kết quả bài thi đầu vào</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">TOEIC Speaking & Writing</p>
      </div>

      <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="color: #334155; font-size: 16px;">Xin chào <strong>${escapeHtml(name)}</strong>,</p>
        <p style="color: #64748b;">Cảm ơn bạn đã tham gia bài thi đầu vào. Dưới đây là kết quả của bạn:</p>

        ${expiryLabel ? `
        <div style="background: #fff7ed; border: 2px solid #fb923c; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 6px;">
            <tr>
              <td style="font-size: 20px; padding-right: 8px; vertical-align: middle;">&#9200;</td>
              <td style="color: #c2410c; font-weight: bold; font-size: 15px; vertical-align: middle;">Lưu ý quan trọng</td>
            </tr>
          </table>
          <p style="margin: 0; color: #9a3412; font-size: 14px; line-height: 1.6;">
            Link đăng ký khóa học bên dưới <strong>chỉ có hiệu lực trong 24 giờ</strong>.<br/>
            Vui lòng hoàn tất đăng ký trước <strong>${expiryLabel}</strong>.<br/>
            Sau thời gian này, link sẽ hết hạn và bạn cần liên hệ trung tâm để được hỗ trợ.
          </p>
        </div>` : ''}

        <!-- Score Overview -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 12px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px 0 0 0;">
              <div style="color: #1e40af; font-weight: bold; font-size: 14px;">Speaking</div>
              <div style="color: #1e3a8a; font-size: 28px; font-weight: bold;">${speakingScore}</div>
              <div style="color: #64748b; font-size: 12px;">${speakingResults.reduce((s, r) => s + r.score, 0)}/${speakingResults.length * 25} điểm gốc</div>
              <div style="margin-top: 6px;">
                <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; color: white; font-size: 11px; font-weight: bold; background: ${getLevelColor(speakingLevel)};">${speakingLevel}</span>
              </div>
            </td>
            <td style="padding: 12px 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0 8px 0 0;">
              <div style="color: #059669; font-weight: bold; font-size: 14px;">Writing</div>
              <div style="color: #064e3b; font-size: 28px; font-weight: bold;">${writingScore}</div>
              <div style="color: #64748b; font-size: 12px;">${writingResults.reduce((s, r) => s + r.score, 0)}/${writingResults.length * 25} điểm gốc</div>
              <div style="margin-top: 6px;">
                <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; color: white; font-size: 11px; font-weight: bold; background: ${getLevelColor(writingLevel)};">${writingLevel}</span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Total Score -->
        <div style="background: linear-gradient(135deg, #1e40af, #059669); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <div style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: bold;">TỔNG ĐIỂM</div>
          <div style="color: white; font-size: 36px; font-weight: bold;">${totalScore}</div>
          <div style="color: rgba(255,255,255,0.7); font-size: 14px;">/ 400</div>
          <div style="margin-top: 6px;">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; color: white; font-size: 11px; font-weight: bold; background: rgba(255,255,255,0.2);">${totalLevel}</span>
          </div>
        </div>

        <!-- Speaking Detail -->
        <h3 style="color: #1e40af; font-size: 16px; margin: 24px 0 12px;">Chi tiết Speaking (${speakingResults.length} câu)</h3>
        ${speakingResults
          .map(
            (r) => `
          <div style="background: white; padding: 16px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #1e40af; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
            <!-- Question header + total score -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
              <tr>
                <td style="font-weight: bold; color: #1e40af; font-size: 14px; vertical-align: middle;">Câu ${r.questionIndex} (${r.partType})</td>
                <td style="text-align: right; vertical-align: middle;">
                  <span style="background: ${getScoreColor(r.score)}; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;">${r.score}/25</span>
                </td>
              </tr>
            </table>
            <!-- Criteria scores table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
              ${renderCriteriaRow("Phát âm", r.scores.pronunciation, getScoreColor(r.scores.pronunciation * 5))}
              ${renderCriteriaRow("Ngữ pháp", r.scores.grammar, getScoreColor(r.scores.grammar * 5))}
              ${renderCriteriaRow("Từ vựng", r.scores.vocabulary, getScoreColor(r.scores.vocabulary * 5))}
              ${renderCriteriaRow("Tự nhiên", r.scores.fluency, getScoreColor(r.scores.fluency * 5))}
              ${renderCriteriaRow("Hoàn thành nhiệm vụ", r.scores.taskAchievement, getScoreColor(r.scores.taskAchievement * 5))}
            </table>
            <!-- Feedback -->
            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px;">
              ${renderFeedbackItem("Phát âm", escapeHtml(r.feedback.pronunciation))}
              ${renderFeedbackItem("Ngữ pháp", escapeHtml(r.feedback.grammar))}
              ${renderFeedbackItem("Từ vựng", escapeHtml(r.feedback.vocabulary))}
              ${renderFeedbackItem("Tự nhiên", escapeHtml(r.feedback.fluency))}
              ${renderFeedbackItem("Hoàn thành nhiệm vụ", escapeHtml(r.feedback.taskAchievement))}
            </div>
          </div>
        `,
          )
          .join("")}

        <!-- Writing Detail -->
        <h3 style="color: #059669; font-size: 16px; margin: 24px 0 12px;">Chi tiết Writing (${writingResults.length} câu)</h3>
        ${writingResults
          .map(
            (r) => `
          <div style="background: white; padding: 16px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #059669; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
            <!-- Question header + total score -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
              <tr>
                <td style="font-weight: bold; color: #059669; font-size: 14px; vertical-align: middle;">Câu ${r.questionIndex} (${r.partType})</td>
                <td style="text-align: right; vertical-align: middle;">
                  <span style="background: ${getScoreColor(r.score)}; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;">${r.score}/25</span>
                </td>
              </tr>
            </table>
            <!-- Criteria scores table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
              ${renderCriteriaRow("Ngữ pháp", r.scores.grammar, getScoreColor(r.scores.grammar * 5))}
              ${renderCriteriaRow("Từ vựng", r.scores.vocabulary, getScoreColor(r.scores.vocabulary * 5))}
              ${renderCriteriaRow("Cấu trúc", r.scores.organization, getScoreColor(r.scores.organization * 5))}
              ${renderCriteriaRow("Hoàn thành yêu cầu", r.scores.taskFulfillment, getScoreColor(r.scores.taskFulfillment * 5))}
              ${renderCriteriaRow("Văn phong", r.scores.toneAndStyle, getScoreColor(r.scores.toneAndStyle * 5))}
            </table>
            <!-- Feedback -->
            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px;">
              ${renderFeedbackItem("Ngữ pháp", escapeHtml(r.feedback.grammar))}
              ${renderFeedbackItem("Từ vựng", escapeHtml(r.feedback.vocabulary))}
              ${renderFeedbackItem("Cấu trúc", escapeHtml(r.feedback.organization))}
              ${renderFeedbackItem("Hoàn thành yêu cầu", escapeHtml(r.feedback.taskFulfillment))}
              ${renderFeedbackItem("Văn phong", escapeHtml(r.feedback.toneAndStyle))}
            </div>
          </div>
        `,
          )
          .join("")}

        <!-- Suggested Courses -->
        <h3 style="color: #334155; font-size: 16px; margin: 24px 0 12px;">Gợi ý khóa học</h3>
        ${suggestedCourses
          .map(
            (course) => `
          <div style="background: white; padding: 12px 16px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <strong style="color: #1e40af;">${course.name}</strong>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">${course.description}</p>
          </div>
        `,
          )
          .join("")}

        <!-- Register CTA -->
        <div style="text-align: center; margin-top: 30px;">
          <a href="${courseUrl}"
             style="display: inline-block; padding: 14px 32px; background: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Đăng ký khóa học ngay
          </a>
          ${expiryLabel ? `<p style="color: #fb923c; font-size: 13px; margin-top: 10px;">&#9888; Link hết hạn lúc ${expiryLabel}</p>` : ''}
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
          Email này được gửi tự động từ hệ thống English Center. Vui lòng không trả lời email này.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Kết quả bài thi đầu vào TOEIC Speaking & Writing - ${name}`,
    html,
  });
};

const getLevelColor = (level: string): string => {
  switch (level) {
    case "Cao cấp":
      return "#16a34a";
    case "Trung cấp":
      return "#2563eb";
    case "Sơ cấp":
      return "#d97706";
    default:
      return "#ef4444";
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 21) return "#16a34a";
  if (score >= 16) return "#2563eb";
  if (score >= 11) return "#d97706";
  return "#ef4444";
};

const renderCriteriaRow = (label: string, score: number, color: string): string => {
  return `
    <tr>
      <td style="padding: 6px 0; color: #64748b; font-size: 13px; border-bottom: 1px solid #f1f5f9;">${label}</td>
      <td style="padding: 6px 0; text-align: right; font-weight: bold; font-size: 13px; color: ${color}; border-bottom: 1px solid #f1f5f9;">${score}/5</td>
    </tr>`;
};

const renderFeedbackItem = (label: string, text: string): string => {
  return `
    <div style="margin-bottom: 6px;">
      <span style="color: #475569; font-size: 12px; font-weight: bold; display: block; margin-bottom: 2px;">${label}</span>
      <span style="color: #64748b; font-size: 13px; line-height: 1.5;">${text}</span>
    </div>`;
};

const getScoreLevel = (score: number, maxScore: number): string => {
  const percentage = score / maxScore;
  if (percentage >= 0.875) return "Cao cấp";
  if (percentage >= 0.7) return "Trung cấp";
  if (percentage >= 0.5) return "Sơ cấp";
  return "Cơ bản";
};

const getSuggestedCourses = (
  totalScore: number,
): Array<{ name: string; description: string }> => {
  if (totalScore >= 350) {
    return [
      {
        name: "TOEIC Advanced",
        description:
          "Nâng cao kỹ năng Speaking & Writing lên mức chuyên nghiệp",
      },
      {
        name: "Business English Mastery",
        description: "Tiếng Anh thương mại cao cấp",
      },
      { name: "IELTS Preparation", description: "Chuẩn bị cho kỳ thi IELTS" },
    ];
  } else if (totalScore >= 280) {
    return [
      {
        name: "TOEIC Intermediate",
        description: "Cải thiện kỹ năng Speaking & Writing ở mức trung cấp",
      },
      {
        name: "Professional Communication",
        description: "Giao tiếp chuyên nghiệp trong công việc",
      },
      { name: "Advanced Writing", description: "Nâng cao kỹ năng viết" },
    ];
  } else if (totalScore >= 200) {
    return [
      {
        name: "TOEIC Foundation",
        description: "Nền tảng kỹ năng Speaking & Writing",
      },
      {
        name: "Essential Business English",
        description: "Tiếng Anh thương mại cơ bản",
      },
      { name: "Grammar Builder", description: "Củng cố ngữ pháp cơ bản" },
    ];
  } else {
    return [
      {
        name: "TOEIC Beginner",
        description: "Làm quen với kỹ năng Speaking & Writing",
      },
      {
        name: "English for Beginners",
        description: "Tiếng Anh cho người mới bắt đầu",
      },
      { name: "Basic Pronunciation", description: "Cải thiện phát âm cơ bản" },
    ];
  }
};
