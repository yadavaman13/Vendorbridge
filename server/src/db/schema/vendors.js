import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { categories } from "./categories.js";
import { approvalStatusEnum } from "./enums.js";

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
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

  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),

  contactPerson: varchar("contact_person", {
    length: 100,
  }),

  contactEmail: varchar("contact_email", {
    length: 100,
  }).notNull(),

  contactPhone: varchar("contact_phone", {
    length: 15,
  }).notNull(),

  address: text("address"),

  status: approvalStatusEnum("status").default("PENDING").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
