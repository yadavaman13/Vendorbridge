import { eq, and, desc, asc, count, sum, sql } from "drizzle-orm";
import { db } from "../../config/database.js";
import { activityLogs } from "../schema/activityLogs.js";
import { users } from "../schema/users.js";
import { vendors } from "../schema/vendors.js";
import { rfqs } from "../schema/rfqs.js";
import { quotations } from "../schema/quotations.js";
import { approvals } from "../schema/approvals.js";
import { purchaseOrders } from "../schema/purchaseOrders.js";
import { invoices } from "../schema/invoices.js";
import { categories } from "../schema/categories.js";

/**
 * List activity logs with optional filters, pagination, and sorting.
 * @param {Object} params
 * @param {Object} [params.filters]
 * @param {number} [params.filters.userId] - Filter by user ID
 * @param {string} [params.filters.actionType] - Action type (e.g. CREATE, UPDATE, LOGIN)
 * @param {string} [params.filters.entityType] - Entity type (e.g. USER, VENDOR, RFQ)
 * @param {number} [params.filters.entityId] - Specific entity record ID
 * @param {number} [params.page=1]
 * @param {number} [params.limit=25]
 * @returns {Promise<{ items: Array<Object>, total: number }>}
 */
export async function listActivityLogs({ filters = {}, page = 1, limit = 25 } = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 25);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (filters.userId) {
    conditions.push(eq(activityLogs.userId, Number(filters.userId)));
  }
  if (filters.actionType) {
    conditions.push(eq(activityLogs.actionType, filters.actionType));
  }
  if (filters.entityType) {
    conditions.push(eq(activityLogs.entityType, filters.entityType));
  }
  if (filters.entityId) {
    conditions.push(eq(activityLogs.entityId, Number(filters.entityId)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: count() })
    .from(activityLogs)
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);

  const items = await db
    .select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      userName: users.name,
      actionType: activityLogs.actionType,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      oldValue: activityLogs.oldValue,
      newValue: activityLogs.newValue,
      metadata: activityLogs.metadata,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limitNum)
    .offset(offset);

  return { items, total };
}

/**
 * Fetch chronological activity timeline for a single entity record.
 * @param {string} entityType - Entity type string (e.g. 'RFQ', 'VENDOR')
 * @param {number|string} entityId - Entity primary key
 * @returns {Promise<Array<Object>>} List of logs in ascending order
 */
export async function getEntityTimeline(entityType, entityId) {
  const numericEntityId = Number(entityId);
  if (!entityType || isNaN(numericEntityId)) return [];

  const timeline = await db
    .select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      userName: users.name,
      actionType: activityLogs.actionType,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(
      and(
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, numericEntityId)
      )
    )
    .orderBy(asc(activityLogs.createdAt));

  return timeline;
}

/**
 * Aggregate high-level metrics for dashboard summaries, tailored to user roles.
 * @param {string} role - The user's role (ADMIN, VENDOR, MANAGER, etc.)
 * @param {number|string} [userId] - User ID (required for VENDOR summaries)
 * @returns {Promise<Object>} Tailored dashboard metrics
 */
