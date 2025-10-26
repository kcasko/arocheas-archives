// functions/api/all.js
export async function onRequestGet(context) {
  const { env } = context;
  const API_KEY = env.AIRTABLE_API_KEY;
  const BASE_ID = env.AIRTABLE_BASE_ID;

  // Define all your table names here
  const TABLES = ["Games", "Packs", "Items", "Categories", "Sub Categories"];

  try {
    // Build all Airtable fetch requests at once
    const fetchPromises = TABLES.map(async (table) => {
      const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
        table
      )}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          `Error fetching ${table}: ${errData.error?.message || res.statusText}`
        );
      }

      const data = await res.json();
      return { [table]: data.records || [] };
    });

    // Resolve all tables in parallel
    const results = await Promise.all(fetchPromises);

    // Merge into one combined object
    const combinedData = results.reduce((acc, tableObj) => {
      return { ...acc, ...tableObj };
    }, {});

    // Return unified JSON response
    return new Response(JSON.stringify(combinedData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=600", // cache 10 min
      },
    });
  } catch (error) {
    // Structured error handling
    return new Response(
      JSON.stringify({
        ok: false,
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400", // cache preflight 24h
    },
  });
}
