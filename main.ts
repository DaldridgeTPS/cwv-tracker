// Load environment variables from .env file
import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";
await load({ export: true });

const API_KEY = Deno.env.get("API_KEY");
console.log("🔑 API Key present:", API_KEY ? "Yes" : "No");
console.log("🔑 API Key length:", API_KEY?.length || 0);

const SITES = {
  uk: {
    homepage: [
      "https://www.theperfumeshop.com/",
    ],
    category: [
      "https://www.theperfumeshop.com/womens/c/C101",
      "https://www.theperfumeshop.com/mens/c/C102",
      "https://www.theperfumeshop.com/offers/all-offers/fragrance-offers/c/W30050",
    ],
    pdp: [
      "https://www.theperfumeshop.com/carolina-herrera/good-girl/eau-de-parfum-spray/p/23940EDPJU",
      "https://www.theperfumeshop.com/dior/sauvage/eau-de-parfum-spray/p/65330EDPJU",
      "https://www.theperfumeshop.com/yves-saint-laurent/libre/eau-de-parfum-spray/p/34300EDPJU",
      "https://www.theperfumeshop.com/hugo-boss/boss-bottled-night/eau-de-toilette-spray/p/75290EDTJU",
      "https://www.theperfumeshop.com/chanel/coco-mademoiselle/eau-de-parfum-spray/p/15350EDPJU",
      "https://www.theperfumeshop.com/chanel/bleu-de-chanel/eau-de-parfum-spray/p/64060EDPJU",
      "https://www.theperfumeshop.com/dior/miss-dior/eau-de-parfum-spray/p/17800EDPJU",
      "https://www.theperfumeshop.com/prada/paradoxe/eau-de-parfum-refillable-spray/p/31740EDPJU",
      "https://www.theperfumeshop.com/tom-ford/black-orchid/eau-de-parfum-spray/p/27600EDPJU",
      "https://www.theperfumeshop.com/dior/sauvage/eau-de-toilette-spray/p/65330EDTJU",
    ],
  },
  ie: {
    homepage: [
      "https://www.theperfumeshop.com/ie",
    ],
    category: [
      "https://www.theperfumeshop.com/ie/womens/c/C101",
      "https://www.theperfumeshop.com/ie/mens/c/C102",
      "https://www.theperfumeshop.com/ie/offers/all-offers/fragrance-offers/c/W30050",
    ],
    pdp: [
      "https://www.theperfumeshop.com/ie/carolina-herrera/good-girl/eau-de-parfum-spray/p/23940EDPJU",
      "https://www.theperfumeshop.com/ie/dior/sauvage/eau-de-parfum-spray/p/65330EDPJU",
      "https://www.theperfumeshop.com/ie/yves-saint-laurent/libre/eau-de-parfum-spray/p/34300EDPJU",
      "https://www.theperfumeshop.com/ie/hugo-boss/boss-bottled-night/eau-de-toilette-spray/p/75290EDTJU",
      "https://www.theperfumeshop.com/ie/chanel/coco-mademoiselle/eau-de-parfum-spray/p/15350EDPJU",
      "https://www.theperfumeshop.com/ie/chanel/bleu-de-chanel/eau-de-parfum-spray/p/64060EDPJU",
      "https://www.theperfumeshop.com/ie/dior/miss-dior/eau-de-parfum-spray/p/17800EDPJU",
      "https://www.theperfumeshop.com/ie/prada/paradoxe/eau-de-parfum-refillable-spray/p/31740EDPJU",
      "https://www.theperfumeshop.com/ie/tom-ford/black-orchid/eau-de-parfum-spray/p/27600EDPJU",
      "https://www.theperfumeshop.com/ie/dior/sauvage/eau-de-toilette-spray/p/65330EDTJU",
    ],
  },
};

const LOG_FILE = "cwv-log-v3.json";
let allResults: any[] = [];

// Step 1️⃣ Try to read existing log
try {
  const existing = await Deno.readTextFile(LOG_FILE);
  allResults = JSON.parse(existing);
  console.log(`🗂 Found existing log file with ${allResults.length} entries.`);
} catch (_e) {
  console.log(`🆕 No existing log file found. Will create a new one.`);
}

async function fetchVitals(url: string, site: string, pageType: string) {
  console.log(`\n🔄 Starting to process: ${url}`);
  const startTime = Date.now();

  const results = [];

  // Fetch both mobile and desktop data
  for (const strategy of ["mobile", "desktop"]) {
    const apiUrl =
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${
        encodeURIComponent(url)
      }&category=performance&strategy=${strategy}&key=${API_KEY}`;

    try {
      console.log(`📡 Fetching ${strategy} data from PageSpeed API...`);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error(
          `❌ Error fetching ${strategy} data for ${url}:`,
          response.statusText,
        );
        continue;
      }

      console.log(`📥 Processing ${strategy} response data...`);
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
        site,
        pageType,
        strategy,
        field: fieldMetrics,
      };

      results.push(result);
    } catch (error) {
      console.error(`❌ Error fetching ${strategy} data for ${url}:`, error);
    }
  }

  const endTime = Date.now();
  console.log(
    `✅ Completed processing ${url} in ${(endTime - startTime) / 1000} seconds`,
  );
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Process all URLs for all sites
const batchTimestamp = new Date().toISOString();
console.log(`🚀 Starting to process URLs...`);

for (const [site, categories] of Object.entries(SITES)) {
  console.log(`\n📊 Processing ${site.toUpperCase()} site...`);

  for (const [pageType, urls] of Object.entries(categories)) {
    console.log(`\n📑 Processing ${pageType} pages...`);

    for (const url of urls) {
      const results = await fetchVitals(url, site, pageType);
      if (results) {
        // Use the batch timestamp for all results
        results.forEach((result) => {
          result.timestamp = batchTimestamp;
          allResults.push(result);
        });
      }
    }
  }
}

// Step 3️⃣ Write all results back to the log file
await Deno.writeTextFile(LOG_FILE, JSON.stringify(allResults, null, 2));
console.log(`📝 Updated ${LOG_FILE} with ${allResults.length} total entries.`);

console.log(`✨ All URLs processed!`);
