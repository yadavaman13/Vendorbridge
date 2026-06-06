import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { vendors } from "./vendors.js";
import { rfqStatusEnum } from "./enums.js";

/**
 * RFQs
 */
export const rfqs = pgTable("rfqs", {
  id: serial("id").primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),

  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(),

  deadline: timestamp("deadline"),

  status: rfqStatusEnum("status")
    .default("DRAFT")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * RFQ Items
 */
export const rfqItems = pgTable("rfq_items", {
  id: serial("id").primaryKey(),

  rfqId: integer("rfq_id")
    .references(() => rfqs.id, { onDelete: "cascade" })
    .notNull(),

  itemName: varchar("item_name", {
    length: 255,
  }).notNull(),

  quantity: integer("quantity")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

/**
 * RFQ Vendors
 * One RFQ can be sent to multiple vendors
 */
export const rfqVendors = pgTable("rfq_vendors", {
  id: serial("id").primaryKey(),

  rfqId: integer("rfq_id")
    .references(() => rfqs.id, { onDelete: "cascade" })
    .notNull(),

  vendorId: integer("vendor_id")
    .references(() => vendors.id, { onDelete: "cascade" })
    .notNull(),

  invitedAt: timestamp("invited_at")
    .defaultNow()
    .notNull(),
});
