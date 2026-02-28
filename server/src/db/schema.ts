import { pgTable, varchar, integer, serial } from "drizzle-orm/pg-core"

export const mymessages = pgTable("mymessages", {
    message: varchar("message").notNull(),
})

export const users = pgTable('users', {
    id: serial("id").primaryKey(),
    email: varchar("email").unique(),
    password: varchar("password"), // Nullable для Google OAuth (Google не предоставляет пароль)
    username: varchar("username"),
    role: varchar("role").default("USER"),
})