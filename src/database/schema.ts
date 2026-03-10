import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

type IndexNameTempl = `${string}_idx` | `${string}_unique_idx`;

// Extracted helper just to save typing
const idx = (idxName: IndexNameTempl) => index(idxName);

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		username: varchar("username", { length: 255 }).notNull().unique(),
		email: varchar("email", { length: 255 }).notNull().unique(),
		password: varchar("password_hash", { length: 255 }).notNull(),
		avatar: text("avatar"),
		bio: text("bio"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [
		idx("users_username_idx").on(table.username),
		idx("users_email_idx").on(table.email),
	],
);
