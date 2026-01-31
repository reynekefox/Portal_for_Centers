CREATE TABLE "chat_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" varchar NOT NULL,
	"profile_name" text NOT NULL,
	"message_type" text NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_type" text NOT NULL,
	"gender" text NOT NULL,
	"name" text,
	"surname" text,
	"date_of_birth" text,
	"parent_name" text,
	"telegram_id" text,
	"phone" text,
	"complaint" text,
	"additional_notes" text,
	"checklist" json DEFAULT '{}'::json,
	"questionnaire_comments" text,
	"ai_analysis" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
