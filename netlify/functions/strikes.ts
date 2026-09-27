import type { Config } from "@netlify/functions";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { lures, strikes } from "../../db/schema.js";
import { corsHeaders, error, getDeviceId, json, optText, OUTCOMES, POSITIONS } from "../lib/http.js";

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const deviceId = getDeviceId(req);
  if (!deviceId) return error("Missing device ID", 401);

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(strikes)
      .where(eq(strikes.deviceId, deviceId))
      .orderBy(desc(strikes.strikeDate), desc(strikes.id));
    return json(rows);
  }

  if (req.method === "POST") {
    const b = await req.json().catch(() => null);
    if (!b) return error("Invalid body");
    if (!POSITIONS.includes(b.position)) return error("Invalid position");
    if (!OUTCOMES.includes(b.outcome)) return error("Invalid outcome");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.strikeDate))) return error("Invalid date");

    const lureSize = optText(b.lureSize, 30);
    const hookType = optText(b.hookType, 60);
    const hookSize = hookType ? optText(b.hookSize, 10) : null;

    // Either an existing lure, or a name typed in by hand that gets added to the tackle box
    // (reusing a lure with the same name so offline retries don't create duplicates).
    let lure;
    const lureName = optText(b.lureName, 120);
    if (b.lureId) {
      [lure] = await db
        .select()
        .from(lures)
        .where(and(eq(lures.id, Number(b.lureId)), eq(lures.deviceId, deviceId)));
    } else if (lureName) {
      [lure] = await db
        .select()
        .from(lures)
        .where(and(eq(lures.deviceId, deviceId), sql`lower(${lures.name}) = lower(${lureName})`));
      if (!lure) {
        [lure] = await db
          .insert(lures)
          .values({ deviceId, name: lureName, defaultPosition: b.position, size: lureSize, hookSize, hookType })
          .returning();
      }
    }
    if (!lure) return error("Unknown lure", 404);

    const [row] = await db
      .insert(strikes)
      .values({
        deviceId,
        lureId: lure.id,
        position: b.position,
        outcome: b.outcome,
        strikeDate: b.strikeDate,
        location: String(b.location ?? "").slice(0, 160),
        latitude: num(b.latitude),
        longitude: num(b.longitude),
        tempC: num(b.tempC),
        depthM: num(b.depthM),
        tide: b.tide ? String(b.tide).slice(0, 30) : null,
        lureSize,
        hookSize,
        hookType,
        photoKey: b.photoKey ? String(b.photoKey).slice(0, 120) : null,
      })
      .returning();
    return json({ ...row, newLure: lureName && !b.lureId ? lure : undefined }, 201);
  }

  if (req.method === "DELETE") {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) return error("Missing id");
    await db.delete(strikes).where(and(eq(strikes.id, id), eq(strikes.deviceId, deviceId)));
    return json({ ok: true });
  }

  return error("Method not allowed", 405);
};

export const config: Config = { path: "/api/strikes" };
