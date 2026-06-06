import { eq, and, or, desc, asc, count } from "drizzle-orm";
import { db } from "../../config/database.js";
import { quotations, quotationItems } from "../schema/quotations.js";
import { vendors } from "../schema/vendors.js";
import { rfqs } from "../schema/rfqs.js";

/**
 * List quotations with optional filters, pagination, and sorting.
 * @param {Object} params
 * @param {Object} [params.filters]
 * @param {number} [params.filters.rfqId] - Filter by RFQ ID
 * @param {number} [params.filters.vendorId] - Filter by Vendor ID
 * @param {string} [params.filters.status] - Filter by Quotation status (e.g. SUBMITTED, SELECTED)
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.sort="createdAt"]
 * @param {string} [params.order="desc"]
 * @returns {Promise<{ items: Array<Object>, total: number }>}
 */
export async function listQuotations({ filters = {}, page = 1, limit = 10, sort = "createdAt", order = "desc" } = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (filters.rfqId) {
    conditions.push(eq(quotations.rfqId, Number(filters.rfqId)));
  }
  if (filters.vendorId) {
    conditions.push(eq(quotations.vendorId, Number(filters.vendorId)));
  }
  if (filters.status) {
    conditions.push(eq(quotations.status, filters.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 1. Total Count
  const countResult = await db
    .select({ count: count() })
    .from(quotations)
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);

  // 2. Sorting
  const allowedSortColumns = {
    id: quotations.id,
    totalAmount: quotations.totalAmount,
    status: quotations.status,
    submittedAt: quotations.submittedAt,
    createdAt: quotations.createdAt,
  };
  const sortColumn = allowedSortColumns[sort] || quotations.createdAt;
  const orderBy = order.toLowerCase() === "asc" ? asc(sortColumn) : desc(sortColumn);

  // 3. Query items
  const items = await db
    .select({
      id: quotations.id,
      rfqId: quotations.rfqId,
      rfqTitle: rfqs.title,
      vendorId: quotations.vendorId,
      companyName: vendors.companyName,
      totalAmount: quotations.totalAmount,
      status: quotations.status,
      notes: quotations.notes,
      submittedAt: quotations.submittedAt,
      createdAt: quotations.createdAt,
    })
    .from(quotations)
    .innerJoin(vendors, eq(quotations.vendorId, vendors.id))
    .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limitNum)
    .offset(offset);

  return { items, total };
}

/**
 * Get a single quotation with its line items.
 * @param {number|string} id - Quotation ID
 * @returns {Promise<Object|null>} Quotation detail record or null if not found
 */
export async function getQuotationById(id) {
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const result = await db
    .select({
      id: quotations.id,
      rfqId: quotations.rfqId,
      rfqTitle: rfqs.title,
      vendorId: quotations.vendorId,
      companyName: vendors.companyName,
      totalAmount: quotations.totalAmount,
      status: quotations.status,
      notes: quotations.notes,
      submittedAt: quotations.submittedAt,
      createdAt: quotations.createdAt,
      updatedAt: quotations.updatedAt,
    })
    .from(quotations)
    .innerJoin(vendors, eq(quotations.vendorId, vendors.id))
    .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
    .where(eq(quotations.id, numericId))
    .limit(1);

  const quotation = result[0] || null;
  if (!quotation) return null;

  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, numericId));

  return {
    ...quotation,
    items,
  };
}

/**
 * Create a new quotation.
 * @param {Object} payload
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object>} Created quotation record
 */
export async function createQuotation(payload, { trx } = {}) {
  const client = trx || db;
  const [created] = await client
    .insert(quotations)
    .values({
      rfqId: payload.rfqId,
      vendorId: payload.vendorId,
      createdBy: payload.createdBy,
      totalAmount: payload.totalAmount || 0,
      notes: payload.notes || null,
      status: payload.status || "DRAFT",
    })
    .returning();

  return created;
}

/**
 * Update a quotation.
 * @param {number|string} id - Quotation ID
 * @param {Object} changes
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} Updated quotation or null
 */
export async function updateQuotation(id, changes, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const valuesToSet = {};
  if (changes.totalAmount !== undefined) valuesToSet.totalAmount = changes.totalAmount;
  if (changes.notes !== undefined) valuesToSet.notes = changes.notes;
  if (changes.status !== undefined) valuesToSet.status = changes.status;
  if (changes.submittedAt !== undefined) valuesToSet.submittedAt = changes.submittedAt ? new Date(changes.submittedAt) : null;
  valuesToSet.updatedAt = new Date();

  const [updated] = await client
    .update(quotations)
    .set(valuesToSet)
    .where(eq(quotations.id, numericId))
    .returning();

  return updated || null;
}

