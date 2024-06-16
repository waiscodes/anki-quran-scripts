const fs = require("fs");
const path = require("path");
const musicMetadata = require("music-metadata");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const inputDir = "Quran_Audio";
const outputDir = "Quran_5m_chunk";

const CHUNK_DURATION = 300;
const MIN_CHUNK_DURATION = 180;

function getAllFiles(dir) {
  return fs.readdirSync(dir).filter((file) => file.endsWith(".mp3"));
}

function parseFilename(filename) {
  const [surah, ayah] = filename
    .slice(5, -4)
    .split("_")
    .map((num) => parseInt(num, 10));
  return { surah, ayah, filename };
}

async function groupAudioFiles() {
  const files = getAllFiles(inputDir).map(parseFilename);
  const chunks = [];
  let currentChunk = [];
  let currentDuration = 0;
  let lastAyah = null;

  for (const file of files) {
    const filePath = path.join(inputDir, file.filename);
    const metadata = await musicMetadata.parseFile(filePath);
    const duration = metadata.format.duration;

    if (lastAyah && lastAyah.surah !== file.surah) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      currentChunk = [];
      currentDuration = 0;
    }

    if (currentDuration + duration > CHUNK_DURATION) {
      if (currentDuration < MIN_CHUNK_DURATION && currentChunk.length > 0) {
        chunks[chunks.length - 1].push(...currentChunk);
      } else {
        chunks.push(currentChunk);
      }

      currentChunk = [lastAyah];
      currentDuration = lastAyah ? lastAyah.duration : 0;
    }

    currentChunk.push({ ...file, duration });
    currentDuration += duration;
    lastAyah = { ...file, duration };
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function saveChunks(chunks) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (const chunk of chunks) {
    const start = chunk[0];
    const end = chunk[chunk.length - 1];
    const outputFileName = `Quran ${String(start.surah).padStart(
      3,
      "0"
    )}_${String(start.ayah).padStart(3, "0")}:${String(end.ayah).padStart(
      3,
      "0"
    )}.mp3`;
    const outputFilePath = path.join(outputDir, outputFileName);

    const ffmpegCommand = ffmpeg();
    chunk.forEach(({ filename }) => {
      ffmpegCommand.input(path.join(inputDir, filename));
    });

    await new Promise((resolve, reject) => {
      ffmpegCommand
        .mergeToFile(outputFilePath)
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`Saved chunk: ${outputFileName}`);
  }
}

async function main() {
  const chunks = await groupAudioFiles();
  await saveChunks(chunks);
}

main().catch(console.error);
