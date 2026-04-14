import { model, MODEL_NAME, AI_TIMEOUT, AZURE_TIMEOUT_MS } from "../config/aiGrading.config";
import { normalizeAudioForAzure } from "./audioNormalizer.service";
import {
  assessPronunciation,
  type AzurePronunciationResult,
} from "./azurePronunciation.service";
import path from "path";
import fs from "fs";

/**
 * Score interface for AI grading result
 */
interface ScoreResult {
  score: number; // 0-5 for each criterion
  feedback: string;
}

interface SpeakingScore {
  pronunciation: ScoreResult; // From Azure (mapped 0-100 → 0-5)
  grammar: ScoreResult; // From Llama 4 Scout
  vocabulary: ScoreResult; // From Llama 4 Scout
  fluency: ScoreResult; // From Azure (mapped 0-100 → 0-5)
  taskAchievement: ScoreResult; // From Llama 4 Scout
  totalScore: number; // 0-25 (sum of 5 criteria)
}

interface WritingScore {
  grammar: ScoreResult;
  vocabulary: ScoreResult;
  organization: ScoreResult;
  taskFulfillment: ScoreResult;
  toneAndStyle: ScoreResult;
  totalScore: number; // 0-25 (sum of 5 criteria)
}

/**
 * Map Azure score (0-100) to 0-5 scale
 */
function mapAzureToFivePoint(azureScore: number): number {
  let mapped = Math.round(azureScore / 20);
  return Math.min(Math.max(mapped, 0), 5);
}

/**
 * Build evidence-based pronunciation feedback from Azure results
 */
function buildPronunciationFeedback(azure: AzurePronunciationResult): string {
  const parts: string[] = [];
  const mapped = mapAzureToFivePoint(azure.pronScore);
  parts.push(`Overall pronunciation: ${mapped}/5.`);

  if (azure.completenessScore !== null) {
    const completenessMapped = mapAzureToFivePoint(azure.completenessScore);
    parts.push(`Text completeness: ${completenessMapped}/5.`);
  }

  const errorWords = azure.wordResults.filter(
    (w) => w.errorType !== "None",
  );

  if (errorWords.length > 0) {
    // Group errors by type
    const errorsByType: Record<string, string[]> = {};
    for (const w of errorWords) {
      if (!errorsByType[w.errorType]) errorsByType[w.errorType] = [];
      errorsByType[w.errorType].push(w.word);
    }

    for (const [errorType, words] of Object.entries(errorsByType)) {
      const label = getErrorTypeLabel(errorType);
      parts.push(`${label}: ${words.join(", ")}.`);
    }
  } else if (azure.pronScore >= 70) {
    parts.push("Pronunciation is clear and accurate.");
  }

  return parts.join(" ");
}

/**
 * Get human-readable label for Azure error types
 */
function getErrorTypeLabel(errorType: string): string {
  const labels: Record<string, string> = {
    Mispronunciation: "Mispronounced",
    Omission: "Omitted words",
    Insertion: "Extra words inserted",
    UnexpectedBreak: "Unexpected pause at",
    MissingBreak: "Missing pause at",
    Monotone: "Monotone delivery at",
  };
  return labels[errorType] || errorType;
}

/**
 * Build fluency feedback from Azure results (includes prosody)
 */
function buildFluencyFeedback(azure: AzurePronunciationResult): string {
  const parts: string[] = [];
  const fluencyMapped = mapAzureToFivePoint(azure.fluencyScore);
  const prosodyMapped = mapAzureToFivePoint(azure.prosodyScore);
  parts.push(`Fluency: ${fluencyMapped}/5.`);
  parts.push(
    `Prosody (stress, intonation, rhythm): ${prosodyMapped}/5.`,
  );

  if (azure.fluencyScore >= 80) {
    parts.push("Speech flows naturally with good rhythm.");
  } else if (azure.fluencyScore >= 50) {
    parts.push("Speech is generally fluent with some hesitation.");
  } else {
    parts.push("Speech has noticeable interruptions affecting flow.");
  }

  return parts.join(" ");
}

/**
 * Prompt template for LLM Speaking grading (3 criteria only)
 * Pronunciation and fluency are handled by Azure, so the LLM only grades
 * grammar, vocabulary, and task achievement.
 */
