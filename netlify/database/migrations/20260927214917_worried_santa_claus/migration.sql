ALTER TABLE "strikes" ADD COLUMN IF NOT EXISTS "fish_species" text;--> statement-breakpoint
ALTER TABLE "strikes" ADD COLUMN IF NOT EXISTS "share_aggregate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "strikes_aggregate_idx" ON "strikes" ("share_aggregate");
