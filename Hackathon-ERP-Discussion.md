# you asked

message time: 2026-06-06 11:55:20

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

import { userRoleEnum } from "./enums.js";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 50 }).notNull(),

  email: varchar("email", { length: 100 }).notNull().unique(),

  phone: varchar("phone", { length: 10 }).notNull().unique(),

  role: userRoleEnum("role").notNull(),

  password: varchar("password", { length: 255 }).notNull(),

  profilePicture: varchar("profile_picture", {
    length: 500,
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  deletedAt: timestamp("deleted_at").nullable(),

  isActive: boolean("is_active").default(true).notNull(),

  isVerified: boolean("is_verified").default(false).notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { categories } from "./categories.js";
import { approvalStatusEnum } from "./enums.js";

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  companyName: varchar("company_name", {
    length: 255,
  }).notNull(),

  gstNumber: varchar("gst_number", {
    length: 15,
  }).notNull(),

  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),

  contactPerson: varchar("contact_person", {
    length: 100,
  }),

  contactEmail: varchar("contact_email", {
    length: 100,
  }),

  contactPhone: varchar("contact_phone", {
    length: 15,
  }),

  address: text("address"),

  status: approvalStatusEnum("status").default("PENDING").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

these are final tables. now tell me what we need to change

---

# chatgpt response

These are much better. I only see a few things I'd change before calling them "final".

---

# 1. `deletedAt` is wrong

Drizzle doesn't have `.nullable()`.

Replace:

```js
deletedAt: timestamp("deleted_at").nullable(),
```

with:

```js
deletedAt: timestamp("deleted_at"),
```

By default it's nullable.

---

# 2. Add `$onUpdate()` everywhere

Currently:

```js
updatedAt: timestamp("updated_at")
  .defaultNow()
  .notNull(),
```

I'd change to:

```js
updatedAt: timestamp("updated_at")
  .defaultNow()
  .$onUpdate(() => new Date())
  .notNull(),
```

In:

- users
- vendors
- rfqs
- quotations
- purchase_orders
- invoices

---

# 3. Make Vendor User 1:1

Right now:

```js
userId: uuid("user_id")
  .notNull()
  .references(() => users.id)
```

This allows:

```text
Vendor A -> User 1
Vendor B -> User 1
Vendor C -> User 1
```

which doesn't make sense.

Add:

```js
userId: uuid("user_id")
  .unique()
  .notNull()
  .references(() => users.id, {
    onDelete: "cascade",
  }),
```

This enforces:

```text
One User
   ↔
One Vendor
```

---

# 4. GST should be unique

Currently:

```js
gstNumber: varchar("gst_number", {
  length: 15,
}).notNull(),
```

Change:

```js
gstNumber: varchar("gst_number", {
  length: 15,
})
  .unique()
  .notNull(),
```

---

# 5. Contact Email

For procurement systems, I would make this required.

```js
contactEmail: varchar("contact_email", {
  length: 100,
}).notNull(),
```

Otherwise you won't know where to send RFQs.

---

# 6. Contact Phone

Same.

```js
contactPhone: varchar("contact_phone", {
  length: 15,
}).notNull(),
```

---

# 7. Verify your enum

You have:

```js
status: approvalStatusEnum("status")
  .default("PENDING")
  .notNull(),
```

Check that:

```js
export const approvalStatusEnum = pgEnum(
  "approval_status",
  [
    "PENDING",
    "APPROVED",
    "REJECTED",
  ]
);
```

matches exactly.

---

# 8. Small Naming Suggestion

Currently:

```js
approvalStatusEnum
```

for vendors.

This works technically, but semantically it's a bit odd.

A cleaner name:

```js
vendorStatusEnum
```

```text
PENDING
APPROVED
REJECTED
```

because this status belongs to a vendor registration, not an approval workflow.

Not required, but cleaner.

---

# 9. Future RFQ / Quotation Change

Since you now have a dedicated vendors table:

RFQ Vendors:

```js
vendorId: uuid("vendor_id")
  .references(() => vendors.id)
  .notNull(),
```

Quotations:

```js
vendorId: uuid("vendor_id")
  .references(() => vendors.id)
  .notNull(),
```

Don't reference `users.id` there anymore.

---

# My Final Verdict

### Must Fix

✅ Remove `.nullable()`

✅ Add `.unique()` on `vendors.userId`

✅ Add `.unique()` on `gstNumber`

✅ Use `$onUpdate()` for `updatedAt`

---

### Strongly Recommended

✅ Make `contactEmail` required

✅ Make `contactPhone` required

---

### Good To Go

The overall design:

```text
users
   ↓
vendors

rfqs
   ↓
rfq_items

rfq_vendors

quotations
   ↓
quotation_items
```

is clean, normalized, and exactly what I'd expect from a procurement ERP hackathon project. You're at the point where I'd stop tweaking these two tables and move on to the RFQ/Quotation workflow.