const API_KEY = Deno.env.get("API_KEY");
const URLS = [
  "https://www.theperfumeshop.com/",
  "https://www.theperfumeshop.com/womens/c/C101",
  "https://www.theperfumeshop.com/dior/sauvage/eau-de-toilette-spray/p/65330EDTJU?varSel=1166180",
];

const LOG_FILE = "cwv-log.json";
let allResults: any[] = [];

// Step 1️⃣ Try to read existing log
try {
  const existing = await Deno.readTextFile(LOG_FILE);
  allResults = JSON.parse(existing);
  console.log(`🗂 Found existing log file with ${allResults.length} entries.`);
} catch (_e) {
  console.log(`🆕 No existing log file found. Will create a new one.`);
}

async function fetchVitals(url: string) {
  console.log(`\n🔄 Starting to process: ${url}`);
  const startTime = Date.now();

  const apiUrl =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${
      encodeURIComponent(url)
    }&category=performance&strategy=mobile&key=${API_KEY}`;

  try {
    console.log(`📡 Fetching data from PageSpeed API...`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`❌ Error fetching data for ${url}:`, response.statusText);
      return null;
    }

    console.log(`📥 Processing response data...`);
    const data = await response.json();

    const fieldExperience = data.loadingExperience?.metrics || {};
    const fieldMetrics: Record<string, any> = {};

    const metricMapping = {
      "LARGEST_CONTENTFUL_PAINT_MS": "LCP",
      "INTERACTION_TO_NEXT_PAINT": "INP",
      "CUMULATIVE_LAYOUT_SHIFT_SCORE": "CLS",
    };

    for (const [key, label] of Object.entries(metricMapping)) {
      if (fieldExperience[key]) {
        fieldMetrics[label] = {
          percentile: fieldExperience[key].percentile,
          category: fieldExperience[key].category,
          distributions: fieldExperience[key].distributions,
        };
      } else {
        fieldMetrics[label] = {
          error: "Field data not available",
        };
      }
    }

    const result = {
      timestamp: new Date().toISOString(),
      url,
      field: fieldMetrics,
    };

    const endTime = Date.now();
    console.log(
      `✅ Completed processing ${url} in ${
        (endTime - startTime) / 1000
      } seconds`,
    );
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error(`❌ Error fetching data for ${url}:`, error);
    return null;
  }
}

console.log(`🚀 Starting to process ${URLS.length} URLs...`);

for (const url of URLS) {
  const result = await fetchVitals(url);
  if (result) {
    allResults.push(result);
  }
}

// Step 3️⃣ Write all results back to the log file
await Deno.writeTextFile(LOG_FILE, JSON.stringify(allResults, null, 2));
console.log(`📝 Updated ${LOG_FILE} with ${allResults.length} total entries.`);

console.log(`✨ All URLs processed!`);
