CREATE TABLE "employment_sources" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"adapter_key" varchar(64) NOT NULL,
	"config" jsonb NOT NULL,
	"config_schema_version" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employment_sources_organization_adapter_unique" UNIQUE("organization_id","adapter_key"),
	CONSTRAINT "employment_sources_name_not_blank" CHECK (char_length("name") > 0),
	CONSTRAINT "employment_sources_name_trimmed" CHECK ("name" = btrim("name")),
	CONSTRAINT "employment_sources_adapter_key_allowed" CHECK ("adapter_key" in ('greenhouse')),
	CONSTRAINT "employment_sources_config_is_object" CHECK (jsonb_typeof("config") = 'object'),
	CONSTRAINT "employment_sources_config_schema_version_positive" CHECK ("config_schema_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "employment_sources" ADD CONSTRAINT "employment_sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