export async function getDashboardSummary(role, userId) {
  const normalizedRole = String(role).toUpperCase();

  if (normalizedRole === "VENDOR") {
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) throw new Error("User ID is required for Vendor dashboard");

    // Fetch vendor record
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, numericUserId)).limit(1);
    if (!vendor) return { message: "Vendor profile not found" };

    // PO Status Counts
    const poCounts = await db
      .select({
        status: purchaseOrders.status,
        count: count(),
      })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.vendorId, vendor.id),
          eq(purchaseOrders.isDeleted, false)
        )
      )
      .groupBy(purchaseOrders.status);

    // Quotation Status Counts
    const quotationCounts = await db
      .select({
        status: quotations.status,
        count: count(),
      })
      .from(quotations)
      .where(eq(quotations.vendorId, vendor.id))
      .groupBy(quotations.status);

    return {
      vendorId: vendor.id,
      companyName: vendor.companyName,
      status: vendor.status,
      purchaseOrders: poCounts,
      quotations: quotationCounts,
    };
  }

  // Admin / Manager / Officer Summary
  const vendorStats = await db
    .select({
      status: vendors.status,
      count: count(),
    })
    .from(vendors)
    .groupBy(vendors.status);

  const rfqStats = await db
    .select({
      status: rfqs.status,
      count: count(),
    })
    .from(rfqs)
    .groupBy(rfqs.status);

  const poStats = await db
    .select({
      status: purchaseOrders.status,
      count: count(),
    })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.isDeleted, false))
    .groupBy(purchaseOrders.status);

  const approvalStats = await db
    .select({
      status: approvals.status,
      count: count(),
    })
    .from(approvals)
    .groupBy(approvals.status);

  const invoiceStats = await db
    .select({
      status: invoices.status,
      count: count(),
    })
    .from(invoices)
    .where(eq(invoices.isDeleted, false))
    .groupBy(invoices.status);

  return {
    vendors: vendorStats,
    rfqs: rfqStats,
    purchaseOrders: poStats,
    approvals: approvalStats,
    invoices: invoiceStats,
  };
}

/**
 * Fetch analytical metrics for overall procurement reporting.
 * @returns {Promise<Object>} Spend metrics and breakdown lists
 */
export async function getProcurementReport() {
  // 1. Total Spend across all POs
  const totalSpendRes = await db
    .select({
      totalSpend: sum(purchaseOrders.totalAmount),
    })
    .from(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.isDeleted, false),
        eq(purchaseOrders.status, "COMPLETED")
      )
    );
  const totalSpend = Number(totalSpendRes[0]?.totalSpend || 0);

  // 2. Spend by Category
  const spendByCategory = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      totalSpend: sum(purchaseOrders.totalAmount),
    })
    .from(purchaseOrders)
    .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
    .innerJoin(categories, eq(vendors.categoryId, categories.id))
    .where(
      and(
        eq(purchaseOrders.isDeleted, false),
        eq(purchaseOrders.status, "COMPLETED")
      )
    )
    .groupBy(categories.id, categories.name);

  // 3. Purchase Order lifecycle statistics
  const poBreakdown = await db
    .select({
      status: purchaseOrders.status,
      count: count(),
      amount: sum(purchaseOrders.totalAmount),
    })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.isDeleted, false))
    .groupBy(purchaseOrders.status);

  return {
    totalCompletedSpend: totalSpend,
    spendByCategory,
    purchaseOrdersBreakdown: poBreakdown,
  };
}

/**
 * Fetch analytical performance metrics for all registered vendors.
 * @returns {Promise<Array<Object>>} List of vendor winning ratios and total PO sizes
 */
export async function getVendorPerformanceReport() {
  // Direct raw query wrapper to calculate winning ratios and PO counts per vendor
  const report = await db.execute(sql`
    SELECT 
      v.id AS "vendorId",
      v.company_name AS "companyName",
      COUNT(DISTINCT q.id) AS "totalQuotations",
      COUNT(DISTINCT CASE WHEN q.status = 'SELECTED' THEN q.id END) AS "quotationsWon",
      ROUND(COALESCE(COUNT(DISTINCT CASE WHEN q.status = 'SELECTED' THEN q.id END)::numeric / NULLIF(COUNT(DISTINCT q.id), 0), 0) * 100, 2) AS "winRatePercentage",
      COUNT(DISTINCT po.id) AS "totalPOs",
      COUNT(DISTINCT CASE WHEN po.status = 'COMPLETED' THEN po.id END) AS "completedPOs",
      COALESCE(SUM(po.total_amount), 0) AS "totalPOSpend"
    FROM vendors v
    LEFT JOIN quotations q ON q.vendor_id = v.id
    LEFT JOIN purchase_orders po ON po.vendor_id = v.id AND po.is_deleted = false
    GROUP BY v.id, v.company_name
    ORDER BY "totalPOSpend" DESC;
  `);

  return report.rows || [];
}
