import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

import { userRoleEnum } from "./enums.js";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 50 }).notNull(),

  email: varchar("email", { length: 100 }).notNull().unique(),

  phone: varchar("phone", { length: 10 }).notNull().unique(),

  role: userRoleEnum("role").notNull(),

  password: varchar("password", { length: 255 }).notNull(),
  profilePicture: varchar("profile_picture", {
    length: 500,
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  deletedAt: timestamp("deleted_at"),

  isActive: boolean("is_active").default(true).notNull(),

  isVerified: boolean("is_verified").default(false).notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
