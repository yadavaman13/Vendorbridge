import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { purchaseOrders } from './purchaseOrders.js';
import { invoices } from './invoices.js';
import { activityLogs } from './activityLogs.js';

const usersSchema = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name'),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export { usersSchema as users, purchaseOrders, invoices, activityLogs };
