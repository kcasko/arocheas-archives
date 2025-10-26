// functions/api/search.js
export async function onRequestGet(context) {
  const { env, request } = context;
  const API_KEY = env.AIRTABLE_API_KEY;
  const BASE_ID = env.AIRTABLE_BASE_ID;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const TABLES = ["Games", "Packs", "Items"];
  const headers = { Authorization: `Bearer ${API_KEY}` };

  try {
    const results = await Promise.all(
      TABLES.map(async (table) => {
        const fields = table === "Items"
          ? ["Items", "Image", "Categories", "Sub Categories"]
          : [table];
        const filterFormula = `OR(${fields
          .map(f => `SEARCH(LOWER("${q}"), LOWER({${f}}))`)
          .join(",")})`;

        const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
          table
        )}?filterByFormula=${encodeURIComponent(filterFormula)}`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`${table} fetch failed (${res.status})`);
        const data = await res.json();

        return data.records.map(r => ({
          id: r.id,
          source: table,
          name:
            r.fields[table] ||
            r.fields.Items ||
            "(Unnamed)",
          image: r.fields.Image?.[0]?.url || null,
          category: r.fields.Categories || null,
          subcategory: r.fields["Sub Categories"] || null,
        }));
      })
    );

    return new Response(JSON.stringify({ results: results.flat() }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
