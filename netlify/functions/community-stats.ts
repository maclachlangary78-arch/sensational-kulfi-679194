import type { Config } from "@netlify/functions";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { lures, strikes } from "../../db/schema.js";
import { corsHeaders, error, getDeviceId, json } from "../lib/http.js";

// Community results are deliberately coarse and require a minimum sample size.
// Exact coordinates and device IDs are never returned.
export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return error("Method not allowed", 405);
  if (!getDeviceId(req)) return error("Missing device ID", 401);

  const species = new URL(req.url).searchParams.get("species");
  const rows = await db.select({
    species: strikes.fishSpecies,
    lure: lures.name,
    size: strikes.lureSize,
    position: strikes.position,
    location: strikes.location,
    attempts: sql<number>`count(*)`,
    landed: sql<number>`sum(case when ${strikes.outcome} = 'landed' then 1 else 0 end)`,
  }).from(strikes).innerJoin(lures, eq(strikes.lureId, lures.id))
    .where(species ? sql`${strikes.shareAggregate} = true and ${strikes.fishSpecies} = ${species}` : sql`${strikes.shareAggregate} = true`)
    .groupBy(strikes.fishSpecies, lures.name, strikes.lureSize, strikes.position, strikes.location)
    .having(sql`count(*) >= 5`)
    .orderBy(sql`sum(case when ${strikes.outcome} = 'landed' then 1 else 0 end)::float / count(*) desc`)
    .limit(100);

  return json(rows.map((r) => ({ ...r, successRate: Number(r.attempts) ? Math.round((Number(r.landed) / Number(r.attempts)) * 1000) / 10 : 0 })));
};
export const config: Config = { path: "/api/community-stats" };
