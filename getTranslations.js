const axios = require("axios");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: "quran_ayat.csv",
  header: [
    { id: "reference", title: "Reference" },
    { id: "translation", title: "Translation" },
  ],
});

async function fetchAyatData(surahNumber, ayahNumber) {
  const translationUrl = `http://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/en.asad`;

  try {
    const translationResponse = await axios.get(translationUrl);
    return {
      translation: translationResponse.data.data.text,
    };
  } catch (error) {
    console.error(
      `Error fetching data for ${surahNumber}:${ayahNumber}`,
      error
    );
    return null;
  }
}

async function generateCsv() {
  const surahCount = 114;
  const ayatData = [];

  for (let surah = 1; surah <= surahCount; surah++) {
    const ayahCountUrl = `http://api.alquran.cloud/v1/surah/${surah}`;
    const ayahCountResponse = await axios.get(ayahCountUrl);
    const ayahCount = ayahCountResponse.data.data.numberOfAyahs;

    for (let ayah = 1; ayah <= ayahCount; ayah++) {
      const formattedSurah = surah.toString().padStart(3, "0");
      const formattedAyah = ayah.toString().padStart(3, "0");
      const reference = `${formattedSurah}_${formattedAyah}`;

      const data = await fetchAyatData(surah, ayah);
      if (data) {
        ayatData.push({
          reference,
          translation: data.translation,
        });
        console.log(`Fetched data for ${reference}`);
      }
    }
  }

  await csvWriter.writeRecords(ayatData);
  console.log("CSV file created successfully.");
}

generateCsv();
