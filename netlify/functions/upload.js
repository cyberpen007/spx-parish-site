// netlify/functions/upload.js
// Receives { filename, contentType, dataBase64 } and stores the file in Netlify Blobs.
// Returns { key, url } where url is a public path served by get-file.js.

import { getStore } from "@netlify/blobs";

const MAX_BYTES = 4.5 * 1024 * 1024; // ~4.5MB original file (Netlify Functions request cap is ~6MB, base64 adds ~33%)

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { filename, contentType, dataBase64 } = await req.json();

    if (!filename || !dataBase64) {
      return new Response(JSON.stringify({ error: "Missing filename or file data" }), { status: 400 });
    }

    const buffer = Buffer.from(dataBase64, "base64");
    if (buffer.byteLength > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "File too large. Please keep uploads under 4.5MB." }),
        { status: 413 }
      );
    }

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const key = `${Date.now()}-${safeName}`;

    const store = getStore("church-media");
    await store.set(key, buffer, {
      metadata: { contentType: contentType || "application/octet-stream" },
    });

    return new Response(
      JSON.stringify({ key, url: `/media/${key}` }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 });
  }
};
