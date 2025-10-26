// functions/api/search.js
export async function onRequestGet(context) {
  const { env, request } = context;
  const API_KEY = env.AIRTABLE_API_KEY;
  const BASE_ID = env.AIRTABLE_BASE_ID;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const TABLES = ["Games", "Packs", "Items"];
  const headers = { Authorization: `Bearer ${API_KEY}` };

  try {
    // Primary search across Airtable tables
    const results = await Promise.all(
      TABLES.map(async (table) => {
        let fields;
        if (table === "Items") {
          fields = ["Items", "Game", "Pack Name", "Categories", "Sub Categories"];
        } else if (table === "Games") {
          fields = ["Games"];
        } else if (table === "Packs") {
          fields = ["Packs"];
        }

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
          name:
            r.fields.Items ||
            r.fields.Games ||
            r.fields.Packs ||
            "(Unnamed)",
          image: r.fields.Image?.[0]?.url || null,
          game: r.fields.Game || null,
          pack: r.fields["Pack Name"] || null,
          category: r.fields.Categories || null,
          subcategory: r.fields["Sub Categories"] || null,
        }));
      })
    );

    let flatResults = results.flat();

    // 🪄 Fuzzy fallback if nothing matched
    if (flatResults.length === 0) {
      const fallbackResults = await Promise.all(
        TABLES.map(async (table) => {
          const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}?pageSize=100`;
          const res = await fetch(url, { headers });
          const data = await res.json();
          return data.records.map((r) => ({
            id: r.id,
            source: table,
            name:
              r.fields.Items ||
              r.fields.Games ||
              r.fields.Packs ||
              "(Unnamed)",
            image: r.fields.Image?.[0]?.url || null,
            game: r.fields.Game || null,
            pack: r.fields["Pack Name"] || null,
            category: r.fields.Categories || null,
            subcategory: r.fields["Sub Categories"] || null,
          }));
        })
      );

      // 🧠 Fuzzy filter with safe text handling
      flatResults = fuzzyFilter(fallbackResults.flat(), q);
    }

    return new Response(JSON.stringify({ results: flatResults }), {
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

// ------------------------------------------------------------
// 🪄 Fuzzy-match helper (safe against null/undefined)
// ------------------------------------------------------------
function fuzzyFilter(items, query) {
  const normalized = query.toLowerCase();
  const scored = items
    .map((item) => {
      const name =
        typeof item.name === "string" ? item.name.toLowerCase() : "";
      const distance = levenshtein(normalized, name);
      const maxLen = Math.max(normalized.length, name.length || 1);
      const score = name ? 1 - distance / maxLen : 0;
      return { item, score };
    })
    .filter(({ score }) => score > 0.4) // include close-enough matches
    .sort((a, b) => b.score - a.score);

  return scored.map(({ item }) => item);
}

// 🧮 Levenshtein distance algorithm
function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

// ------------------------------------------------------------
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
