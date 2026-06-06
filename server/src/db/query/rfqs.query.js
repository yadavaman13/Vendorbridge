import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { db } from "../../config/database.js";
import {
  quotationItems,
  quotations,
  rfqItems,
  rfqVendors,
  rfqs,
  vendors,
} from "../schema/schema.js";
import { users } from "../schema/users.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const RFQ_SORT_COLUMNS = {
  id: rfqs.id,
  title: rfqs.title,
  status: rfqs.status,
  deadline: rfqs.deadline,
  createdAt: rfqs.createdAt,
  updatedAt: rfqs.updatedAt,
};

function getExecutor(trx) {
  return trx ?? db;
}

function normalizeId(value) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return value;
}

function normalizePagination(page, limit) {
  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);

  const safePage = Number.isInteger(parsedPage) && parsedPage > 0
    ? parsedPage
    : DEFAULT_PAGE;
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0
    ? parsedLimit
    : DEFAULT_LIMIT;

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
}

function normalizeSort(sort) {
  let field = "createdAt";
  let direction = "desc";

  if (typeof sort === "string" && sort.trim()) {
    const [rawField, rawDirection] = sort.split(":");
    field = rawField?.trim() || field;
    direction = rawDirection?.trim().toLowerCase() || direction;
  } else if (sort && typeof sort === "object") {
    field = typeof sort.field === "string" ? sort.field.trim() : field;
    direction = typeof sort.direction === "string"
      ? sort.direction.trim().toLowerCase()
      : direction;
  }

  const column = RFQ_SORT_COLUMNS[field] ?? rfqs.createdAt;

  return direction === "asc" ? asc(column) : desc(column);
}

function buildRfqFilters(filters = {}) {
  const conditions = [];

  const status = normalizeText(filters.status).toUpperCase();
  if (status) {
    conditions.push(eq(rfqs.status, status));
  }

  const createdBy = normalizeId(filters.createdBy);
  if (createdBy) {
    conditions.push(eq(rfqs.createdBy, createdBy));
  }

  const vendorId = normalizeId(filters.vendorId);
  if (vendorId) {
    conditions.push(
      sql`exists (
        select 1
        from ${rfqVendors}
        where ${rfqVendors.rfqId} = ${rfqs.id}
          and ${rfqVendors.vendorId} = ${vendorId}
      )`,
    );
  }

  const deadlineFrom = normalizeNullableValue(filters.deadlineFrom);
  if (deadlineFrom) {
    conditions.push(gte(rfqs.deadline, deadlineFrom));
  }

  const deadlineTo = normalizeNullableValue(filters.deadlineTo);
  if (deadlineTo) {
    conditions.push(lte(rfqs.deadline, deadlineTo));
  }

  const search = normalizeText(filters.search);
  if (search) {
    const pattern = `%${search}%`;

    conditions.push(
      or(
        ilike(rfqs.title, pattern),
        ilike(users.name, pattern),
        ilike(users.email, pattern),
      ),
    );
  }

  return conditions.length ? and(...conditions) : undefined;
}

function selectRfqBaseFields() {
  return {
    id: rfqs.id,
    title: rfqs.title,
    createdBy: rfqs.createdBy,
    createdByName: users.name,
    createdByEmail: users.email,
    createdByRole: users.role,
    deadline: rfqs.deadline,
    status: rfqs.status,
    createdAt: rfqs.createdAt,
    updatedAt: rfqs.updatedAt,
  };
}

async function fetchRfqRelationCounts(executor, rfqIds) {
  if (!rfqIds.length) {
    return new Map();
  }

  const [itemCounts, vendorCounts] = await Promise.all([
    executor
      .select({
        rfqId: rfqItems.rfqId,
        total: sql`cast(count(*) as int)`,
      })
      .from(rfqItems)
      .where(inArray(rfqItems.rfqId, rfqIds))
      .groupBy(rfqItems.rfqId),
    executor
      .select({
        rfqId: rfqVendors.rfqId,
        total: sql`cast(count(*) as int)`,
      })
      .from(rfqVendors)
      .where(inArray(rfqVendors.rfqId, rfqIds))
      .groupBy(rfqVendors.rfqId),
  ]);

  const countsByRfqId = new Map();

  for (const row of itemCounts) {
    countsByRfqId.set(row.rfqId, {
      itemCount: row.total,
      vendorCount: 0,
    });
  }

  for (const row of vendorCounts) {
    const currentCounts = countsByRfqId.get(row.rfqId) ?? {
      itemCount: 0,
      vendorCount: 0,
    };

    countsByRfqId.set(row.rfqId, {
      ...currentCounts,
      vendorCount: row.total,
    });
  }

  return countsByRfqId;
}

