import { eq, sql } from "drizzle-orm";
import { db } from "../config/database.js";
import { vendors, users, categories } from "../db/schema/schema.js";

async function getVendorsList({ page = 1, limit = 10, status } = {}) {
  const offset = (page - 1) * limit;

  let query = db
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
    .innerJoin(categories, eq(vendors.categoryId, categories.id));

  if (status) {
    query = query.where(eq(vendors.status, status.toUpperCase()));
  }

  const items = await query.limit(limit).offset(offset);

  let countQuery = db.select({ count: sql`count(*)` }).from(vendors);
  if (status) {
    countQuery = countQuery.where(eq(vendors.status, status.toUpperCase()));
  }
  const countResult = await countQuery;
  const total = Number(countResult[0]?.count || 0);

  return { items, total };
}

async function getVendorById(id) {
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
    .where(eq(vendors.id, id))
    .limit(1);

  return result[0] || null;
}

async function getVendorByUserId(userId) {
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
    .where(eq(vendors.userId, userId))
    .limit(1);

  return result[0] || null;
}

async function updateVendorStatus(id, status) {
  const result = await db
    .update(vendors)
    .set({ status: status.toUpperCase(), updatedAt: new Date() })
    .where(eq(vendors.id, id))
    .returning();
  return result[0] || null;
}

export {
  getVendorsList,
  getVendorById,
  getVendorByUserId,
  updateVendorStatus,
};
