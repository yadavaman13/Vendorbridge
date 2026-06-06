import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  date,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { invoiceStatusEnum } from "./enums.js";
import { purchaseOrders } from "./purchaseOrders.js";
import { vendors } from "./vendors.js";
import { users } from "./users.js";

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),

  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),

  poId: uuid("po_id").unique().references(() => purchaseOrders.id),

  vendorId: uuid("vendor_id").references(() => vendors.id),

  issuedBy: uuid("issued_by").references(() => users.id),

  status: invoiceStatusEnum("status").default("GENERATED"),

  currency: varchar("currency", { length: 10 }).default("INR"),

  subtotal: numeric("subtotal", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),

  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).default("0"),

  discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).default(
    "0"
  ),

  totalAmount: numeric("total_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),

  amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }).default("0"),

  amountDue: numeric("amount_due", { precision: 14, scale: 2 }).generatedAlwaysAs(
    sql`total_amount - amount_paid`
  ),

  issuedDate: date("issued_date").defaultNow(),

  dueDate: date("due_date"),

  paymentTerms: text("payment_terms"),

  notes: text("notes"),

  isDeleted: boolean("is_deleted").default(false),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),
});