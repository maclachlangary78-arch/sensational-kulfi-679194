ALTER TABLE "lures" ADD COLUMN "size" text;--> statement-breakpoint
ALTER TABLE "strikes" ADD COLUMN "lure_size" text;--> statement-breakpoint
ALTER TABLE "lures" ALTER COLUMN "hook_size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lures" ALTER COLUMN "hook_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "strikes" ALTER COLUMN "hook_size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "strikes" ALTER COLUMN "hook_type" DROP NOT NULL;