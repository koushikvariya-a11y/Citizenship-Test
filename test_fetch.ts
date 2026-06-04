async function run() {
  const repos = [
    "https://github.com/andir/einbuergerungstest",
    "https://github.com/m-reza-k/einbuergerungstest-json",
    "https://github.com/m-reza-k/einburgertest-json"
  ];
  for (const url of repos) {
    console.log(`Fetching homepage of repository: ${url}`);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response length: ${text.length}`);
      if (text.includes(".json")) {
        const matches = text.match(/[a-zA-Z0-9_\-\.\/]+\.json/g);
        if (matches) {
          console.log(`JSON matches in ${url}:`, Array.from(new Set(matches)).slice(0, 5));
        }
      }
    } catch (e: any) {
      console.log("Error:", e.message);
    }
  }
}
run();

