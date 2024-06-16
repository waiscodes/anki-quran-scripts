const fs = require("fs");
const axios = require("axios");
const path = require("path");

// Base URL pattern for the image files
const baseUrl = "https://everyayah.com/data/images_png/";

const downloadDir = path.join(__dirname, "quran_images");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

const padNumber = (num) => String(num).padStart(3, "0");

const downloadImage = async (surahNumber, ayahNumber) => {
  const url = `${baseUrl}${surahNumber}_${ayahNumber}.png`;
  try {
    const response = await axios({
      url: url,
      method: "GET",
      responseType: "stream",
    });

    const filePath = path.join(
      downloadDir,
      `ayah_${padNumber(surahNumber)}_${padNumber(ayahNumber)}.png`
    );
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.log(
      `Failed to download surah ${padNumber(surahNumber)} ayah ${padNumber(
        ayahNumber
      )}: ${error.message}`
    );
  }
};

const downloadAllImages = async () => {
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
      await downloadImage(surahNumber, ayahNumber);
      console.log(
        `Downloaded surah ${padNumber(surahNumber)} ayah ${padNumber(
          ayahNumber
        )}`
      );
    }
  }
};

downloadAllImages();
