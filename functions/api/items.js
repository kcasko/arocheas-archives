// functions/api/items.js
export async function onRequestGet(context) {
  const { env, request } = context;
  const API_KEY = env.AIRTABLE_API_KEY;
  const BASE_ID = env.AIRTABLE_BASE_ID;
  const TABLE_NAME = "Items";

  try {
    // Get optional pagination offset
    const { searchParams } = new URL(request.url);
    const offset = searchParams.get("offset") || "";

    // Build Airtable API URL
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
      TABLE_NAME
    )}?fields[]=Items&fields[]=Image&fields[]=Categories&fields[]=Sub%20Categories&view=Grid%20view${
      offset ? `&offset=${offset}` : ""
    }`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || res.statusText);
    }

    const data = await res.json();

    // Return full Airtable data with CORS + caching
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300", // 5 minutes cache
      },
    });
  } catch (err) {
    // Return structured error
    return new Response(
      JSON.stringify({
        ok: false,
        message: err.message,
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

// Handle preflight CORS requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400", // Cache preflight 24h
    },
  });
}
