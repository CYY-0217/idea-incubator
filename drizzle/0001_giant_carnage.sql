CREATE TABLE "panel_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"origin" "version_origin" DEFAULT 'zcode' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "panel_reviews" ADD CONSTRAINT "panel_reviews_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "panel_reviews_idea_idx" ON "panel_reviews" USING btree ("idea_id");