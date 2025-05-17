CREATE TABLE "blocked_ips" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_address" text NOT NULL,
	"blocked_at" timestamp DEFAULT now() NOT NULL,
	"reason" text,
	CONSTRAINT "blocked_ips_ip_address_unique" UNIQUE("ip_address")
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"signature" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_ip" text,
	"creator_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upvotes" (
	"id" serial NOT NULL,
	"gallery_item_id" integer NOT NULL,
	"voter_ip" text NOT NULL,
	"voter_id" text NOT NULL,
	"voted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "upvotes_gallery_item_id_voter_id_pk" PRIMARY KEY("gallery_item_id","voter_id")
);
--> statement-breakpoint
ALTER TABLE "upvotes" ADD CONSTRAINT "upvotes_gallery_item_id_gallery_items_id_fk" FOREIGN KEY ("gallery_item_id") REFERENCES "public"."gallery_items"("id") ON DELETE cascade ON UPDATE no action;