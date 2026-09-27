import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { corsHeaders, error, getDeviceId, json } from "../lib/http.js";

const MAX_BYTES = 2 * 1024 * 1024;

// Photos are resized to JPEG on the device before upload, so everything stored here is image/jpeg.
export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const store = getStore("photos");

  if (req.method === "GET") {
    const key = context.params.key;
    if (!key) return error("Missing key", 404);
    const data = await store.get(key, { type: "arrayBuffer" });
    if (!data) return error("Not found", 404);
    return new Response(data, {
      headers: { ...corsHeaders, "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }

  if (req.method === "POST") {
    const deviceId = getDeviceId(req);
    if (!deviceId) return error("Missing device ID", 401);
    const buf = await req.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return error("Photo must be under 2 MB");
    const key = `${deviceId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await store.set(key, buf);
    return json({ key }, 201);
  }

  return error("Method not allowed", 405);
};

export const config: Config = { path: ["/api/photos", "/api/photos/:key"] };