const SPEAKING_LLM_PROMPT = `
You are a strict TOEIC Speaking examiner.

You are given a transcript of a student's spoken response. Grade ONLY the following 3 criteria (0–5 each):

1. Grammar: Sentence structure, verb tenses, word forms, subject-verb agreement
2. Vocabulary: Range, accuracy, appropriateness of word choice
3. Task Achievement: How well the student answered the question/prompt

Scoring guidelines:
- 5: Excellent, near-native level
- 4: Good, minor errors
- 3: Fair, noticeable errors but understandable
- 2: Limited, frequent errors
- 1: Poor, very difficult to understand
- 0: No response or irrelevant

Question: {question}
Part: {partType}
{passage_context}
{image_context}

Transcript: {transcript}

{word_errors_context}

Important rules:
- Base your evaluation ONLY on the transcript.
- Do NOT assume missing information.
- Be strict and consistent.
- Do NOT grade pronunciation or fluency (those are handled separately by an automated system).
- Penalize grammatical errors strictly.
- Reward appropriate vocabulary range and accurate task response.

Return ONLY valid JSON in this format:
{
  "grammar": { "score": number, "feedback": string },
  "vocabulary": { "score": number, "feedback": string },
  "taskAchievement": { "score": number, "feedback": string }
}

Be concise and constructive in feedback. Return ONLY valid JSON.
`;

/**
 * Grade speaking criteria with LLM (grammar, vocabulary, task achievement)
 */
async function gradeSpeakingWithLLM(params: {
  question: string;
  partType: string;
  passage?: string;
  transcript: string;
  wordErrors: string;
}): Promise<{
  grammar: ScoreResult;
  vocabulary: ScoreResult;
  taskAchievement: ScoreResult;
}> {
  const { question, partType, passage, transcript, wordErrors } = params;

  // Build context
  let passageContext = "";
  let imageContext = "";
  let wordErrorsContext = "";

  if (passage) {
    passageContext = `\nContext/Passage:\n${passage}`;
  }

  if (
    question.includes("http") ||
    question.includes(".jpg") ||
    question.includes(".png")
  ) {
    imageContext =
      "\nNote: The question includes an image. Consider the image content in your evaluation.";
  }

  if (wordErrors) {
    wordErrorsContext = `\nPronunciation issues detected by automated system: ${wordErrors}. Consider these when evaluating grammar and vocabulary usage.`;
  }

  const prompt = SPEAKING_LLM_PROMPT.replace("{question}", question)
    .replace("{partType}", partType)
    .replace("{transcript}", transcript)
    .replace("{passage_context}", passageContext)
    .replace("{image_context}", imageContext)
    .replace("{word_errors_context}", wordErrorsContext);

  console.log("[SPEAKING GRADING]   LLM prompt length:", prompt.length);

  const result = await Promise.race<any>(
    [
      model.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a TOEIC Speaking examiner. Provide only valid JSON responses. Grade only grammar, vocabulary, and task achievement.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: MODEL_NAME,
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("LLM timeout")), AI_TIMEOUT),
      ),
    ],
  );

  const text = result.choices[0]?.message?.content || "";

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid LLM response format");
  }

  const scores = JSON.parse(jsonMatch[0]);

  // Validate and clamp scores
  const clampScore = (s: number) => Math.min(Math.max(s, 0), 5);

  return {
    grammar: {
      score: clampScore(scores.grammar?.score ?? 0),
      feedback: scores.grammar?.feedback || "Unable to assess grammar",
    },
    vocabulary: {
      score: clampScore(scores.vocabulary?.score ?? 0),
      feedback: scores.vocabulary?.feedback || "Unable to assess vocabulary",
    },
    taskAchievement: {
      score: clampScore(scores.taskAchievement?.score ?? 0),
      feedback:
        scores.taskAchievement?.feedback ||
        "Unable to assess task achievement",
    },
  };
}

/**
 * Grade a single Speaking answer using Azure Pronunciation Assessment + Llama 4 Scout
 *
 * Flow:
 * 1. Normalize audio (WebM → WAV)
 * 2. Azure Pronunciation Assessment → pronunciation + fluency + transcript + word evidence
 * 3. Llama 4 Scout → grammar + vocabulary + task achievement
 * 4. Score fusion
 */
