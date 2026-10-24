CREATE TABLE "idea_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_id" integer NOT NULL,
	"to_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "idea_links" ADD CONSTRAINT "idea_links_from_id_ideas_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_links" ADD CONSTRAINT "idea_links_to_id_ideas_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idea_links_pair_idx" ON "idea_links" USING btree ("from_id","to_id");--> statement-breakpoint
CREATE INDEX "idea_links_from_idx" ON "idea_links" USING btree ("from_id");