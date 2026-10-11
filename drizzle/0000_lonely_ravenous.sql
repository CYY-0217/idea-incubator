CREATE TYPE "public"."idea_source" AS ENUM('keyword', 'text', 'paste', 'screenshot');--> statement-breakpoint
CREATE TYPE "public"."idea_status" AS ENUM('seed', 'shaping', 'proving', 'paused', 'shipped');--> statement-breakpoint
CREATE TYPE "public"."version_origin" AS ENUM('zcode', 'deepseek', 'manual');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"file_path" text NOT NULL,
	"kind" text DEFAULT 'screenshot' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "followups" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_tags" (
	"idea_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"v_no" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"origin" "version_origin" DEFAULT 'zcode' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"raw_text" text NOT NULL,
	"source" "idea_source" DEFAULT 'text' NOT NULL,
	"status" "idea_status" DEFAULT 'seed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followups" ADD CONSTRAINT "followups_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_tags" ADD CONSTRAINT "idea_tags_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_tags" ADD CONSTRAINT "idea_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_versions" ADD CONSTRAINT "idea_versions_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_idea_idx" ON "attachments" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "followups_idea_idx" ON "followups" USING btree ("idea_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idea_tags_idea_tag_idx" ON "idea_tags" USING btree ("idea_id","tag_id");--> statement-breakpoint
CREATE INDEX "idea_tags_tag_idx" ON "idea_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idea_versions_idea_vno_idx" ON "idea_versions" USING btree ("idea_id","v_no");--> statement-breakpoint
CREATE INDEX "ideas_status_idx" ON "ideas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ideas_updated_at_idx" ON "ideas" USING btree ("updated_at");