export const gradeSpeakingAnswer = async (
  question: string,
  partType: string,
  audioPath: string,
  passage?: string,
): Promise<SpeakingScore> => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[SPEAKING GRADING] START — ${partType}`);
  console.log(`[SPEAKING GRADING] Question: ${question.substring(0, 80)}`);
  console.log(`[SPEAKING GRADING] Audio path: ${audioPath}`);

  // Validate audio path
  if (!audioPath) {
    console.warn("[SPEAKING GRADING] No audio path, returning default score");
    return getDefaultSpeakingScore();
  }

  // Resolve full path on disk
  const fullPath = path.join(process.cwd(), audioPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`[SPEAKING GRADING] Audio file not found: ${fullPath}`);
    return getDefaultSpeakingScore();
  }
  console.log(`[SPEAKING GRADING] Audio file exists: ${fullPath} (${(fs.statSync(fullPath).size / 1024).toFixed(1)}KB)`);

  // Determine reference text (only for Part 1 — read aloud)
  const isPart1 = partType === "Part 1";
  const referenceText = isPart1
    ? question.replace(/\s+/g, " ").trim()
    : "";
  console.log(`[SPEAKING GRADING] Is Part 1 (read aloud): ${isPart1}, reference text length: ${referenceText.length}`);

  let wavPath: string | null = null;
  let azureResult: AzurePronunciationResult | null = null;
  let llmResult: {
    grammar: ScoreResult;
    vocabulary: ScoreResult;
    taskAchievement: ScoreResult;
  } | null = null;

  try {
    // Step 1: Normalize audio (WebM → WAV 16kHz mono PCM)
    try {
      console.log("[SPEAKING GRADING] Step 1: Normalizing audio (WebM → WAV)...");
      const normalizeResult = await normalizeAudioForAzure(fullPath);
      wavPath = normalizeResult.wavPath;
      console.log(`[SPEAKING GRADING] Step 1 DONE — WAV: ${wavPath}, duration: ${normalizeResult.durationMs}ms`);
    } catch (normalizeError) {
      console.error("[SPEAKING GRADING] Step 1 FAILED — Audio normalization error:", normalizeError);
    }

    // Step 2: Azure Pronunciation Assessment
    if (wavPath) {
      try {
        console.log("[SPEAKING GRADING] Step 2: Running Azure Pronunciation Assessment...");
        console.log(`[SPEAKING GRADING]   referenceText="${referenceText.substring(0, 60)}${referenceText.length > 60 ? "..." : ""}", enableProsody=true, enableMiscue=${isPart1}`);
        azureResult = await assessPronunciation({
          wavPath,
          referenceText,
          enableProsody: true,
          enableMiscue: isPart1,
          timeoutMs: AZURE_TIMEOUT_MS,
        });
        console.log(`[SPEAKING GRADING] Step 2 DONE — Azure results:`);
        console.log(`[SPEAKING GRADING]   pronScore: ${azureResult.pronScore} → ${mapAzureToFivePoint(azureResult.pronScore)}/5`);
        console.log(`[SPEAKING GRADING]   accuracyScore: ${azureResult.accuracyScore} → ${mapAzureToFivePoint(azureResult.accuracyScore)}/5`);
        console.log(`[SPEAKING GRADING]   fluencyScore: ${azureResult.fluencyScore} → ${mapAzureToFivePoint(azureResult.fluencyScore)}/5`);
        console.log(`[SPEAKING GRADING]   prosodyScore: ${azureResult.prosodyScore} → ${mapAzureToFivePoint(azureResult.prosodyScore)}/5`);
        console.log(`[SPEAKING GRADING]   completenessScore: ${azureResult.completenessScore}${azureResult.completenessScore !== null ? ` → ${mapAzureToFivePoint(azureResult.completenessScore)}/5` : " (null)"}`);
        console.log(`[SPEAKING GRADING]   transcript: "${azureResult.transcript}"`);
        console.log(`[SPEAKING GRADING]   wordResults (${azureResult.wordResults.length} words):`);
        const errorWords = azureResult.wordResults.filter(w => w.errorType !== "None");
        if (errorWords.length > 0) {
          errorWords.forEach(w => {
            console.log(`[SPEAKING GRADING]     ERROR: "${w.word}" — ${w.errorType} (accuracy: ${w.accuracyScore})`);
          });
        } else {
          console.log(`[SPEAKING GRADING]     No word errors detected`);
        }
      } catch (azureError) {
        console.error("[SPEAKING GRADING] Step 2 FAILED — Azure assessment error:", azureError);
      }
    } else {
      console.warn("[SPEAKING GRADING] Step 2 SKIPPED — No WAV file available");
    }

    // Step 3: Check if we have a transcript for LLM grading
    const transcript = azureResult?.transcript || "";
    if (!transcript) {
      console.warn("[SPEAKING GRADING] Step 3 ABORT — No transcript available, returning default score");
      return getDefaultSpeakingScore();
    }
    console.log(`[SPEAKING GRADING] Step 3: Transcript available (${transcript.length} chars)`);

    // Step 4: Build word errors context for LLM
    const wordErrors = azureResult
      ? azureResult.wordResults
          .filter((w) => w.errorType !== "None")
          .map((w) => `"${w.word}" (${w.errorType})`)
          .join(", ")
      : "";
    console.log(`[SPEAKING GRADING] Step 4: Word errors for LLM context: "${wordErrors || "none"}"`);

    // Step 5: LLM grading (grammar, vocabulary, task achievement)
    try {
      console.log("[SPEAKING GRADING] Step 5: Running LLM grading (grammar, vocabulary, taskAchievement)...");
      llmResult = await gradeSpeakingWithLLM({
        question,
        partType,
        passage,
        transcript,
        wordErrors,
      });
      console.log(`[SPEAKING GRADING] Step 5 DONE — LLM results:`);
      console.log(`[SPEAKING GRADING]   grammar: ${llmResult.grammar.score}/5 — "${llmResult.grammar.feedback}"`);
      console.log(`[SPEAKING GRADING]   vocabulary: ${llmResult.vocabulary.score}/5 — "${llmResult.vocabulary.feedback}"`);
      console.log(`[SPEAKING GRADING]   taskAchievement: ${llmResult.taskAchievement.score}/5 — "${llmResult.taskAchievement.feedback}"`);
    } catch (llmError) {
      console.error("[SPEAKING GRADING] Step 5 FAILED — LLM grading error:", llmError);
      llmResult = null;
    }

    // Step 6: Score fusion
    const pronunciationScore = azureResult
      ? mapAzureToFivePoint(azureResult.pronScore)
      : 0;
    const fluencyScore = azureResult
      ? mapAzureToFivePoint(azureResult.fluencyScore)
      : 0;
    const grammarScore = llmResult?.grammar.score ?? 0;
    const vocabularyScore = llmResult?.vocabulary.score ?? 0;
    const taskAchievementScore = llmResult?.taskAchievement.score ?? 0;

    const totalScore =
      pronunciationScore +
      fluencyScore +
      grammarScore +
      vocabularyScore +
      taskAchievementScore;

    console.log(`[SPEAKING GRADING] Step 6: Score fusion:`);
    console.log(`[SPEAKING GRADING]   pronunciation: ${pronunciationScore}/5 (Azure)`);
    console.log(`[SPEAKING GRADING]   grammar: ${grammarScore}/5 (LLM)`);
    console.log(`[SPEAKING GRADING]   vocabulary: ${vocabularyScore}/5 (LLM)`);
    console.log(`[SPEAKING GRADING]   fluency: ${fluencyScore}/5 (Azure)`);
    console.log(`[SPEAKING GRADING]   taskAchievement: ${taskAchievementScore}/5 (LLM)`);
    console.log(`[SPEAKING GRADING]   TOTAL: ${totalScore}/25`);
    console.log(`[SPEAKING GRADING] END — ${partType}`);
    console.log(`${"=".repeat(60)}\n`);

    return {
      pronunciation: {
        score: pronunciationScore,
        feedback: azureResult
          ? buildPronunciationFeedback(azureResult)
          : "Unable to assess pronunciation",
      },
      grammar: {
        score: grammarScore,
        feedback: llmResult?.grammar.feedback || "Unable to assess grammar",
      },
      vocabulary: {
        score: vocabularyScore,
        feedback:
          llmResult?.vocabulary.feedback || "Unable to assess vocabulary",
      },
      fluency: {
        score: fluencyScore,
        feedback: azureResult
          ? buildFluencyFeedback(azureResult)
          : "Unable to assess fluency",
      },
      taskAchievement: {
        score: taskAchievementScore,
        feedback:
          llmResult?.taskAchievement.feedback ||
          "Unable to assess task achievement",
      },
      totalScore,
    };
  } catch (error) {
    console.error("[SPEAKING GRADING] UNEXPECTED ERROR:", error);
    return getDefaultSpeakingScore();
  } finally {
    // Clean up: delete the generated WAV file
    if (wavPath) {
      try {
        if (fs.existsSync(wavPath)) {
          fs.unlinkSync(wavPath);
          console.log(`[SPEAKING GRADING] Cleanup: deleted ${wavPath}`);
        }
      } catch (cleanupError) {
        console.warn("[SPEAKING GRADING] Cleanup failed:", cleanupError);
      }
    }
  }
};

/**
 * Prompt template for Writing grading
 */
const WRITING_PROMPT = `
You are a TOEIC Writing examiner. Grade the following writing response based on TOEIC criteria.

