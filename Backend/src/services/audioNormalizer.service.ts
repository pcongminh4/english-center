import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import path from "path";
import fs from "fs";
import { promisify } from "util";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const ffprobe = promisify(ffmpeg.ffprobe);

export interface NormalizeResult {
  wavPath: string;
  durationMs: number;
}

/**
 * Convert WebM/Opus audio to WAV PCM 16kHz 16-bit mono for Azure Speech SDK.
 * Also applies loudness normalization for consistent volume.
 *
 * @param webmPath - Full path to the input .webm file
 * @returns Object with wavPath (full path to generated .wav) and durationMs
 */
export async function normalizeAudioForAzure(
  webmPath: string,
): Promise<NormalizeResult> {
  // Validate input
  if (!fs.existsSync(webmPath)) {
    throw new Error(`Audio file not found: ${webmPath}`);
  }

  const ext = path.extname(webmPath).toLowerCase();
  if (![".webm", ".mp3", ".ogg", ".m4a", ".wav"].includes(ext)) {
    throw new Error(`Unsupported audio format: ${ext}`);
  }

  // Derive output path: same directory, same basename, .wav extension
  const baseName = path.basename(webmPath, ext);
  const dirName = path.dirname(webmPath);
  const wavPath = path.join(dirName, `${baseName}.wav`);

  // Get duration before conversion
  let durationMs = 0;
  try {
    const probeData = (await ffprobe(webmPath)) as {
      format?: { duration?: number };
    };
    durationMs = probeData.format?.duration
      ? Math.round(probeData.format.duration * 1000)
      : 0;
  } catch (probeError) {
    console.warn("Could not probe audio duration:", probeError);
  }

  // Convert: normalize → resample to 16kHz → mono → PCM 16-bit
  await new Promise<void>((resolve, reject) => {
    ffmpeg(webmPath)
      .audioFilters("loudnorm=I=-16:TP=-1.5:LRA=11")
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec("pcm_s16le")
      .toFormat("wav")
      .output(wavPath)
      .on("start", (cmdLine) => {
        console.log(`FFmpeg started: ${cmdLine}`);
      })
      .on("end", () => {
        console.log(
          `Audio normalized: ${webmPath} → ${wavPath} (${durationMs}ms)`,
        );
        resolve();
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err.message);
        reject(new Error(`Audio conversion failed: ${err.message}`));
      })
      .run();
  });

  // Validate output
  if (!fs.existsSync(wavPath)) {
    throw new Error("WAV file was not created");
  }

  const wavStats = fs.statSync(wavPath);
  if (wavStats.size < 44) {
    // WAV header is 44 bytes minimum
    fs.unlinkSync(wavPath);
    throw new Error("Generated WAV file is corrupted (too small)");
  }

  return { wavPath, durationMs };
}
