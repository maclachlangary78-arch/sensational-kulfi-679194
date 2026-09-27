// CORS is required because the native iOS/Android builds load the app from
// capacitor://localhost (or https://localhost) and call this API cross-origin.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Device-Id",
};

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: corsHeaders });

export const error = (message: string, status = 400) => json({ error: message }, status);

export function getDeviceId(req: Request): string | null {
  const id = req.headers.get("x-device-id");
  return id && /^[a-zA-Z0-9-]{8,64}$/.test(id) ? id : null;
}

export const POSITIONS = ["Short Corner", "Long Corner", "Short Rigger", "Long Rigger", "Shotgun"];
export const OUTCOMES = ["landed", "lost"];

// Trimmed, length-capped string, or null when blank — used for optional fields like hooks and lure size.
export const optText = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s || null;
};
