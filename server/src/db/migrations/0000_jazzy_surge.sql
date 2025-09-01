CREATE TABLE "mymessages" (
	"message" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer NOT NULL,
	"email" varchar,
	"password" varchar,
	"role" varchar DEFAULT 'USER',
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
