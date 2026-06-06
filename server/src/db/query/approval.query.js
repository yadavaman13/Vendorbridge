import { eq, and, desc, asc, count } from "drizzle-orm";
import { db } from "../../config/database.js";
import { approvals } from "../schema/approvals.js";
import { quotations } from "../schema/quotations.js";
import { users } from "../schema/users.js";

/**
 * List approval requests with pagination and sorting.
 * @param {Object} params
 * @param {Object} [params.filters]
 * @param {string} [params.filters.status] - Filter by status (e.g. PENDING, APPROVED, REJECTED)
 * @param {number} [params.filters.approverId] - Filter by manager ID
 * @param {number} [params.filters.quotationId] - Filter by Quotation ID
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.sort="createdAt"]
 * @param {string} [params.order="desc"]
 * @returns {Promise<{ items: Array<Object>, total: number }>}
 */
export async function listApprovals({ filters = {}, page = 1, limit = 10, sort = "createdAt", order = "desc" } = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (filters.status) {
    conditions.push(eq(approvals.status, filters.status));
  }
  if (filters.approverId) {
    conditions.push(eq(approvals.approverId, Number(filters.approverId)));
  }
  if (filters.quotationId) {
    conditions.push(eq(approvals.quotationId, Number(filters.quotationId)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 1. Count
  const countResult = await db
    .select({ count: count() })
    .from(approvals)
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);

  // 2. Sorting
  const allowedSortColumns = {
    id: approvals.id,
    status: approvals.status,
    createdAt: approvals.createdAt,
    approvedAt: approvals.approvedAt,
  };
  const sortColumn = allowedSortColumns[sort] || approvals.createdAt;
  const orderBy = order.toLowerCase() === "asc" ? asc(sortColumn) : desc(sortColumn);

  // 3. Query
  const items = await db
    .select({
      id: approvals.id,
      quotationId: approvals.quotationId,
      status: approvals.status,
      remarks: approvals.remarks,
      approvedAt: approvals.approvedAt,
      createdAt: approvals.createdAt,
      approver: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      quotation: {
        id: quotations.id,
        totalAmount: quotations.totalAmount,
      },
    })
    .from(approvals)
    .innerJoin(users, eq(approvals.approverId, users.id))
    .innerJoin(quotations, eq(approvals.quotationId, quotations.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limitNum)
    .offset(offset);

  return { items, total };
}

/**
 * Get a single approval record by ID.
 * @param {number|string} id - Approval ID
 * @returns {Promise<Object|null>} Detailed approval sheet or null
 */
export async function getApprovalById(id) {
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const result = await db
    .select({
      id: approvals.id,
      quotationId: approvals.quotationId,
      status: approvals.status,
      remarks: approvals.remarks,
      approvedAt: approvals.approvedAt,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
      approver: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      quotation: {
        id: quotations.id,
        totalAmount: quotations.totalAmount,
      },
    })
    .from(approvals)
    .innerJoin(users, eq(approvals.approverId, users.id))
    .innerJoin(quotations, eq(approvals.quotationId, quotations.id))
    .where(eq(approvals.id, numericId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new approval entry.
 * @param {Object} payload
 * @param {number} payload.quotationId
 * @param {number} payload.approverId - ID of manager who needs to approve
 * @param {string} [payload.remarks]
 * @param {string} [payload.status="PENDING"]
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object>} Created approval record
 */
export async function createApproval(payload, { trx } = {}) {
  const client = trx || db;
  const [created] = await client
    .insert(approvals)
    .values({
      quotationId: payload.quotationId,
      approverId: payload.approverId,
      remarks: payload.remarks || null,
      status: payload.status || "PENDING",
    })
    .returning();

  return created;
}

/**
 * Update the status of an approval sheet (APPROVE or REJECT).
 * @param {number|string} id - Approval ID
 * @param {Object} params
 * @param {string} params.status - New status (APPROVED or REJECTED)
 * @param {string} [params.remarks] - Approval notes or comments
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} The updated approval record or null
 */
export async function updateApprovalStatus(id, { status, remarks }, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const updateValues = {
    status,
    remarks: remarks !== undefined ? remarks : null,
    updatedAt: new Date(),
  };

  if (status === "APPROVED") {
    updateValues.approvedAt = new Date();
  } else {
    updateValues.approvedAt = null;
  }

  const [updated] = await client
    .update(approvals)
    .set(updateValues)
    .where(eq(approvals.id, numericId))
    .returning();

  return updated || null;
}

/**
 * Get historical approval steps for a single quotation.
 * @param {number|string} quotationId - Quotation ID
 * @returns {Promise<Array<Object>>} List of approvals
 */
export async function getQuotationApprovals(quotationId) {
  const numericQuotationId = Number(quotationId);
  if (isNaN(numericQuotationId)) return [];

  const items = await db
    .select({
      id: approvals.id,
      status: approvals.status,
      remarks: approvals.remarks,
      approvedAt: approvals.approvedAt,
      createdAt: approvals.createdAt,
      approver: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(approvals)
    .innerJoin(users, eq(approvals.approverId, users.id))
    .where(eq(approvals.quotationId, numericQuotationId))
    .orderBy(asc(approvals.createdAt));

  return items;
}
