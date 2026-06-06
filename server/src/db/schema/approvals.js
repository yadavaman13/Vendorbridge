import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

import { quotations } from "./quotations.js";
import { users } from "./users.js";
import { approvalStatusEnum } from "./enums.js";

export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),

  quotationId: integer("quotation_id")
    .notNull()
    .references(() => quotations.id, {
      onDelete: "cascade",
    }),

  approverId: integer("approver_id")
    .notNull()
    .references(() => users.id),

  status: approvalStatusEnum("status")
    .default("PENDING")
    .notNull(),

  remarks: varchar("remarks", {
    length: 500,
  }),

  approvedAt: timestamp("approved_at"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
