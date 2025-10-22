export async function onRequestGet(context) {
  const token = context.env.AIRTABLE_TOKEN;
  const baseId = "appGLH5ssrexQKhX2";
  const tableName = "1. Games";

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName
  )}?fields[]=2.%20Packs&fields[]=3.%20Items`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 👀 Show Airtable’s real status and message so we can debug
    const text = await res.text();

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        body: text
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ caught: true, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
