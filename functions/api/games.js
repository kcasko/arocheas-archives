// functions/api/games.js
export async function onRequestGet(context) {
  const { env, request } = context;
  const API_KEY = env.AIRTABLE_API_KEY;
  const BASE_ID = env.AIRTABLE_BASE_ID;
  const TABLE_NAME = "Games";

  try {
    // Optional pagination
    const { searchParams } = new URL(request.url);
    const offset = searchParams.get("offset") || "";

    // Airtable API URL
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
      TABLE_NAME
    )}?${offset ? `offset=${offset}` : ""}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || res.statusText);
    }

    const data = await res.json();

    // Return full Airtable response with CORS + caching
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300", // cache 5 min
      },
    });
  } catch (error) {
    // Unified error handling
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
      "Access-Control-Max-Age": "86400", // 24h cache for preflight
    },
  });
}
