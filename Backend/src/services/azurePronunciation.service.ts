import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import fs from "fs";

export interface AzurePronunciationResult {
  transcript: string;
  pronScore: number; // 0-100
  accuracyScore: number; // 0-100
  fluencyScore: number; // 0-100
  prosodyScore: number; // 0-100
  completenessScore: number | null; // null for unscripted (no reference) mode
  wordResults: WordAssessment[];
}

export interface WordAssessment {
  word: string;
  accuracyScore: number;
  errorType: string; // "None"|"Omission"|"Insertion"|"Mispronunciation"|"UnexpectedBreak"|"MissingBreak"|"Monotone"
}

export interface AzureAssessmentConfig {
  wavPath: string;
  referenceText: string; // "" for unscripted (Part 2-5)
  enableProsody: boolean;
  enableMiscue: boolean; // true for Part 1 (with reference)
  timeoutMs?: number;
}

/**
 * Assess pronunciation using Azure Speech SDK.
 * Supports both scripted (with reference text) and unscripted (free speaking) modes.
 */
export async function assessPronunciation(
  config: AzureAssessmentConfig,
): Promise<AzurePronunciationResult> {
  const {
    wavPath,
    referenceText,
    enableProsody,
    enableMiscue,
    timeoutMs = 60000,
  } = config;

  // Validate WAV file
  if (!fs.existsSync(wavPath)) {
    throw new Error(`WAV file not found: ${wavPath}`);
  }

  const wavBuffer = fs.readFileSync(wavPath);
  if (wavBuffer.length < 44) {
    throw new Error("WAV file is too small to be valid");
  }

  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION || "eastus";

  if (!speechKey) {
    throw new Error("AZURE_SPEECH_KEY environment variable is not set");
  }

  // Create speech config
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    speechKey,
    speechRegion,
  );
  speechConfig.speechRecognitionLanguage = "en-US"; // Required for prosody

  // Create audio config from WAV buffer
  const audioConfig = sdk.AudioConfig.fromWavFileInput(wavBuffer);

  // Create pronunciation assessment config
  const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    false, // enableMiscue set separately below
  );

  // Enable prosody assessment
  if (enableProsody) {
    pronunciationConfig.enableProsodyAssessment = true;
  }

  // Enable miscue detection (only effective with reference text)
  if (enableMiscue) {
    pronunciationConfig.enableMiscue = true;
  }

  // Create recognizer
  const recognizer = new sdk.SpeechRecognizer(
    speechConfig,
    audioConfig,
  );
  pronunciationConfig.applyTo(recognizer);

  return new Promise<AzurePronunciationResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      recognizer.close();
      reject(new Error("Azure pronunciation assessment timed out"));
    }, timeoutMs);

    let fullTranscript = "";
    const wordResults: WordAssessment[] = [];
    let pronScore = 0;
    let accuracyScore = 0;
    let fluencyScore = 0;
    let prosodyScore = 0;
    let completenessScore: number | null = null;
    const isScripted = referenceText.trim().length > 0;

    recognizer.recognized = (_s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        fullTranscript += e.result.text + " ";

        // Extract pronunciation assessment details
        const pronResult =
          sdk.PronunciationAssessmentResult.fromResult(e.result);
        const detail = pronResult.detailResult;

        if (detail) {
          pronScore = Math.max(pronScore, detail.PronunciationAssessment.PronScore);
          accuracyScore = Math.max(accuracyScore, detail.PronunciationAssessment.AccuracyScore);
          fluencyScore = Math.max(fluencyScore, detail.PronunciationAssessment.FluencyScore);
          prosodyScore = Math.max(prosodyScore, detail.PronunciationAssessment.ProsodyScore);

          if (isScripted) {
            completenessScore = Math.max(
              completenessScore ?? 0,
              detail.PronunciationAssessment.CompletenessScore,
            );
          }

          // Collect word-level results
          for (const w of detail.Words) {
            wordResults.push({
              word: w.Word,
              accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
              errorType: w.PronunciationAssessment?.ErrorType ?? "None",
            });
          }
        }
      }
    };

    recognizer.sessionStopped = () => {
      clearTimeout(timeout);
      recognizer.close();

      // If no speech was recognized, return zeros
      if (fullTranscript.trim() === "") {
        resolve({
          transcript: "",
          pronScore: 0,
          accuracyScore: 0,
          fluencyScore: 0,
          prosodyScore: 0,
          completenessScore: isScripted ? 0 : null,
          wordResults: [],
        });
        return;
      }

      resolve({
        transcript: fullTranscript.trim(),
        pronScore,
        accuracyScore,
        fluencyScore,
        prosodyScore,
        completenessScore: isScripted ? completenessScore : null,
        wordResults,
      });
    };

    recognizer.canceled = (_s, e) => {
      clearTimeout(timeout);
      recognizer.close();

      if (e.reason === sdk.CancellationReason.Error) {
        reject(
          new Error(
            `Azure Speech error: ${e.errorDetails || "Unknown error"}`,
          ),
        );
      } else {
        // No match or end of stream — resolve with what we have
        resolve({
          transcript: fullTranscript.trim(),
          pronScore,
          accuracyScore,
          fluencyScore,
          prosodyScore,
          completenessScore: isScripted ? completenessScore : null,
          wordResults,
        });
      }
    };

    // Start continuous recognition
    recognizer.startContinuousRecognitionAsync(
      undefined,
      (err: string) => {
        clearTimeout(timeout);
        recognizer.close();
        reject(new Error(`Failed to start recognition: ${err}`));
      },
    );
  });
}
