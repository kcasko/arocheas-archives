export async function onRequestGet(context) {
  const url = "https://arocheas-archives-api.kristi-casko.workers.dev/api/items";

  try {
    const res = await fetch(url);
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
  } catch (error) {
    return new Response(JSON.stringify({ caught: true, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
