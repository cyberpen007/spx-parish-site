// netlify/functions/get-file.js
// Serves a file previously stored by upload.js.
// Reached via the /media/* redirect defined in netlify.toml.

import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response("Missing key", { status: 400 });
  }

  const store = getStore("church-media");
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });

  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(result.data, {
    headers: {
      "Content-Type": result.metadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
