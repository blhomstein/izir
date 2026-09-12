CREATE TYPE "organization_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"status" "organization_status" DEFAULT 'active'::"organization_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_name_not_blank" CHECK (char_length("name") > 0),
	CONSTRAINT "organizations_name_trimmed" CHECK ("name" = btrim("name"))
);
