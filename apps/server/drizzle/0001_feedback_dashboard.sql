DROP TABLE IF EXISTS "feedback";
DROP TYPE IF EXISTS "feedback_priority";
DROP TYPE IF EXISTS "feedback_category";
DROP TYPE IF EXISTS "feedback_status";
CREATE TYPE "public"."feedback_status" AS ENUM('new', 'reviewing', 'resolved', 'archived');
CREATE TYPE "public"."feedback_category" AS ENUM('bug', 'feature', 'improvement', 'question', 'other');
CREATE TYPE "public"."feedback_priority" AS ENUM('low', 'medium', 'high');
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" "feedback_category" NOT NULL,
	"status" "feedback_status" DEFAULT 'new' NOT NULL,
	"user_name" text NOT NULL,
	"user_email" text NOT NULL,
	"priority" "feedback_priority" DEFAULT 'medium' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
