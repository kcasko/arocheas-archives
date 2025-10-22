// This file is functions/items.js
// It will create an endpoint at: https://your-site.com/items

export async function onRequestGet(context) {
  // 1. Get your secrets from Cloudflare
  const { env } = context;
  const API_KEY = env.AIRTABLE_API_KEY;
  const BASE_ID = env.AIRTABLE_BASE_ID;
  
  // 2. Define your Airtable table
  const TABLE_NAME = "Items"; // Or whatever you named your table

  // 3. Build the Airtable API URL
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

  try {
    // 4. Fetch from Airtable, adding your secret key
    const res = await fetch(url, {
      headers: {
        // This is the critical part that secures your request
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      // If Airtable gives an error, pass it along
      throw new Error(data.error?.message || res.statusText);
    }

    // 5. Send just the records back to your frontend
    // We stringify data.records, not the whole 'data' object
    return new Response(JSON.stringify(data.records), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Allow your site to call this
      }
    });

  } catch (error) {
    // Catch any errors and send them as a JSON response
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }
}