import { eq, and, desc, asc, count, ilike } from "drizzle-orm";
import { db } from "../../config/database.js";
import { invoices } from "../schema/invoices.js";
import { purchaseOrders } from "../schema/purchaseOrders.js";
import { vendors } from "../schema/vendors.js";
import { users } from "../schema/users.js";

/**
 * List invoices with optional filters, pagination, and sorting (excluding deleted ones by default).
 * @param {Object} params
 * @param {Object} [params.filters]
 * @param {string} [params.filters.status] - Invoice status (e.g. GENERATED, PAID, OVERDUE)
 * @param {number} [params.filters.vendorId] - Filter by Vendor ID
 * @param {string} [params.filters.invoiceNumber] - Match Invoice Number
 * @param {boolean} [params.filters.includeDeleted=false]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.sort="createdAt"]
 * @param {string} [params.order="desc"]
 * @returns {Promise<{ items: Array<Object>, total: number }>}
 */
export async function listInvoices({ filters = {}, page = 1, limit = 10, sort = "createdAt", order = "desc" } = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (!filters.includeDeleted) {
    conditions.push(eq(invoices.isDeleted, false));
  }
  if (filters.status) {
    conditions.push(eq(invoices.status, filters.status));
  }
  if (filters.vendorId) {
    conditions.push(eq(invoices.vendorId, Number(filters.vendorId)));
  }
  if (filters.invoiceNumber) {
    conditions.push(ilike(invoices.invoiceNumber, `%${filters.invoiceNumber.trim()}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 1. Total Count
  const countResult = await db
    .select({ count: count() })
    .from(invoices)
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);

  // 2. Sorting
  const allowedSortColumns = {
    id: invoices.id,
    invoiceNumber: invoices.invoiceNumber,
    status: invoices.status,
    totalAmount: invoices.totalAmount,
    issuedDate: invoices.issuedDate,
    dueDate: invoices.dueDate,
    createdAt: invoices.createdAt,
  };
  const sortColumn = allowedSortColumns[sort] || invoices.createdAt;
  const orderBy = order.toLowerCase() === "asc" ? asc(sortColumn) : desc(sortColumn);

  // 3. Query
  const items = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      poId: invoices.poId,
      poNumber: purchaseOrders.poNumber,
      vendorId: invoices.vendorId,
      companyName: vendors.companyName,
      status: invoices.status,
      currency: invoices.currency,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      discountAmount: invoices.discountAmount,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      amountDue: invoices.amountDue,
      issuedDate: invoices.issuedDate,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(vendors, eq(invoices.vendorId, vendors.id))
    .leftJoin(purchaseOrders, eq(invoices.poId, purchaseOrders.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limitNum)
    .offset(offset);

  return { items, total };
}

/**
 * Get a single invoice by ID.
 * @param {number|string} id - Invoice ID
 * @returns {Promise<Object|null>} The detailed invoice record or null
 */
export async function getInvoiceById(id) {
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const result = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      poId: invoices.poId,
      poNumber: purchaseOrders.poNumber,
      vendorId: invoices.vendorId,
      companyName: vendors.companyName,
      status: invoices.status,
      currency: invoices.currency,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      discountAmount: invoices.discountAmount,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      amountDue: invoices.amountDue,
      issuedDate: invoices.issuedDate,
      dueDate: invoices.dueDate,
      paymentTerms: invoices.paymentTerms,
      notes: invoices.notes,
      isDeleted: invoices.isDeleted,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      issuer: {
        id: users.id,
        name: users.name,
      },
    })
    .from(invoices)
    .leftJoin(vendors, eq(invoices.vendorId, vendors.id))
    .leftJoin(purchaseOrders, eq(invoices.poId, purchaseOrders.id))
    .leftJoin(users, eq(invoices.issuedBy, users.id))
    .where(eq(invoices.id, numericId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new invoice.
 * @param {Object} payload
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object>} The created invoice record
 */
export async function createInvoice(payload, { trx } = {}) {
  const client = trx || db;
  const [created] = await client
    .insert(invoices)
    .values({
      invoiceNumber: payload.invoiceNumber,
      poId: payload.poId || null,
      vendorId: payload.vendorId,
      issuedBy: payload.issuedBy,
      status: payload.status || "GENERATED",
      currency: payload.currency || "INR",
      subtotal: payload.subtotal,
      taxAmount: payload.taxAmount || "0",
      discountAmount: payload.discountAmount || "0",
      totalAmount: payload.totalAmount,
      amountPaid: payload.amountPaid || "0",
      dueDate: payload.dueDate ? new Date(payload.dueDate).toISOString().split('T')[0] : null,
      paymentTerms: payload.paymentTerms || null,
      notes: payload.notes || null,
    })
    .returning();

  return created;
}

/**
 * Update an invoice's editable fields (notes, terms, payments).
 * @param {number|string} id - Invoice ID
 * @param {Object} changes
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} The updated invoice record or null
 */
export async function updateInvoice(id, changes, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const valuesToSet = {};
  if (changes.notes !== undefined) valuesToSet.notes = changes.notes;
  if (changes.paymentTerms !== undefined) valuesToSet.paymentTerms = changes.paymentTerms;
  if (changes.amountPaid !== undefined) valuesToSet.amountPaid = changes.amountPaid;
  if (changes.status !== undefined) valuesToSet.status = changes.status;
  if (changes.dueDate !== undefined) {
    valuesToSet.dueDate = changes.dueDate ? new Date(changes.dueDate).toISOString().split('T')[0] : null;
  }
  valuesToSet.updatedAt = new Date();

  const [updated] = await client
    .update(invoices)
    .set(valuesToSet)
    .where(eq(invoices.id, numericId))
    .returning();

  return updated || null;
}

/**
 * Update the lifecycle status of an invoice.
 * @param {number|string} id - Invoice ID
 * @param {string} status - New invoice status (e.g. SENT, PAID)
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} Updated invoice record or null
 */
export async function updateInvoiceStatus(id, status, { trx } = {}) {
  return updateInvoice(id, { status }, { trx });
}

/**
 * Soft-delete an invoice.
 * @param {number|string} id - Invoice ID
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} Deleted invoice record or null
 */
export async function softDeleteInvoice(id, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const [updated] = await client
    .update(invoices)
    .set({
      isDeleted: true,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, numericId))
    .returning();

  return updated || null;
}
