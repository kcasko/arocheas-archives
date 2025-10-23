// This is the complete, correct code for:
// functions/api/items.js

export async function onRequestGet(context) {
  
  // Get secrets from Cloudflare Pages settings
  const { env } = context;
  
  // These variable names MUST match your Cloudflare settings
  const API_KEY = env.AIRTABLE_API_KEY; 
  const BASE_ID = env.AIRTABLE_BASE_ID;
  
  // This MUST match your Airtable table name (it's case-sensitive)
  const TABLE_NAME = "3. Items"; 

  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

  try {
    const res = await fetch(url, {
      headers: {
        // This line sends your key to Airtable
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    // Check if Airtable sent an error
    if (!res.ok) {
       const errorData = await res.json();
       throw new Error(errorData.error?.message || res.statusText);
    }
    
    // Pass the good data (res.body) from Airtable to your website
    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    // This will catch any error (like a wrong key) 
    // and send it to your browser
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }
}