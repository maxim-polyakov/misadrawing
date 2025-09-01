import { pgTable, varchar, integer} from "drizzle-orm/pg-core"

export const mymessages = pgTable("mymessages", {
    message: varchar("message").notNull(),
})

export const users = pgTable('users', {
    email: varchar("email").unique(),
    password: varchar("password"),
    role: varchar("role").default("USER"),
})