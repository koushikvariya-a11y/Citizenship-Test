import * as fs from 'fs';

const urls = [
  "https://raw.githubusercontent.com/andreasger/Einbuergerungstest/master/app/src/main/assets/questions_de.json",
  "https://raw.githubusercontent.com/andreasger/Einbuergerungstest/main/app/src/main/assets/questions_de.json",
  "https://raw.githubusercontent.com/andreasger/Einbuergerungstest/master/questions_de.json",
  "https://raw.githubusercontent.com/andreasger/Einbuergerungstest/main/questions_de.json",
  "https://raw.githubusercontent.com/TarekK/einbuergerungstest-json/master/questions-de-en.json",
  "https://raw.githubusercontent.com/TarekK/einbuergerungstest-json/main/questions-de-en.json"
];

async function run() {
  for (const url of urls) {
    console.log(`Fetching: ${url}`);
    try {
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`Success! Length: ${text.length}. Writing to /downloaded.json`);
        fs.writeFileSync('downloaded.json', text);
        return;
      }
    } catch (e: any) {
      console.log(`Error: ${e.message}`);
    }
  }
  console.log("No URLs succeeded.");
}

run();
