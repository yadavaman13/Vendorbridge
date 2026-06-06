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
  "ACKNOWLEDGED",
  "PARTIALLY_FULFILLED",
  "COMPLETED",
  "CANCELLED",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "GENERATED",
  "SENT",
  "VIEWED",
  "PAID",
  "PARTIALLY_PAID",
  "OVERDUE",
  "CANCELLED",
]);

export const activityActionTypeEnum = pgEnum("activity_action_type", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "VIEW",
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "REJECT",
  "SEND",
  "RECEIVE",
]);

export const activityEntityTypeEnum = pgEnum("activity_entity_type", [
  "USER",
  "VENDOR",
  "RFQ",
  "QUOTATION",
  "PURCHASE_ORDER",
  "INVOICE",
  "CATEGORY",
]);
