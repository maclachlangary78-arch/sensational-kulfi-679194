CREATE TABLE "spreads" (
	"id" serial PRIMARY KEY,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"slots" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "spreads_device_idx" ON "spreads" ("device_id");