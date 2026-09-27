CREATE TABLE "lures" (
	"id" serial PRIMARY KEY,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"default_position" text NOT NULL,
	"hook_size" text NOT NULL,
	"hook_type" text NOT NULL,
	"photo_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strikes" (
	"id" serial PRIMARY KEY,
	"device_id" text NOT NULL,
	"lure_id" integer NOT NULL,
	"position" text NOT NULL,
	"outcome" text NOT NULL,
	"strike_date" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"latitude" real,
	"longitude" real,
	"temp_c" real,
	"depth_m" real,
	"tide" text,
	"hook_size" text NOT NULL,
	"hook_type" text NOT NULL,
	"photo_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "lures_device_idx" ON "lures" ("device_id");--> statement-breakpoint
CREATE INDEX "strikes_device_idx" ON "strikes" ("device_id");--> statement-breakpoint
ALTER TABLE "strikes" ADD CONSTRAINT "strikes_lure_id_lures_id_fkey" FOREIGN KEY ("lure_id") REFERENCES "lures"("id") ON DELETE CASCADE;