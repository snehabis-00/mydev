// const fs = require("fs");
// const axios = require("axios");

// // 🔑 Credentials (GitHub Secrets)
// const USERNAME = process.env.NAMECOM_USERNAME;
// const TOKEN = process.env.NAMECOM_API_TOKEN;

// // ⚙️ Settings
// const EXTENSION = ".com";
// const DELAY_MS = 1000;

// const MAX_RUNTIME_MS = 5.5 * 60 * 60 * 1000;

// const WORDS_FILE = "words1.txt";
// const OUTPUT_FILE = `available-${EXTENSION.replace(".", "")}.txt`;
// const PROGRESS_FILE = "progress.txt";

// const startTime = Date.now();

// // 📍 Load progress
// function loadProgress() {

//   if (!fs.existsSync(PROGRESS_FILE)) {
//     return 0;
//   }

//   const value = fs.readFileSync(PROGRESS_FILE, "utf-8").trim();

//   return parseInt(value || "0");
// }

// // 💾 Save progress
// function saveProgress(index) {
//   fs.writeFileSync(PROGRESS_FILE, String(index));
// }

// // 🌐 API call
// async function checkBatch(batch) {

//   try {

//     const res = await axios.post(
//       "https://api.name.com/v4/domains:checkAvailability",
//       {
//         domainNames: batch
//       },
//       {
//         auth: {
//           username: USERNAME,
//           password: TOKEN
//         },
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     return res.data.results || [];

//   } catch (err) {

//     if (err.response) {
//       console.log("API Error:", err.response.status);
//     } else {
//       console.log("API Error:", err.message);
//     }

//     return [];
//   }
// }

// // 💾 Save available domains
// function saveAvailable(domains) {

//   if (!domains.length) return;

//   fs.appendFileSync(
//     OUTPUT_FILE,
//     domains.join("\n") + "\n"
//   );
// }

// // ⏳ Delay
// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// // 🚀 Main
// async function main() {

//   if (!fs.existsSync(WORDS_FILE)) {
//     console.log("words.txt not found");
//     return;
//   }

//   const words = fs.readFileSync(WORDS_FILE, "utf-8")
//     .split("\n")
//     .map(w => w.trim())
//     .filter(Boolean);

//   const startIndex = loadProgress();

//   console.log(`Loaded ${words.length} words`);
//   console.log(`Resuming from index ${startIndex}`);

//   for (let i = startIndex; i < words.length; i += 50) {

//     const batch = words
//       .slice(i, i + 50)
//       .map(w => w + EXTENSION);

//     console.log(
//       `Checking ${i} → ${Math.min(i + 50, words.length)}`
//     );

//     const results = await checkBatch(batch);

//     const available = results
//       .filter(r => r.purchasable && !r.premium)
//       .map(r =>
//         r.domainName.replace(EXTENSION, "")
//       );

//     console.log(
//       `Found ${available.length} available`
//     );

//     saveAvailable(available);

//     // 💾 Save progress after every batch
//     saveProgress(i + 50);

//     await sleep(DELAY_MS);

//     // ⏱ Stop before GitHub timeout
//     if (Date.now() - startTime > MAX_RUNTIME_MS) {

//       console.log("Stopping early to avoid timeout...");

//       saveProgress(i + 50);

//       return;
//     }
//   }

//   console.log("All words processed 🎉");

//   // Reset progress when completed
//   saveProgress(0);
// }

// main();

const fs = require("fs");
const axios = require("axios");

// 🔑 Credentials (GitHub Secrets)
const USERNAME = process.env.NAMECOM_USERNAME;
const TOKEN = process.env.NAMECOM_API_TOKEN;

// ⚙️ Settings
const EXTENSION = ".com";
const DELAY_MS = 1000;

// ⏱ GitHub Actions safety timeout
const MAX_RUNTIME_MS = 5.5 * 60 * 60 * 1000;

// 📂 Word files
const WORDS_FILES = [
  "words1.txt",
  "words2.txt"
];

// 📄 Output files
const OUTPUT_FILE =
  `available-${EXTENSION.replace(".", "")}.txt`;

const PROGRESS_FILE = "progress.txt";

const startTime = Date.now();

// 📍 Load progress
function loadProgress() {

  if (!fs.existsSync(PROGRESS_FILE)) {
    return 0;
  }

  const value = fs.readFileSync(
    PROGRESS_FILE,
    "utf-8"
  ).trim();

  return parseInt(value || "0");
}

// 💾 Save progress
function saveProgress(index) {

  fs.writeFileSync(
    PROGRESS_FILE,
    String(index)
  );
}

// 🌐 API call
async function checkBatch(batch) {

  try {

    const res = await axios.post(
      "https://api.name.com/v4/domains:checkAvailability",
      {
        domainNames: batch
      },
      {
        auth: {
          username: USERNAME,
          password: TOKEN
        },
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    return res.data.results || [];

  } catch (err) {

    if (err.response) {

      console.log(
        `API Error ${err.response.status}`
      );

    } else {

      console.log(
        `API Error: ${err.message}`
      );
    }

    return [];
  }
}

// 💾 Save available domains
function saveAvailable(domains) {

  if (!domains.length) return;

  fs.appendFileSync(
    OUTPUT_FILE,
    domains.join("\n") + "\n"
  );
}

// ⏳ Delay
function sleep(ms) {

  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

// 📂 Load all words
function loadWords() {

  let words = [];

  for (const file of WORDS_FILES) {

    if (!fs.existsSync(file)) {

      console.log(`${file} not found`);
      continue;
    }

    console.log(`Loading ${file}...`);

    const fileWords = fs.readFileSync(
      file,
      "utf-8"
    )
      .split("\n")
      .map(w => w.trim())
      .filter(Boolean);

    console.log(
      `${file}: ${fileWords.length} words`
    );

    // ✅ Safe append
    for (const word of fileWords) {
      words.push(word);
    }
  }

  return words;
}

// 🚀 Main
async function main() {

  const words = loadWords();

  if (!words.length) {

    console.log("No words loaded");
    return;
  }

  const startIndex = loadProgress();

  console.log(
    `Loaded ${words.length} words`
  );

  console.log(
    `Resuming from index ${startIndex}`
  );

  for (
    let i = startIndex;
    i < words.length;
    i += 50
  ) {

    const batch = words
      .slice(i, i + 50)
      .map(w => w + EXTENSION);

    console.log(
      `Checking ${i} → ${Math.min(
        i + 50,
        words.length
      )}`
    );

    const results =
      await checkBatch(batch);

    const available = results
      .filter(r =>
        r.purchasable &&
        !r.premium
      )
      .map(r =>
        r.domainName.replace(
          EXTENSION,
          ""
        )
      );

    console.log(
      `Found ${available.length} available`
    );

    saveAvailable(available);

    // 💾 Save progress
    saveProgress(i + 50);

    // ⏳ Delay
    await sleep(DELAY_MS);

    // ⏱ Stop before GitHub timeout
    if (
      Date.now() - startTime >
      MAX_RUNTIME_MS
    ) {

      console.log(
        "Stopping early to avoid timeout..."
      );

      saveProgress(i + 50);

      return;
    }
  }

  console.log(
    "All words processed 🎉"
  );

  // 🔄 Reset progress
  saveProgress(0);
}

main();
