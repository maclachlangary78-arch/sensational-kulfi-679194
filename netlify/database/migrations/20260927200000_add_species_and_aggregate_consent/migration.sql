ALTER TABLE "strikes" ADD COLUMN "fish_species" text;
ALTER TABLE "strikes" ADD COLUMN "share_aggregate" boolean NOT NULL DEFAULT false;
CREATE INDEX "strikes_aggregate_idx" ON "strikes" USING btree ("share_aggregate");
