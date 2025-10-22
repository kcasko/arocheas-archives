export async function onRequestGet(context) {
  const token = context.env.AIRTABLE_TOKEN;
  const baseId = "appGLH5ssrexQKhX2";
  const tableName = "Games"; // ✅ renamed table

  const url = `https://api.airtable.com/v0/${baseId}/${tableName}?maxRecords=3&view=Grid%20view`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          body: text,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const packs = data.records.map((record) => ({
      name: record.fields["Packs"] || "Unnamed Pack",
      items: record.fields["Items"]
        ? record.fields["Items"].split(",").map((i) => i.trim())
        : [],
    }));

    return new Response(JSON.stringify({ packs }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ caught: true, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
