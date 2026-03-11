import type { users } from "../database";

export type User = typeof users.$inferSelect;
