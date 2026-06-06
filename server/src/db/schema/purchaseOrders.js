import {
  pgTable,
  serial,
  integer,
  varchar,
  numeric,
  date,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

import { poStatusEnum } from "./enums.js";
import { rfqs } from "./rfqs.js";
import { vendors } from "./vendors.js";
import { users } from "./users.js";
import { quotations } from "./quotations.js";

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),

  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),

  rfqId: integer("rfq_id").references(() => rfqs.id),
  quotationId: integer("quotation_id").unique().references(() => quotations.id),
  vendorId: integer("vendor_id").references(() => vendors.id),

  createdBy: integer("created_by").references(() => users.id),

  status: poStatusEnum("status").default("CREATED"),

  currency: varchar("currency", { length: 10 }).default("INR"),

  subtotal: numeric("subtotal", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),

  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).default("0"),

  totalAmount: numeric("total_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),

  issuedDate: date("issued_date").defaultNow(),

  expectedDeliveryDate: date("expected_delivery_date"),

  notes: text("notes"),

  isDeleted: boolean("is_deleted").default(false),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),
});