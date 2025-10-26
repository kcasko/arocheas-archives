// functions/api/search.js
export async function onRequestGet(context) {
  const { env, request } = context;
  const API_KEY = env.AIRTABLE_API_KEY;
  const BASE_ID = env.AIRTABLE_BASE_ID;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const TABLES = ["Games", "Packs", "Items"];
  const headers = { Authorization: `Bearer ${API_KEY}` };

  try {
    // 1️⃣ Normal search across all tables
    const tablePromises = TABLES.map(async (table) => {
      let fields;
      if (table === "Items") fields = ["Items", "Game", "Pack Name", "Categories", "Sub Categories"];
      else if (table === "Games") fields = ["Games"];
      else if (table === "Packs") fields = ["Packs"];

      const filterFormula = `OR(${fields
        .map((f) => `FIND(LOWER("${q}"), LOWER({${f}}))`)
        .join(",")})`;

      const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
        table
      )}?filterByFormula=${encodeURIComponent(filterFormula)}&pageSize=50`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`${table} fetch failed (${res.status})`);
      const data = await res.json();

      return data.records.map((r) => ({
        id: r.id,
        source: table,
        name: r.fields.Items || r.fields.Games || r.fields.Packs || "(Unnamed)",
        image: r.fields.Image?.[0]?.url || null,
        game: r.fields.Game || null,
        pack: r.fields["Pack Name"] || null,
        category: r.fields.Categories || null,
        subcategory: r.fields["Sub Categories"] || null,
      }));
    });

    const allResults = (await Promise.all(tablePromises)).flat();

    // 2️⃣ Identify any Pack or Game matches
    const matchedPacks = allResults
      .filter((r) => r.source === "Packs")
      .map((r) => r.name.toLowerCase());
    const matchedGames = allResults
      .filter((r) => r.source === "Games")
      .map((r) => r.name.toLowerCase());

    // 3️⃣ If a Pack/Game matched, fetch its related Items
    const linkedItemsPromises = [];

    if (matchedPacks.length > 0) {
      const packFilter = `OR(${matchedPacks
        .map((p) => `FIND(LOWER("${p}"), LOWER({Pack Name}))`)
        .join(",")})`;
      linkedItemsPromises.push(
        fetch(
          `https://api.airtable.com/v0/${BASE_ID}/Items?filterByFormula=${encodeURIComponent(
            packFilter
          )}`,
          { headers }
        )
          .then((r) => r.json())
          .then((d) =>
            d.records.map((r) => ({
              id: r.id,
              source: "Items",
              name: r.fields.Items,
              image: r.fields.Image?.[0]?.url || null,
              pack: r.fields["Pack Name"] || null,
              game: r.fields.Game || null,
              category: r.fields.Categories || null,
              subcategory: r.fields["Sub Categories"] || null,
            }))
          )
      );
    }

    if (matchedGames.length > 0) {
      const gameFilter = `OR(${matchedGames
        .map((g) => `FIND(LOWER("${g}"), LOWER({Game}))`)
        .join(",")})`;
      linkedItemsPromises.push(
        fetch(
          `https://api.airtable.com/v0/${BASE_ID}/Items?filterByFormula=${encodeURIComponent(
            gameFilter
          )}`,
          { headers }
        )
          .then((r) => r.json())
          .then((d) =>
            d.records.map((r) => ({
              id: r.id,
              source: "Items",
              name: r.fields.Items,
              image: r.fields.Image?.[0]?.url || null,
              pack: r.fields["Pack Name"] || null,
              game: r.fields.Game || null,
              category: r.fields.Categories || null,
              subcategory: r.fields["Sub Categories"] || null,
            }))
          )
      );
    }

    const linkedItems = (await Promise.all(linkedItemsPromises)).flat();

    // 4️⃣ Merge, remove duplicates, return all results
    const merged = [...allResults, ...linkedItems];
    const unique = Array.from(
      new Map(merged.map((obj) => [obj.id, obj])).values()
    );

    return new Response(JSON.stringify({ results: unique }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

// Allow CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
