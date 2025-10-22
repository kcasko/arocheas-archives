export async function onRequestGet(context) {
  const token = context.env.AIRTABLE_TOKEN;
  const baseId = "appGLH5ssrexQKhX2";
  const tableName = "Games"; // ✅ matches your Airtable table name exactly

  // ✅ Updated field names
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?fields[]=2.%20Packs&fields[]=3.%20Items`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await res.json();

    // ✅ Build the output using the correct fields
    const packs = data.records.map(record => ({
      name: record.fields["2. Packs"] || "Unnamed Pack",
      items: record.fields["3. Items"]
        ? record.fields["3. Items"].split(",").map(i => i.trim())
        : []
    }));

    return new Response(JSON.stringify({ packs }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