async function fetchRfqById(executor, id) {
  const rfqId = normalizeId(id);
  if (!rfqId) {
    return null;
  }

  const [record] = await executor
    .select(selectRfqBaseFields())
    .from(rfqs)
    .leftJoin(users, eq(users.id, rfqs.createdBy))
    .where(eq(rfqs.id, rfqId))
    .limit(1);

  if (!record) {
    return null;
  }

  const countsByRfqId = await fetchRfqRelationCounts(executor, [rfqId]);
  const counts = countsByRfqId.get(rfqId) ?? {
    itemCount: 0,
    vendorCount: 0,
  };

  return {
    ...record,
    ...counts,
  };
}

/**
 * @route GET /api/rfqs
 * @description List RFQs with optional filters, pagination, and sorting.
 * @access Private (ADMIN, PROCUREMENT_OFFICER)
 * @example await listRFQs({ filters: { status: "OPEN" }, page: 1, limit: 10 });
 * @param {object} params
 * @param {object} params.filters - Optional filters such as status, search, createdBy, vendorId, deadlineFrom, deadlineTo.
 * @param {number|string} params.page - 1-based page number.
 * @param {number|string} params.limit - Page size.
 * @param {object|string} params.sort - Sort descriptor like { field: "createdAt", direction: "desc" }.
 * @returns {Promise<{items: Array, total: number, page: number, limit: number}>}
 */
export async function listRFQs({ filters = {}, page = 1, limit = 20, sort = {} } = {}) {
  const executor = getExecutor();
  const { page: safePage, limit: safeLimit, offset } = normalizePagination(page, limit);
  const orderBy = normalizeSort(sort);
  const whereClause = buildRfqFilters(filters);

  const countQuery = executor
    .select({
      total: sql`cast(count(*) as int)`,
    })
    .from(rfqs)
    .leftJoin(users, eq(users.id, rfqs.createdBy));

  const [countRow] = whereClause ? await countQuery.where(whereClause) : await countQuery;

  const listQuery = executor
    .select(selectRfqBaseFields())
    .from(rfqs)
    .leftJoin(users, eq(users.id, rfqs.createdBy));

  const rows = whereClause
    ? await listQuery.where(whereClause).orderBy(orderBy).limit(safeLimit).offset(offset)
    : await listQuery.orderBy(orderBy).limit(safeLimit).offset(offset);

  const countsByRfqId = await fetchRfqRelationCounts(
    executor,
    rows.map((row) => row.id),
  );

  const items = rows.map((row) => ({
    ...row,
    ...(countsByRfqId.get(row.id) ?? { itemCount: 0, vendorCount: 0 }),
  }));

  return {
    items,
    total: countRow?.total ?? 0,
    page: safePage,
    limit: safeLimit,
  };
}

/**
 * @route GET /api/rfqs/:id
 * @description Get one RFQ with creator details and relation counts.
 * @access Private (ADMIN, PROCUREMENT_OFFICER)
 * @example await getRFQById(12);
 * @param {number|string} id - RFQ id.
 * @returns {Promise<object|null>} RFQ record or null when not found.
 */
export async function getRFQById(id) {
  const executor = getExecutor();
  return fetchRfqById(executor, id);
}

/**
 * @route POST /api/rfqs
 * @description Create an RFQ row. Controller is responsible for role and workflow checks.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await createRFQ({ title: "Office Supplies", createdBy: 5 });
 * @param {object} payload - RFQ payload.
 * @param {object} options
 * @param {object} [options.trx] - Optional transaction.
 * @returns {Promise<object|null>} Inserted RFQ row or null when required inputs are invalid.
 */
