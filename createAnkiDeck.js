const fs = require("fs");
const path = require("path");
const fastcsv = require("fast-csv");

// change to to your anki media directory
const ANKI_APP_DIR =
  "Library/Application Support/Anki2/User 1/collection.media";

const ankiMediaDir = path.join(process.env.HOME, ANKI_APP_DIR);

if (!fs.existsSync(ankiMediaDir)) {
  fs.mkdirSync(ankiMediaDir, { recursive: true });
}

const padNumber = (num) => String(num).padStart(3, "0");

const readTranslations = async () => {
  return new Promise((resolve, reject) => {
    const translations = {};
    fs.createReadStream(path.join(__dirname, "quran_ayat.csv"))
      .pipe(fastcsv.parse({ headers: true }))
      .on("data", (row) => {
        translations[row.Reference] = row.Translation;
      })
      .on("end", () => {
        resolve(translations);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const copyToAnkiMedia = (sourcePath, filename) => {
  const destPath = path.join(ankiMediaDir, filename);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(sourcePath, destPath);
  }
};

const createCSV = async () => {
  const csvStream = fastcsv.format({ headers: true });
  const writableStream = fs.createWriteStream("quran_deck.csv");

  writableStream.on("finish", () => {
    console.log("CSV file created successfully!");
  });

  csvStream.pipe(writableStream);

  const translations = await readTranslations();

  const surahAyahCounts = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
    111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
    54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49,
    62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28,
    28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5,
    6,
  ];

  for (
    let surahNumber = 1;
    surahNumber <= surahAyahCounts.length;
    surahNumber++
  ) {
    for (
      let ayahNumber = 1;
      ayahNumber <= surahAyahCounts[surahNumber - 1];
      ayahNumber++
    ) {
      const surahNum = padNumber(surahNumber);
      const ayahNum = padNumber(ayahNumber);
      const reference = `${surahNum}_${ayahNum}`;

      const audioFilename = `ayah_${surahNum}_${ayahNum}.mp3`;
      const imageFilename = `ayah_${surahNum}_${ayahNum}.png`;

      const audioPath = path.join(__dirname, "quran_audio", audioFilename);
      const imagePath = path.join(__dirname, "quran_images", imageFilename);

      if (fs.existsSync(audioPath) && fs.existsSync(imagePath)) {
        copyToAnkiMedia(audioPath, audioFilename);
        copyToAnkiMedia(imagePath, imageFilename);

        const audioTag = `[sound:${audioFilename}]`;
        const imageTag = `<img src="${imageFilename}">`;
        const translation = translations[reference];

        if (translation) {
          const front = `${imageTag}<br>${audioTag}`;
          const back = translation;
          csvStream.write({ Front: front, Back: back });
          console.log(`Added Surah ${surahNumber}, Ayah ${ayahNumber} to CSV`);
        } else {
          console.log(
            `Translation for Surah ${surahNumber}, Ayah ${ayahNumber} not found.`
          );
        }
      } else {
        console.log(
          `Files for Surah ${surahNumber}, Ayah ${ayahNumber} not found.`
        );
      }
    }
  }

  csvStream.end();
};

createCSV();
