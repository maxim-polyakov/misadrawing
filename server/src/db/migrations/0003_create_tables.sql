-- Миграция создания таблиц (финальная схема)
-- Для пустой БД создаёт все таблицы, для существующей — идемпотентна (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS "mymessages" (
	"message" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar UNIQUE,
	"password" varchar,
	"username" varchar,
	"role" varchar DEFAULT 'USER'
);
