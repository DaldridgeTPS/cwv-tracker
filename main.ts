// track_web_vitals.ts

const API_KEY = "";
const URLS = [
  "https://www.theperfumeshop.com/",
  "https://www.theperfumeshop.com/womens/c/C101",
  "https://www.theperfumeshop.com/dior/sauvage/eau-de-toilette-spray/p/65330EDTJU?varSel=1166180",
];

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
      return;
    }

    console.log(`📥 Processing response data...`);
    const data = await response.json();

    // FIELD DATA (Chrome UX Report)
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
  } catch (error) {
    console.error(`❌ Error fetching data for ${url}:`, error);
  }
}

console.log(`🚀 Starting to process ${URLS.length} URLs...`);
for (const url of URLS) {
  await fetchVitals(url);
}
console.log(`✨ All URLs processed!`);