export async function createRFQ(payload, { trx } = {}) {
  const executor = getExecutor(trx);
  const title = normalizeText(payload?.title);
  const createdBy = normalizeId(payload?.createdBy);
  const deadline = normalizeNullableValue(payload?.deadline);
  const status = normalizeText(payload?.status).toUpperCase() || "DRAFT";

  if (!title || !createdBy) {
    return null;
  }

  const values = {
    title,
    createdBy,
    status,
  };

  if (deadline) {
    values.deadline = deadline;
  }

  const [createdRfq] = await executor
    .insert(rfqs)
    .values(values)
    .returning();

  return createdRfq ?? null;
}

/**
 * @route POST /api/rfqs
 * @description Create an RFQ and its item rows in one transaction.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await createRFQWithItems({ title: "Office Supplies", createdBy: 5 }, [{ itemName: "Pen", quantity: 10 }]);
 * @param {object} rfqPayload - Base RFQ payload.
 * @param {Array<object>} itemsArray - RFQ items to create.
 * @returns {Promise<{rfq: object, items: Array<object>}|null>} Created RFQ plus items or null when the RFQ is invalid.
 */
export async function createRFQWithItems(rfqPayload, itemsArray) {
  return db.transaction(async (trx) => {
    const rfq = await createRFQ(rfqPayload, { trx });
    if (!rfq) {
      return null;
    }

    const normalizedItems = Array.isArray(itemsArray)
      ? itemsArray
          .map((item) => ({
            rfqId: rfq.id,
            itemName: normalizeText(item?.itemName),
            quantity: Number.parseInt(item?.quantity, 10),
          }))
          .filter((item) => item.itemName && Number.isInteger(item.quantity) && item.quantity > 0)
      : [];

    const items = normalizedItems.length
      ? await trx.insert(rfqItems).values(normalizedItems).returning()
      : [];

    return {
      rfq,
      items,
    };
  });
}

/**
 * @route PATCH /api/rfqs/:id
 * @description Update RFQ fields that are safe to edit in-place.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await updateRFQ(12, { title: "Updated RFQ" });
 * @param {number|string} id - RFQ id.
 * @param {object} changes - Mutable RFQ fields.
 * @returns {Promise<object|null>} Updated RFQ row or null when not found.
 */
export async function updateRFQ(id, changes, { trx } = {}) {
  const executor = getExecutor(trx);
  const rfqId = normalizeId(id);

  if (!rfqId) {
    return null;
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(changes ?? {}, "title")) {
    const title = normalizeText(changes?.title);
    if (title) {
      updates.title = title;
    }
  }

  if (Object.prototype.hasOwnProperty.call(changes ?? {}, "deadline")) {
    updates.deadline = normalizeNullableValue(changes?.deadline);
  }

  if (Object.prototype.hasOwnProperty.call(changes ?? {}, "status")) {
    const status = normalizeText(changes?.status).toUpperCase();
    if (status) {
      updates.status = status;
    }
  }

  if (!Object.keys(updates).length) {
    return null;
  }

  const [updatedRfq] = await executor
    .update(rfqs)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(rfqs.id, rfqId))
    .returning();

  return updatedRfq ?? null;
}

/**
 * @route DELETE /api/rfqs/:id
 * @description Remove an RFQ row. The schema does not define a soft-delete column on rfqs.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await softDeleteRFQ(12);
 * @param {number|string} id - RFQ id.
 * @returns {Promise<object|null>} Deleted RFQ row or null when not found.
 */
export async function softDeleteRFQ(id, { trx } = {}) {
  const executor = getExecutor(trx);
  const rfqId = normalizeId(id);

  if (!rfqId) {
    return null;
  }

  const [deletedRfq] = await executor
    .delete(rfqs)
    .where(eq(rfqs.id, rfqId))
    .returning();

  return deletedRfq ?? null;
}

/**
 * @route POST /api/rfqs/:id/items
 * @description Insert one RFQ item row.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await addRFQItem(12, { itemName: "Paper", quantity: 100 });
 * @param {number|string} rfqId - Parent RFQ id.
 * @param {object} itemPayload - Item payload.
 * @param {object} options
 * @param {object} [options.trx] - Optional transaction.
 * @returns {Promise<object|null>} Inserted item row or null when the RFQ/item input is invalid.
 */
