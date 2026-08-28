CREATE TYPE "public"."diagnosis_source" AS ENUM('ai', 'fallback');--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "diagnosis_source" "diagnosis_source";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "ai_diagnosis" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "ai_roadmap" jsonb;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "ai_model" varchar(100);
