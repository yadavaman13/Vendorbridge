import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "PROCUREMENT_OFFICER",
  "MANAGER",
  "VENDOR",
]);

export const rfqStatusEnum = pgEnum("rfq_status", [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "APPROVED",
  "REJECTED",
]);

export const quotationStatusEnum = pgEnum("quotation_status", [
  "DRAFT",
  "SUBMITTED",
  "SELECTED",
  "REJECTED",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const poStatusEnum = pgEnum("po_status", [
  "CREATED",
  "SENT",
  "ACCEPTED",
  "CANCELLED",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "GENERATED",
  "EMAILED",
  "PAID",
]);