export async function addRFQItem(rfqId, itemPayload, { trx } = {}) {
  const executor = getExecutor(trx);
  const parentRfqId = normalizeId(rfqId);

  if (!parentRfqId) {
    return null;
  }

  const parentRfq = await fetchRfqById(executor, parentRfqId);
  if (!parentRfq) {
    return null;
  }

  const itemName = normalizeText(itemPayload?.itemName);
  const quantity = Number.parseInt(itemPayload?.quantity, 10);

  if (!itemName || !Number.isInteger(quantity) || quantity <= 0) {
    return null;
  }

  const [createdItem] = await executor
    .insert(rfqItems)
    .values({
      rfqId: parentRfqId,
      itemName,
      quantity,
    })
    .returning();

  return createdItem ?? null;
}

/**
 * @route PATCH /api/rfqs/:id/items/:itemId
 * @description Update one RFQ item row.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await updateRFQItem(21, { quantity: 50 });
 * @param {number|string} itemId - RFQ item id.
 * @param {object} changes - Mutable item fields.
 * @param {object} options
 * @param {object} [options.trx] - Optional transaction.
 * @returns {Promise<object|null>} Updated item row or null when not found.
 */
export async function updateRFQItem(itemId, changes, { trx } = {}) {
  const executor = getExecutor(trx);
  const rfqItemId = normalizeId(itemId);

  if (!rfqItemId) {
    return null;
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(changes ?? {}, "itemName")) {
    const itemName = normalizeText(changes?.itemName);
    if (itemName) {
      updates.itemName = itemName;
    }
  }

  if (Object.prototype.hasOwnProperty.call(changes ?? {}, "quantity")) {
    const quantity = Number.parseInt(changes?.quantity, 10);
    if (Number.isInteger(quantity) && quantity > 0) {
      updates.quantity = quantity;
    }
  }

  if (!Object.keys(updates).length) {
    return null;
  }

  const [updatedItem] = await executor
    .update(rfqItems)
    .set(updates)
    .where(eq(rfqItems.id, rfqItemId))
    .returning();

  return updatedItem ?? null;
}

/**
 * @route DELETE /api/rfqs/:id/items/:itemId
 * @description Remove an RFQ item row. The rfq_items table cascades from rfqs, so this is a hard delete.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await removeRFQItem(21);
 * @param {number|string} itemId - RFQ item id.
 * @param {object} options
 * @param {object} [options.trx] - Optional transaction.
 * @returns {Promise<object|null>} Deleted item row or null when not found.
 */
export async function removeRFQItem(itemId, { trx } = {}) {
  const executor = getExecutor(trx);
  const rfqItemId = normalizeId(itemId);

  if (!rfqItemId) {
    return null;
  }

  const [deletedItem] = await executor
    .delete(rfqItems)
    .where(eq(rfqItems.id, rfqItemId))
    .returning();

  return deletedItem ?? null;
}

/**
 * @route POST /api/rfqs/:id/vendors
 * @description Create an RFQ invitation record for one vendor.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await inviteVendorToRFQ(12, 8);
 * @param {number|string} rfqId - Parent RFQ id.
 * @param {number|string} vendorId - Vendor id to invite.
 * @param {object} options
 * @param {object} [options.trx] - Optional transaction.
 * @returns {Promise<object|null>} Invitation row or null when inputs are invalid or the RFQ is missing.
 */
export async function inviteVendorToRFQ(rfqId, vendorId, { trx } = {}) {
  const executor = getExecutor(trx);
  const parentRfqId = normalizeId(rfqId);
  const vendorRecordId = normalizeId(vendorId);

  if (!parentRfqId || !vendorRecordId) {
    return null;
  }

  const parentRfq = await fetchRfqById(executor, parentRfqId);
  if (!parentRfq) {
    return null;
  }

  const [existingInvitation] = await executor
    .select({
      id: rfqVendors.id,
      rfqId: rfqVendors.rfqId,
      vendorId: rfqVendors.vendorId,
      invitedAt: rfqVendors.invitedAt,
    })
    .from(rfqVendors)
    .where(
      and(
        eq(rfqVendors.rfqId, parentRfqId),
        eq(rfqVendors.vendorId, vendorRecordId),
      ),
    )
    .limit(1);

  if (existingInvitation) {
    return existingInvitation;
  }

  const [createdInvitation] = await executor
    .insert(rfqVendors)
    .values({
      rfqId: parentRfqId,
      vendorId: vendorRecordId,
    })
    .returning();

  return createdInvitation ?? null;
}

