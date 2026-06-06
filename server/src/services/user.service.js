import { eq } from "drizzle-orm";
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
  updateUserPassword,
  markEmailAsVerified,
  getUserVerificationStatus,
};
