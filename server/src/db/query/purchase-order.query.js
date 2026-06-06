import { eq, and, desc, asc, count, ilike } from "drizzle-orm";
import { db } from "../../config/database.js";
import { purchaseOrders } from "../schema/purchaseOrders.js";
import { vendors } from "../schema/vendors.js";
import { rfqs } from "../schema/rfqs.js";
import { users } from "../schema/users.js";

/**
 * List purchase orders with optional filters, pagination, and sorting (excluding deleted ones by default).
 * @param {Object} params
 * @param {Object} [params.filters]
 * @param {string} [params.filters.status] - Filter by PO lifecycle state (e.g. SENT, ACKNOWLEDGED)
 * @param {number} [params.filters.vendorId] - Filter by Vendor ID
 * @param {string} [params.filters.poNumber] - Match PO Number
 * @param {boolean} [params.filters.includeDeleted=false]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.sort="createdAt"]
 * @param {string} [params.order="desc"]
 * @returns {Promise<{ items: Array<Object>, total: number }>}
 */
export async function listPurchaseOrders({ filters = {}, page = 1, limit = 10, sort = "createdAt", order = "desc" } = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (!filters.includeDeleted) {
    conditions.push(eq(purchaseOrders.isDeleted, false));
  }
  if (filters.status) {
    conditions.push(eq(purchaseOrders.status, filters.status));
  }
  if (filters.vendorId) {
    conditions.push(eq(purchaseOrders.vendorId, Number(filters.vendorId)));
  }
  if (filters.poNumber) {
    conditions.push(ilike(purchaseOrders.poNumber, `%${filters.poNumber.trim()}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 1. Total Count
  const countResult = await db
    .select({ count: count() })
    .from(purchaseOrders)
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);

  // 2. Sorting
  const allowedSortColumns = {
    id: purchaseOrders.id,
    poNumber: purchaseOrders.poNumber,
    status: purchaseOrders.status,
    totalAmount: purchaseOrders.totalAmount,
    issuedDate: purchaseOrders.issuedDate,
    createdAt: purchaseOrders.createdAt,
  };
  const sortColumn = allowedSortColumns[sort] || purchaseOrders.createdAt;
  const orderBy = order.toLowerCase() === "asc" ? asc(sortColumn) : desc(sortColumn);

  // 3. Query
  const items = await db
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      rfqId: purchaseOrders.rfqId,
      rfqTitle: rfqs.title,
      quotationId: purchaseOrders.quotationId,
      vendorId: purchaseOrders.vendorId,
      companyName: vendors.companyName,
      status: purchaseOrders.status,
      currency: purchaseOrders.currency,
      subtotal: purchaseOrders.subtotal,
      taxAmount: purchaseOrders.taxAmount,
      totalAmount: purchaseOrders.totalAmount,
      issuedDate: purchaseOrders.issuedDate,
      expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
      notes: purchaseOrders.notes,
      createdAt: purchaseOrders.createdAt,
    })
    .from(purchaseOrders)
    .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
    .leftJoin(rfqs, eq(purchaseOrders.rfqId, rfqs.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limitNum)
    .offset(offset);

  return { items, total };
}

/**
 * Get a single purchase order by ID.
 * @param {number|string} id - PO ID
 * @returns {Promise<Object|null>} The detailed PO record or null
 */
export async function getPurchaseOrderById(id) {
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const result = await db
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      rfqId: purchaseOrders.rfqId,
      rfqTitle: rfqs.title,
      quotationId: purchaseOrders.quotationId,
      vendorId: purchaseOrders.vendorId,
      companyName: vendors.companyName,
      status: purchaseOrders.status,
      currency: purchaseOrders.currency,
      subtotal: purchaseOrders.subtotal,
      taxAmount: purchaseOrders.taxAmount,
      totalAmount: purchaseOrders.totalAmount,
      issuedDate: purchaseOrders.issuedDate,
      expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
      notes: purchaseOrders.notes,
      isDeleted: purchaseOrders.isDeleted,
      createdAt: purchaseOrders.createdAt,
      updatedAt: purchaseOrders.updatedAt,
      creator: {
        id: users.id,
        name: users.name,
      },
    })
    .from(purchaseOrders)
    .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
    .leftJoin(rfqs, eq(purchaseOrders.rfqId, rfqs.id))
    .leftJoin(users, eq(purchaseOrders.createdBy, users.id))
    .where(eq(purchaseOrders.id, numericId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new purchase order.
 * @param {Object} payload
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object>} Created PO record
 */
export async function createPurchaseOrder(payload, { trx } = {}) {
  const client = trx || db;
  const [created] = await client
    .insert(purchaseOrders)
    .values({
      poNumber: payload.poNumber,
      rfqId: payload.rfqId || null,
      quotationId: payload.quotationId || null,
      vendorId: payload.vendorId,
      createdBy: payload.createdBy,
      status: payload.status || "CREATED",
      currency: payload.currency || "INR",
      subtotal: payload.subtotal,
      taxAmount: payload.taxAmount || "0",
      totalAmount: payload.totalAmount,
      expectedDeliveryDate: payload.expectedDeliveryDate ? new Date(payload.expectedDeliveryDate).toISOString().split('T')[0] : null,
      notes: payload.notes || null,
    })
    .returning();

  return created;
}

/**
 * Update purchase order fields.
 * @param {number|string} id - PO ID
 * @param {Object} changes
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} The updated PO record or null
 */
export async function updatePurchaseOrder(id, changes, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const valuesToSet = {};
  if (changes.status !== undefined) valuesToSet.status = changes.status;
  if (changes.notes !== undefined) valuesToSet.notes = changes.notes;
  if (changes.expectedDeliveryDate !== undefined) {
    valuesToSet.expectedDeliveryDate = changes.expectedDeliveryDate ? new Date(changes.expectedDeliveryDate).toISOString().split('T')[0] : null;
  }
  valuesToSet.updatedAt = new Date();

  const [updated] = await client
    .update(purchaseOrders)
    .set(valuesToSet)
    .where(eq(purchaseOrders.id, numericId))
    .returning();

  return updated || null;
}

/**
 * Update the status of a PO.
 * @param {number|string} id - PO ID
 * @param {string} status - New lifecycle status (e.g. SENT, ACKNOWLEDGED)
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} Updated PO record or null
 */
export async function updatePOStatus(id, status, { trx } = {}) {
  return updatePurchaseOrder(id, { status }, { trx });
}

/**
 * List all POs associated with a vendor.
 * @param {number|string} vendorId - Vendor ID
 * @returns {Promise<Array<Object>>} List of PO records
 */
export async function listVendorPOs(vendorId) {
  const numericVendorId = Number(vendorId);
  if (isNaN(numericVendorId)) return [];

  const items = await db
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      status: purchaseOrders.status,
      totalAmount: purchaseOrders.totalAmount,
      issuedDate: purchaseOrders.issuedDate,
      expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
    })
    .from(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.vendorId, numericVendorId),
        eq(purchaseOrders.isDeleted, false)
      )
    )
    .orderBy(desc(purchaseOrders.createdAt));

  return items;
}

/**
 * Soft-delete a purchase order.
 * @param {number|string} id - PO ID
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} The deleted PO record or null
 */
export async function softDeletePurchaseOrder(id, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const [updated] = await client
    .update(purchaseOrders)
    .set({
      isDeleted: true,
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, numericId))
    .returning();

  return updated || null;
}