/**
 * Perform a cascading hard delete on a quotation.
 * @param {number|string} id - Quotation ID
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} Deleted quotation or null
 */
export async function deleteQuotation(id, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const [deleted] = await client
    .delete(quotations)
    .where(eq(quotations.id, numericId))
    .returning();

  return deleted || null;
}

/**
 * Transactional creation of a Quotation with its line items.
 * @param {Object} quotationPayload
 * @param {Array<Object>} itemsArray - List of items (e.g. [{ rfqItemId, quantity, unitPrice, lineTotal, deliveryDays }])
 * @returns {Promise<Object>} Created quotation details with items
 */
export async function createQuotationWithItems(quotationPayload, itemsArray) {
  return await db.transaction(async (trx) => {
    // 1. Create quotation
    const quotation = await createQuotation(quotationPayload, { trx });

    // 2. Insert items
    let items = [];
    if (itemsArray && itemsArray.length > 0) {
      const itemsToInsert = itemsArray.map((item) => ({
        quotationId: quotation.id,
        rfqItemId: item.rfqItemId,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        lineTotal: Number(item.lineTotal) || 0,
        deliveryDays: Number(item.deliveryDays) || 0,
      }));

      items = await trx
        .insert(quotationItems)
        .values(itemsToInsert)
        .returning();
    }

    return {
      ...quotation,
      items,
    };
  });
}

/**
 * Add a line item to a quotation.
 * @param {number|string} quotationId - Quotation ID
 * @param {Object} itemPayload
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object>} Created line item
 */
export async function addQuotationItem(quotationId, itemPayload, { trx } = {}) {
  const client = trx || db;
  const numericQuotationId = Number(quotationId);
  if (isNaN(numericQuotationId)) throw new Error("Invalid Quotation ID");

  const [created] = await client
    .insert(quotationItems)
    .values({
      quotationId: numericQuotationId,
      rfqItemId: itemPayload.rfqItemId,
      quantity: Number(itemPayload.quantity) || 0,
      unitPrice: Number(itemPayload.unitPrice) || 0,
      lineTotal: Number(itemPayload.lineTotal) || 0,
      deliveryDays: Number(itemPayload.deliveryDays) || 0,
    })
    .returning();

  return created;
}

/**
 * Update a quotation line item.
 * @param {number|string} itemId - Line Item ID
 * @param {Object} changes
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} Updated line item or null
 */
export async function updateQuotationItem(itemId, changes, { trx } = {}) {
  const client = trx || db;
  const numericItemId = Number(itemId);
  if (isNaN(numericItemId)) return null;

  const valuesToSet = {};
  if (changes.quantity !== undefined) valuesToSet.quantity = Number(changes.quantity) || 0;
  if (changes.unitPrice !== undefined) valuesToSet.unitPrice = Number(changes.unitPrice) || 0;
  if (changes.lineTotal !== undefined) valuesToSet.lineTotal = Number(changes.lineTotal) || 0;
  if (changes.deliveryDays !== undefined) valuesToSet.deliveryDays = Number(changes.deliveryDays) || 0;

  const [updated] = await client
    .update(quotationItems)
    .set(valuesToSet)
    .where(eq(quotationItems.id, numericItemId))
    .returning();

  return updated || null;
}

/**
 * Remove a line item from a quotation.
 * @param {number|string} itemId - Line Item ID
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} Deleted line item or null
 */
export async function removeQuotationItem(itemId, { trx } = {}) {
  const client = trx || db;
  const numericItemId = Number(itemId);
  if (isNaN(numericItemId)) return null;

  const [deleted] = await client
    .delete(quotationItems)
    .where(eq(quotationItems.id, numericItemId))
    .returning();

  return deleted || null;
}

/**
 * Mark a quotation as SELECTED (winning bid).
 * @param {number|string} id - Quotation ID
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} The updated quotation record or null
 */
export async function selectQuotation(id, { trx } = {}) {
  return updateQuotation(id, { status: "SELECTED" }, { trx });
}

/**
 * Mark a quotation as REJECTED.
 * @param {number|string} id - Quotation ID
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} The updated quotation record or null
 */
export async function rejectQuotation(id, { trx } = {}) {
  return updateQuotation(id, { status: "REJECTED" }, { trx });
}
