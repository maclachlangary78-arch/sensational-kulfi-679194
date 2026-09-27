import type { Config } from "@netlify/functions";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { lures } from "../../db/schema.js";
import { corsHeaders, error, getDeviceId, json, optText, POSITIONS } from "../lib/http.js";

// Starter tackle box so a fresh install has something to log against.
const STARTER_LURES = [
  { name: "Pakula Sprocket - Lumo", defaultPosition: "Long Rigger", size: "310mm", hookSize: "25", hookType: "Pakula Dojo Light" },
  { name: "JB Dingo - Black/Purple", defaultPosition: "Short Rigger", size: '10"', hookSize: "9/0", hookType: "Mustad 7691S Southern & Tuna" },
  { name: "Bonze Rambo - Pink/White", defaultPosition: "Short Corner", size: '10"', hookSize: "9/0", hookType: "Owner Jobu" },
  { name: "Tantrum Plunger - Blue/White", defaultPosition: "Long Corner", size: "Medium", hookSize: "10/0", hookType: "BKK Kajiki HD" },
  { name: "JB Dingo - Lumo", defaultPosition: "Shotgun", size: '8"', hookSize: "30", hookType: "Pakula Dojo X Strong" },
];

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const deviceId = getDeviceId(req);
  if (!deviceId) return error("Missing device ID", 401);

  if (req.method === "GET") {
    let rows = await db.select().from(lures).where(eq(lures.deviceId, deviceId)).orderBy(asc(lures.id));
    if (rows.length === 0) {
      rows = await db
        .insert(lures)
        .values(STARTER_LURES.map((l) => ({ ...l, deviceId })))
        .returning();
    }
    return json(rows);
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim().slice(0, 120);
    const defaultPosition = POSITIONS.includes(body?.defaultPosition) ? body.defaultPosition : "Short Corner";
    if (!name) return error("Lure name is required");
    const size = optText(body?.size, 30);
    if (!size) return error("Lure size is required");
    // Lures are added automatically from the log and the spread, so the same name is reused rather than
    // duplicated (filling in its size if it never had one).
    const [existing] = await db
      .select()
      .from(lures)
      .where(and(eq(lures.deviceId, deviceId), sql`lower(${lures.name}) = lower(${name})`));
    if (existing) {
      if (existing.size) return json(existing);
      const [updated] = await db.update(lures).set({ size }).where(eq(lures.id, existing.id)).returning();
      return json(updated);
    }
    const [row] = await db
      .insert(lures)
      .values({
        deviceId,
        name,
        defaultPosition,
        size,
        hookSize: optText(body?.hookSize, 10),
        hookType: optText(body?.hookType, 60),
        photoKey: body?.photoKey ?? null,
      })
      .returning();
    return json(row, 201);
  }

  if (req.method === "DELETE") {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) return error("Missing id");
    await db.delete(lures).where(and(eq(lures.id, id), eq(lures.deviceId, deviceId)));
    return json({ ok: true });
  }

  return error("Method not allowed", 405);
};

export const config: Config = { path: "/api/lures" };
