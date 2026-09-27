// CORS is required because native builds load the app from capacitor://localhost.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Device-Id",
};
export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: corsHeaders });
export const error = (message: string, status = 400) => json({ error: message }, status);
export function getDeviceId(req: Request): string | null {
  const id = req.headers.get("x-device-id");
  return id && /^[a-zA-Z0-9-]{8,64}$/.test(id) ? id : null;
}
export const POSITIONS = ["Short Corner", "Long Corner", "Short Rigger", "Long Rigger", "Shotgun"];
export const OUTCOMES = ["landed", "lost"];
export const optText = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s || null;
};
