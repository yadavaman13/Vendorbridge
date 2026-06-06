import { eq, and, or, like, ilike, desc, asc, sql, count } from "drizzle-orm";
import { db } from "../../config/database.js";
import { vendors } from "../schema/vendors.js";
import { users } from "../schema/users.js";
import { categories } from "../schema/categories.js";

/**
 * @typedef {Object} VendorFilter
 * @property {string} [status] - Filter by vendor status (e.g. PENDING, APPROVED, REJECTED)
 * @property {number} [categoryId] - Filter by category ID
 * @property {string} [companyName] - Case-insensitive search match for company name
 * @property {string} [gstNumber] - Exact match search for GST number
 */

/**
 * List vendors with optional filters, pagination, and sorting.
 * @param {Object} params
 * @param {VendorFilter} [params.filters] - Status, category, and search filters
 * @param {number} [params.page=1] - 1-based page number
 * @param {number} [params.limit=10] - Number of items per page
 * @param {string} [params.sort="createdAt"] - Column to sort by
 * @param {string} [params.order="desc"] - Sorting order ("asc" or "desc")
 * @returns {Promise<{ items: Array<Object>, total: number }>}
 * @example
 * const { items, total } = await listVendors({ filters: { status: 'PENDING' }, page: 1, limit: 10 });
 */
export async function listVendors({ filters = {}, page = 1, limit = 10, sort = "createdAt", order = "desc" } = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (filters.status) {
    conditions.push(eq(vendors.status, filters.status));
  }
  if (filters.categoryId) {
    conditions.push(eq(vendors.categoryId, Number(filters.categoryId)));
  }
  if (filters.companyName) {
    conditions.push(ilike(vendors.companyName, `%${filters.companyName}%`));
  }
  if (filters.gstNumber) {
    conditions.push(eq(vendors.gstNumber, filters.gstNumber.trim()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 1. Total Count
  const countResult = await db
    .select({ count: count() })
    .from(vendors)
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);

  // 2. Sorting Setup
  const allowedSortColumns = {
    id: vendors.id,
    companyName: vendors.companyName,
    gstNumber: vendors.gstNumber,
    status: vendors.status,
    createdAt: vendors.createdAt,
    updatedAt: vendors.updatedAt,
  };
  const sortColumn = allowedSortColumns[sort] || vendors.createdAt;
  const orderBy = order.toLowerCase() === "asc" ? asc(sortColumn) : desc(sortColumn);

  // 3. Main Query
  const items = await db
    .select({
      id: vendors.id,
      companyName: vendors.companyName,
      gstNumber: vendors.gstNumber,
      address: vendors.address,
      status: vendors.status,
      createdAt: vendors.createdAt,
      updatedAt: vendors.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      },
      category: {
        id: categories.id,
        name: categories.name,
      },
    })
    .from(vendors)
    .innerJoin(users, eq(vendors.userId, users.id))
    .innerJoin(categories, eq(vendors.categoryId, categories.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limitNum)
    .offset(offset);

  return { items, total };
}

/**
 * Retrieve a vendor profile by its vendor ID.
 * @param {number|string} id - The primary key of the vendor
 * @returns {Promise<Object|null>} The vendor profile or null if not found
 * @example
 * const vendor = await getVendorById(1);
 */
export async function getVendorById(id) {
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const result = await db
    .select({
      id: vendors.id,
      companyName: vendors.companyName,
      gstNumber: vendors.gstNumber,
      address: vendors.address,
      status: vendors.status,
      createdAt: vendors.createdAt,
      updatedAt: vendors.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      },
      category: {
        id: categories.id,
        name: categories.name,
      },
    })
    .from(vendors)
    .innerJoin(users, eq(vendors.userId, users.id))
    .innerJoin(categories, eq(vendors.categoryId, categories.id))
    .where(eq(vendors.id, numericId))
    .limit(1);

  return result[0] || null;
}

/**
 * Retrieve a vendor profile associated with a specific User ID.
 * @param {number|string} userId - The user ID linking to the vendor
 * @returns {Promise<Object|null>} The vendor profile or null if not found
 * @example
 * const vendor = await getVendorByUserId(10);
 */
export async function getVendorByUserId(userId) {
  const numericUserId = Number(userId);
  if (isNaN(numericUserId)) return null;

  const result = await db
    .select({
      id: vendors.id,
      companyName: vendors.companyName,
      gstNumber: vendors.gstNumber,
      address: vendors.address,
      status: vendors.status,
      createdAt: vendors.createdAt,
      updatedAt: vendors.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      },
      category: {
        id: categories.id,
        name: categories.name,
      },
    })
    .from(vendors)
    .innerJoin(users, eq(vendors.userId, users.id))
    .innerJoin(categories, eq(vendors.categoryId, categories.id))
    .where(eq(vendors.userId, numericUserId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new vendor record.
 * @param {Object} payload
 * @param {number} payload.userId - ID of the linked user
 * @param {string} payload.companyName - Company Name
 * @param {string} payload.gstNumber - GST Number
 * @param {number} payload.categoryId - ID of the primary business category
 * @param {string} [payload.address] - Company address
 * @param {string} [payload.status="PENDING"] - Approval/onboarding status
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object>} The created vendor record
 */
export async function createVendor(payload, { trx } = {}) {
  const client = trx || db;
  const [created] = await client
    .insert(vendors)
    .values({
      userId: payload.userId,
      companyName: payload.companyName,
      gstNumber: payload.gstNumber,
      categoryId: payload.categoryId,
      address: payload.address || null,
      status: payload.status || "PENDING",
    })
    .returning();

  return created;
}

/**
 * Update vendor profile details.
 * @param {number|string} id - Vendor ID
 * @param {Object} changes - Updated fields
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} The updated vendor record or null if not found
 */
export async function updateVendor(id, changes, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const valuesToSet = {};
  if (changes.companyName !== undefined) valuesToSet.companyName = changes.companyName;
  if (changes.gstNumber !== undefined) valuesToSet.gstNumber = changes.gstNumber;
  if (changes.categoryId !== undefined) valuesToSet.categoryId = Number(changes.categoryId) || undefined;
  if (changes.address !== undefined) valuesToSet.address = changes.address;
  if (changes.status !== undefined) valuesToSet.status = changes.status;
  valuesToSet.updatedAt = new Date();

  const [updated] = await client
    .update(vendors)
    .set(valuesToSet)
    .where(eq(vendors.id, numericId))
    .returning();

  return updated || null;
}

/**
 * Approve, reject or transition vendor onboarding status.
 * @param {number|string} id - Vendor ID
 * @param {string} newStatus - The target status (e.g. APPROVED, REJECTED)
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} The updated vendor record or null if not found
 */
export async function updateVendorStatus(id, newStatus, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const [updated] = await client
    .update(vendors)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, numericId))
    .returning();

  return updated || null;
}

/**
 * Delete a vendor record.
 * Note: The current DB schema does not have a `deletedAt` column for `vendors`,
 * so this function performs a hard delete of the vendor record.
 * @param {number|string} id - Vendor ID
 * @param {Object} [options]
 * @param {Object} [options.trx] - Optional Drizzle transaction client
 * @returns {Promise<Object|null>} The deleted vendor record or null if not found
 */
export async function softDeleteVendor(id, { trx } = {}) {
  const client = trx || db;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const [deleted] = await client
    .delete(vendors)
    .where(eq(vendors.id, numericId))
    .returning();

  return deleted || null;
}
