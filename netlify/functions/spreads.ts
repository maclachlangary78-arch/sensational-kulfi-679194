import type { Config } from "@netlify/functions";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { spreads } from "../../db/schema.js";
import { corsHeaders, error, getDeviceId, json, optText, POSITIONS } from "../lib/http.js";

// Keeps only the fields a spread line needs, so whatever the client sends can't bloat the row.
function cleanSlots(value: unknown) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((s) => s && POSITIONS.includes(s.position))
    .slice(0, 20)
    .map((s) => ({
      position: s.position,
      lureId: Number(s.lureId) || null,
      customName: optText(s.customName, 120),
      lureSize: optText(s.lureSize, 30),
      hookType: optText(s.hookType, 60),
      hookSize: optText(s.hookSize, 10),
    }));
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const deviceId = getDeviceId(req);
  if (!deviceId) return error("Missing device ID", 401);

  if (req.method === "GET") {
    const rows = await db.select().from(spreads).where(eq(spreads.deviceId, deviceId)).orderBy(desc(spreads.updatedAt));
    return json(rows);
  }

  // Saving under a name that already exists replaces that spread.
  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    const name = optText(body?.name, 60);
    const slots = cleanSlots(body?.slots);
    if (!name) return error("Give the spread a name");
    if (!slots?.length) return error("The spread has no lines");
    const [existing] = await db
      .select()
      .from(spreads)
      .where(and(eq(spreads.deviceId, deviceId), sql`lower(${spreads.name}) = lower(${name})`));
    if (existing) {
      const [row] = await db
        .update(spreads)
        .set({ name, slots, updatedAt: new Date() })
        .where(eq(spreads.id, existing.id))
        .returning();
      return json(row);
    }
    const [row] = await db.insert(spreads).values({ deviceId, name, slots }).returning();
    return json(row, 201);
  }

  if (req.method === "DELETE") {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) return error("Missing id");
    await db.delete(spreads).where(and(eq(spreads.id, id), eq(spreads.deviceId, deviceId)));
    return json({ ok: true });
  }

  return error("Method not allowed", 405);
};

export const config: Config = { path: "/api/spreads" };
