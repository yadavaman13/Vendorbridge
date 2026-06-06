import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { vendors } from "./vendors.js";
import { rfqs, rfqItems } from "./rfqs.js";
import { quotationStatusEnum } from "./enums.js";

/**
 * Quotations
 */
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),

  rfqId: integer("rfq_id")
    .references(() => rfqs.id)
    .notNull(),

  vendorId: integer("vendor_id")
    .references(() => vendors.id)
    .notNull(),

  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(),

  totalAmount: integer("total_amount")
    .notNull(),

  notes: varchar("notes", {
    length: 500,
  }),

  status: quotationStatusEnum("status")
    .default("DRAFT")
    .notNull(),

  submittedAt: timestamp("submitted_at"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Quotation Items
 */
export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),

  quotationId: integer("quotation_id")
    .references(() => quotations.id, { onDelete: "cascade" })
    .notNull(),

  rfqItemId: integer("rfq_item_id")
    .references(() => rfqItems.id)
    .notNull(),

  quantity: integer("quantity")
    .notNull(),

  unitPrice: integer("unit_price")
    .notNull(),

  lineTotal: integer("line_total")
    .notNull(),

  deliveryDays: integer("delivery_days")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});
