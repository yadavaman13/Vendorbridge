import { desc, eq, sql, isNull } from "drizzle-orm";
import { db } from "../config/database.js";
import { users } from "../db/schema/users.js";

async function getUserByEmail(email) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
}

async function getUsers({ page = 1, limit = 10 } = {}) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const offset = (safePage - 1) * safeLimit;

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        profilePicture: users.profilePicture,
        createdAt: users.createdAt,
        deletedAt: users.deletedAt,
        isActive: users.isActive,
        isVerified: users.isVerified,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(desc(users.createdAt))
      .limit(safeLimit)
      .offset(offset),
    db.select({ total: sql`count(*)::int` }).from(users).where(isNull(users.deletedAt)),
  ]);

  return {
    items,
    total: totalResult[0]?.total ?? 0,
    page: safePage,
    limit: safeLimit,
  };
}

async function getUserById(userId) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      profilePicture: users.profilePicture,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
      isActive: users.isActive,
      isVerified: users.isVerified,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId), isNull(users.deletedAt))
    .limit(1);

  return result[0] || null;
}

async function createUser({
  email,
  password,
  name,
  phone,
  role,
  isVerified = false,
}) {
  const result = await db
    .insert(users)
    .values({
      email,
      password,
      name: name ?? null,
      phone,
      role,
      isVerified,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    });

  return result[0];
}

async function updateUserPassword({ userId, newPassword }) {
  await db
    .update(users)
    .set({ password: newPassword })
    .where(eq(users.id, userId));
}

async function updateUserRole({ userId, role }) {
  const result = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      profilePicture: users.profilePicture,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
      isActive: users.isActive,
      isVerified: users.isVerified,
      updatedAt: users.updatedAt,
    });

  return result[0] || null;
}

async function updateUser({ userId, name, email, phone, role }) {
  const updatePayload = { updatedAt: new Date() };

  if (typeof name === "string") {
    updatePayload.name = name.trim();
  }

  if (typeof email === "string") {
    updatePayload.email = email.trim().toLowerCase();
  }

  if (typeof phone === "string") {
    updatePayload.phone = phone.trim();
  }

  if (typeof role === "string") {
    updatePayload.role = role.trim().toUpperCase();
  }

  const result = await db
    .update(users)
    .set(updatePayload)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      profilePicture: users.profilePicture,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
      isActive: users.isActive,
      isVerified: users.isVerified,
      updatedAt: users.updatedAt,
    });

  return result[0] || null;
}

async function softDeleteUser(userId) {
  const result = await db
    .update(users)
    .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      profilePicture: users.profilePicture,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
      isActive: users.isActive,
      isVerified: users.isVerified,
      updatedAt: users.updatedAt,
    });

  return result[0] || null;
}

async function markEmailAsVerified(email) {
  await db
    .update(users)
    .set({ isVerified: true, updatedAt: new Date() })
    .where(eq(users.email, email));
}

async function getUserVerificationStatus(email) {
  const result = await db
    .select({
      isVerified: users.isVerified,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) {
    return {
      exists: false,
      isVerified: null,
    };
  }

  return {
    exists: true,
    isVerified: result[0].isVerified,
  };
}

export {
  createUser,
  getUserByEmail,
  getUsers,
  getUserById,
  updateUserPassword,
  updateUserRole,
  markEmailAsVerified,
  getUserVerificationStatus,
  softDeleteUser,
  updateUser
};
