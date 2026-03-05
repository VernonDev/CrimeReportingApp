DO $$ BEGIN
 CREATE TYPE "public"."flag_status" AS ENUM('pending', 'reviewed', 'dismissed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_status" AS ENUM('pending', 'verified', 'flagged', 'rejected', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crime_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"severity" integer NOT NULL,
	"icon" varchar(50),
	"color" varchar(7) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crime_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crime_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer,
	"category_id" integer NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"address" text,
	"neighborhood" varchar(255),
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"incident_date" timestamp NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"photo_paths" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"verified_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"flagger_id" integer,
	"reason" varchar(255) NOT NULL,
	"details" text,
	"status" "flag_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crime_reports" ADD CONSTRAINT "crime_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crime_reports" ADD CONSTRAINT "crime_reports_category_id_crime_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."crime_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crime_reports" ADD CONSTRAINT "crime_reports_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_flags" ADD CONSTRAINT "report_flags_report_id_crime_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."crime_reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_flags" ADD CONSTRAINT "report_flags_flagger_id_users_id_fk" FOREIGN KEY ("flagger_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_flags" ADD CONSTRAINT "report_flags_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crime_reports_lat_lng_idx" ON "crime_reports" ("latitude","longitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crime_reports_status_idx" ON "crime_reports" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crime_reports_incident_date_idx" ON "crime_reports" ("incident_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crime_reports_category_idx" ON "crime_reports" ("category_id");