TOEIC Writing Criteria (0-5 points each):
1. Grammar: Sentence structure, verb tenses, word forms, punctuation
2. Vocabulary: Range, accuracy, appropriateness, spelling
3. Organization: Paragraph structure, logical flow, coherence
4. Task Fulfillment: Completeness, relevance, content accuracy
5. Tone & Style: Professionalism, formality, register

Question: {question}
Type: {partType}
{passage_context}
{image_context}

Response: {answer}

Provide a JSON response with this exact format:
{
  "grammar": { "score": number (0-5), "feedback": string },
  "vocabulary": { "score": number (0-5), "feedback": string },
  "organization": { "score": number (0-5), "feedback": string },
  "taskFulfillment": { "score": number (0-5), "feedback": string },
  "toneAndStyle": { "score": number (0-5), "feedback": string }
}

Be concise and constructive in feedback. Return ONLY valid JSON.
- Penalize grammatical errors strictly.
- Reward clear structure and coherence.
- Do not give high scores unless the response fully answers the question.
`;

/**
 * Grade a single Writing answer
 */
export const gradeWritingAnswer = async (
  question: string,
  partType: string,
  answer: string,
  picture: string = "",
  passage?: string,
): Promise<WritingScore> => {
  try {
    let passageContext = "";
    let imageContext = "";
    if (answer.trim() === "") {
      return getDefaultWritingScore();
    }
    if (passage) {
      passageContext = `\nContext/Passage:\n${passage}`;
    }

    if (picture) {
      imageContext = `\nNote: The question includes the following image description: ${picture}`;
    }

    const prompt = WRITING_PROMPT.replace("{question}", question)
      .replace("{partType}", partType)
      .replace("{answer}", answer)
      .replace("{passage_context}", passageContext)
      .replace("{image_context}", imageContext);

    const result = await Promise.race<any>([
      model.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a TOEIC Writing examiner. Provide only valid JSON responses.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: MODEL_NAME,
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), AI_TIMEOUT),
      ),
    ]);
    console.log("Grading writing answer with prompt:", prompt);
    console.log("AI response for writing grading:", result);
    const text = result.choices[0]?.message?.content || "";

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const scores = JSON.parse(jsonMatch[0]);
    const totalScore =
      scores.grammar.score +
      scores.vocabulary.score +
      scores.organization.score +
      scores.taskFulfillment.score +
      scores.toneAndStyle.score;

    return {
      grammar: scores.grammar,
      vocabulary: scores.vocabulary,
      organization: scores.organization,
      taskFulfillment: scores.taskFulfillment,
      toneAndStyle: scores.toneAndStyle,
      totalScore,
    };
  } catch (error) {
    console.error("Error grading writing answer:", error);
    return getDefaultWritingScore();
  }
};

export const calculateSpeakingScaledScore = (
  rawScore: number,
  totalQuestions: number,
): number => {
  const maxRawScore = totalQuestions * 25;
  const percentage = rawScore / maxRawScore;
  const scaledScore = Math.round(percentage * 190) + 10;
  return Math.min(Math.max(scaledScore, 10), 200);
};

/**
 * Calculate scaled Writing score (0-40 → 10-200)
 */
export const calculateWritingScaledScore = (
  rawScore: number,
  totalQuestions: number,
): number => {
  const maxRawScore = totalQuestions * 25;
  const percentage = rawScore / maxRawScore;
  const scaledScore = Math.round(percentage * 190) + 10;
  return Math.min(Math.max(scaledScore, 10), 200);
};

/**
 * Get default Speaking score (for error cases)
 */
function getDefaultSpeakingScore(): SpeakingScore {
  return {
    pronunciation: { score: 0, feedback: "Unable to assess pronunciation" },
    grammar: { score: 0, feedback: "Unable to assess grammar" },
    vocabulary: { score: 0, feedback: "Unable to assess vocabulary" },
    fluency: { score: 0, feedback: "Unable to assess fluency" },
    taskAchievement: {
      score: 0,
      feedback: "Unable to assess task achievement",
    },
    totalScore: 0,
  };
}

/**
 * Get default Writing score (for error cases)
 */
function getDefaultWritingScore(): WritingScore {
  return {
    grammar: { score: 0, feedback: "Unable to assess grammar" },
    vocabulary: { score: 0, feedback: "Unable to assess vocabulary" },
    organization: { score: 0, feedback: "Unable to assess organization" },
    taskFulfillment: {
      score: 0,
      feedback: "Unable to assess task fulfillment",
    },
    toneAndStyle: { score: 0, feedback: "Unable to assess tone and style" },
    totalScore: 0,
  };
}
