import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../db/schema/schema.js';

async function getUserByEmail(email) {
    const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    return result[0] || null;
}

async function createUser({ email, password, name }) {
    const result = await db
        .insert(users)
        .values({
            email,
            password,
            name: name ?? null,
        })
        .returning({
            id: users.id,
            email: users.email,
            name: users.name,
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
        .set({ isVerified: true })
        .where(eq(users.email, email));
}

async function getUserVerificationStatus(email) {

    const result = await db
        .select({
            isVerified: users.isVerified
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (result.length === 0) {
        return {
            exists: false,
            isVerified: null
        };
    }

    return {
        exists: true,
        isVerified: result[0].isVerified
    };
}

export { createUser, getUserByEmail, updateUserPassword, markEmailAsVerified, getUserVerificationStatus };