/**
 * @route DELETE /api/rfqs/:id/vendors/:vendorId
 * @description Remove a vendor invitation from one RFQ.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await removeVendorFromRFQ(12, 8);
 * @param {number|string} rfqId - Parent RFQ id.
 * @param {number|string} vendorId - Vendor id to remove.
 * @param {object} options
 * @param {object} [options.trx] - Optional transaction.
 * @returns {Promise<object|null>} Deleted invitation row or null when not found.
 */
export async function removeVendorFromRFQ(rfqId, vendorId, { trx } = {}) {
  const executor = getExecutor(trx);
  const parentRfqId = normalizeId(rfqId);
  const vendorRecordId = normalizeId(vendorId);

  if (!parentRfqId || !vendorRecordId) {
    return null;
  }

  const [deletedInvitation] = await executor
    .delete(rfqVendors)
    .where(
      and(
        eq(rfqVendors.rfqId, parentRfqId),
        eq(rfqVendors.vendorId, vendorRecordId),
      ),
    )
    .returning();

  return deletedInvitation ?? null;
}

/**
 * @route GET /api/rfqs/:id/vendors
 * @description List all vendors invited to one RFQ.
 * @access Private (ADMIN, PROCUREMENT_OFFICER)
 * @example await listRFQVendors(12);
 * @param {number|string} rfqId - Parent RFQ id.
 * @returns {Promise<Array<object>|null>} Invitation list or null when the RFQ is missing.
 */
export async function listRFQVendors(rfqId) {
  const executor = getExecutor();
  const parentRfqId = normalizeId(rfqId);

  if (!parentRfqId) {
    return null;
  }

  const parentRfq = await fetchRfqById(executor, parentRfqId);
  if (!parentRfq) {
    return null;
  }

  return executor
    .select({
      invitationId: rfqVendors.id,
      rfqId: rfqVendors.rfqId,
      vendorId: rfqVendors.vendorId,
      invitedAt: rfqVendors.invitedAt,
      companyName: vendors.companyName,
      gstNumber: vendors.gstNumber,
      categoryId: vendors.categoryId,
      status: vendors.status,
      createdAt: vendors.createdAt,
      updatedAt: vendors.updatedAt,
      contactName: users.name,
      contactEmail: users.email,
      contactPhone: users.phone,
    })
    .from(rfqVendors)
    .innerJoin(vendors, eq(vendors.id, rfqVendors.vendorId))
    .leftJoin(users, eq(users.id, vendors.userId))
    .where(eq(rfqVendors.rfqId, parentRfqId))
    .orderBy(desc(rfqVendors.invitedAt));
}

/**
 * @route PATCH /api/rfqs/:id/status
 * @description Update the RFQ status column. Transition checks belong in the controller.
 * @access Private (PROCUREMENT_OFFICER)
 * @example await changeRFQStatus(12, "OPEN");
 * @param {number|string} rfqId - RFQ id.
 * @param {string} newStatus - Target RFQ status.
 * @param {object} options
 * @param {object} [options.trx] - Optional transaction.
 * @returns {Promise<object|null>} Updated RFQ row or null when not found.
 */
export async function changeRFQStatus(rfqId, newStatus, { trx } = {}) {
  const executor = getExecutor(trx);
  const parentRfqId = normalizeId(rfqId);
  const status = normalizeText(newStatus).toUpperCase();

  if (!parentRfqId || !status) {
    return null;
  }

  const [updatedRfq] = await executor
    .update(rfqs)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(rfqs.id, parentRfqId))
    .returning();

  return updatedRfq ?? null;
}

