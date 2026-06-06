import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  jsonb,
  inet,
} from "drizzle-orm/pg-core";

import {
  activityActionTypeEnum,
  activityEntityTypeEnum,
} from "./enums.js";
import { users } from "./users.js";

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id").references(() => users.id),

  actionType: activityActionTypeEnum("action_type"),

  entityType: activityEntityTypeEnum("entity_type"),

  entityId: uuid("entity_id"),

  oldValue: jsonb("old_value"),

  newValue: jsonb("new_value"),

  metadata: jsonb("metadata"),

  ipAddress: inet("ip_address"),

  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow(),
});