export async function onRequestGet(context) {
  const token = context.env.AIRTABLE_TOKEN;
  const baseId = "appGLH5ssrexQKhX2";
  const tableName = "Games";

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?fields[]=Packs&fields[]=Items%20listed`;

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

    const packs = data.records.map(record => ({
      name: record.fields.Packs || "Unnamed Pack",
      items: record.fields["Items listed"]
        ? record.fields["Items listed"].split(",").map(i => i.trim())
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