/**
 * @route GET /api/rfqs/:id
 * @description Get an RFQ with its items and invited vendors.
 * @access Private (ADMIN, PROCUREMENT_OFFICER)
 * @example await getRFQWithItemsAndVendors(12);
 * @param {number|string} rfqId - RFQ id.
 * @returns {Promise<{rfq: object, items: Array<object>, vendors: Array<object>}|null>} Joined RFQ payload or null when missing.
 */
export async function getRFQWithItemsAndVendors(rfqId) {
  const executor = getExecutor();
  const parentRfqId = normalizeId(rfqId);

  if (!parentRfqId) {
    return null;
  }

  const rfq = await fetchRfqById(executor, parentRfqId);
  if (!rfq) {
    return null;
  }

  const [items, vendorsList] = await Promise.all([
    executor
      .select({
        id: rfqItems.id,
        rfqId: rfqItems.rfqId,
        itemName: rfqItems.itemName,
        quantity: rfqItems.quantity,
        createdAt: rfqItems.createdAt,
      })
      .from(rfqItems)
      .where(eq(rfqItems.rfqId, parentRfqId))
      .orderBy(asc(rfqItems.id)),
    listRFQVendors(parentRfqId),
  ]);

  return {
    rfq,
    items,
    vendors: vendorsList ?? [],
  };
}

/**
 * @route GET /api/rfqs/:id/quotations/comparison
 * @description Return quotation summaries and item rows for RFQ comparison.
 * @access Private (ADMIN, PROCUREMENT_OFFICER)
 * @example await getRFQQuotationsComparison(12);
 * @param {number|string} rfqId - RFQ id.
 * @returns {Promise<{rfq: object, quotations: Array<object>}|null>} RFQ comparison payload or null when missing.
 */
export async function getRFQQuotationsComparison(rfqId) {
  const executor = getExecutor();
  const parentRfqId = normalizeId(rfqId);

  if (!parentRfqId) {
    return null;
  }

  const rfq = await fetchRfqById(executor, parentRfqId);
  if (!rfq) {
    return null;
  }

  const quotationRows = await executor
    .select({
      quotationId: quotations.id,
      rfqId: quotations.rfqId,
      vendorId: quotations.vendorId,
      totalAmount: quotations.totalAmount,
      notes: quotations.notes,
      status: quotations.status,
      submittedAt: quotations.submittedAt,
      createdAt: quotations.createdAt,
      updatedAt: quotations.updatedAt,
      companyName: vendors.companyName,
      gstNumber: vendors.gstNumber,
      contactName: users.name,
      contactEmail: users.email,
      contactPhone: users.phone,
    })
    .from(quotations)
    .innerJoin(vendors, eq(vendors.id, quotations.vendorId))
    .leftJoin(users, eq(users.id, vendors.userId))
    .where(eq(quotations.rfqId, parentRfqId))
    .orderBy(asc(quotations.createdAt));

  if (!quotationRows.length) {
    return {
      rfq,
      quotations: [],
    };
  }

  const quotationIds = quotationRows.map((row) => row.quotationId);
  const quotationItemRows = await executor
    .select({
      id: quotationItems.id,
      quotationId: quotationItems.quotationId,
      rfqItemId: quotationItems.rfqItemId,
      quantity: quotationItems.quantity,
      unitPrice: quotationItems.unitPrice,
      lineTotal: quotationItems.lineTotal,
      deliveryDays: quotationItems.deliveryDays,
      createdAt: quotationItems.createdAt,
      itemName: rfqItems.itemName,
    })
    .from(quotationItems)
    .innerJoin(rfqItems, eq(rfqItems.id, quotationItems.rfqItemId))
    .where(inArray(quotationItems.quotationId, quotationIds))
    .orderBy(asc(quotationItems.id));

  const itemsByQuotationId = new Map();

  for (const row of quotationItemRows) {
    const currentItems = itemsByQuotationId.get(row.quotationId) ?? [];
    currentItems.push(row);
    itemsByQuotationId.set(row.quotationId, currentItems);
  }

  return {
    rfq,
    quotations: quotationRows.map((row) => ({
      ...row,
      items: itemsByQuotationId.get(row.quotationId) ?? [],
    })),
  };
}
