import {
  pgTable,
  serial,
  integer,
  uuid,
  varchar,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { categories } from "./categories.js";
import { approvalStatusEnum } from "./enums.js";

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .unique()
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  companyName: varchar("company_name", {
    length: 255,
  }).notNull(),

  gstNumber: varchar("gst_number", {
    length: 15,
  })
    .unique()
    .notNull(),

  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),

  address: text("address"),

  status: approvalStatusEnum("status").default("PENDING").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
