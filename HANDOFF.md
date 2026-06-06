# Handoff Details - Drizzle Query Helpers

We have implemented reusable Drizzle query helper modules for all 9 sections in `API_CONTRACTS.md` (with RFQs excluded per request), adhering to the singular filename formatting `<entity>.query.js`.

---

## Created Query Helper Modules

### 1. [auth.query.js](file:///d:/odoo/odoo/vendorbridge/server/src/db/query/auth.query.js)
* **getUserByEmail(email)**: Retrieves user details by email.
* **createUser(payload, { trx })**: Inserts a new user record (supports transactions).
* **updateUserPassword(userId, newPassword)**: Sets password hash.
* **markEmailAsVerified(email)**: Sets `isVerified = true`.
* **getUserVerificationStatus(email)**: Returns user verification state.

### 2. [user.query.js](file:///d:/odoo/odoo/vendorbridge/server/src/db/query/user.query.js)
* **listUsers({ filters, page, limit, sort, order })**: Lists active users (excludes soft-deleted by default) with pagination/sorting/filters.
* **getUserById(id)**: Gets user profile by ID (excludes password hash).
* **updateUser(id, changes, { trx })**: Modifies user details.
* **updateUserRole(id, role, { trx })**: Changes user access level.
* **softDeleteUser(id, { trx })**: Marks `deletedAt = now` and `isActive = false`.

### 3. [category.query.js](file:///d:/odoo/odoo/vendorbridge/server/src/db/query/category.query.js)
* **listCategories({ filters, page, limit, sort, order })**: Lists categories (excludes soft-deleted by default).
* **getCategoryById(id)**: Retrieves category.
* **createCategory(payload, { trx })**: Inserts a new category.
* **updateCategory(id, changes, { trx })**: Modifies category fields.
* **softDeleteCategory(id, { trx })**: Marks `deletedAt = now` and `isActive = false`.

### 4. [vendor.query.js](file:///d:/odoo/odoo/vendorbridge/server/src/db/query/vendor.query.js)
* **listVendors({ filters, page, limit, sort, order })**: Lists vendors, joining user contact and category metadata.
* **getVendorById(id)**: Details for one vendor.
* **getVendorByUserId(userId)**: Gets profile linked to a user account (needed for `/api/vendors/me`).
* **createVendor(payload, { trx })**: Registers a new vendor profile.
* **updateVendor(id, changes, { trx })**: Updates profile details.
* **updateVendorStatus(id, newStatus, { trx })**: Sets onboarding state (APPROVED/REJECTED).
* **softDeleteVendor(id, { trx })**: Hard deletes vendor record (no `deletedAt` field).

### 5. [quotation.query.js](file:///d:/odoo/odoo/vendorbridge/server/src/db/query/quotation.query.js)
* **listQuotations({ filters, page, limit, sort })**: Lists bids, joining vendor and RFQ titles.
* **getQuotationById(id)**: Gets quotation detail and line items.
* **createQuotation(payload, { trx })**: Creates quotation parent row.
* **updateQuotation(id, changes, { trx })**: Updates bid details.
* **deleteQuotation(id, { trx })**: Hard deletes bid record.
* **createQuotationWithItems(quotationPayload, itemsArray)**: Transactional insert of bid + item arrays.
* **addQuotationItem(quotationId, itemPayload, { trx })**: Adds bid line item.
* **updateQuotationItem(itemId, changes, { trx })**: Updates unit pricing/delivery days.
* **removeQuotationItem(itemId, { trx })**: Deletes bid line item.
* **selectQuotation(id, { trx })**: Sets status to SELECTED.
* **rejectQuotation(id, { trx })**: Sets status to REJECTED.

### 6. [approval.query.js](file:///d:/odoo/odoo/vendorbridge/server/src/db/query/approval.query.js)
* **listApprovals({ filters, page, limit, sort })**: Lists approval sheets.
* **getApprovalById(id)**: Retrieves approval detail with manager and quotation joins.
* **createApproval(payload, { trx })**: Submits quotation approval request.
* **updateApprovalStatus(id, { status, remarks }, { trx })**: Approves or rejects request with timestamping.
* **getQuotationApprovals(quotationId)**: Historical approval log list.

### 7. [purchase-order.query.js](file:///d:/odoo/odoo/vendorbridge/server/src/db/query/purchase-order.query.js)
* **listPurchaseOrders({ filters, page, limit, sort })**: Lists active POs.
* **getPurchaseOrderById(id)**: Detailed PO with vendor and user contexts.
* **createPurchaseOrder(payload, { trx })**: Creates a PO.
* **updatePurchaseOrder(id, changes, { trx })**: Updates PO notes/fields.
* **updatePOStatus(id, status, { trx })**: Modifies PO lifecycle status (SENT, ACKNOWLEDGED, etc.).
* **listVendorPOs(vendorId)**: Vendor specific active PO list.
* **softDeletePurchaseOrder(id, { trx })**: Soft-deletes a PO (sets `isDeleted = true`).

### 8. [invoice.query.js](file:///d:/odoo/odoo/vendorbridge/server/src/db/query/invoice.query.js)
* **listInvoices({ filters, page, limit, sort })**: Lists active invoices.
* **getInvoiceById(id)**: Detailed invoice sheet.
* **createInvoice(payload, { trx })**: Generates an invoice.
* **updateInvoice(id, changes, { trx })**: Modifies fields or payments.
* **updateInvoiceStatus(id, status, { trx })**: Sets status (SENT, PAID, OVERDUE).
* **softDeleteInvoice(id, { trx })**: Soft-deletes invoice (sets `isDeleted = true`).

### 9. [activity-log.query.js](file:///d:/odoo/odoo/vendorbridge/server/src/db/query/activity-log.query.js)
* **listActivityLogs({ filters, page, limit })**: Lists event logs.
* **getEntityTimeline(entityType, entityId)**: Returns audit trail list.
* **getDashboardSummary(role, userId)**: Aggregates stats for dashboards tailored to user role.
* **getProcurementReport()**: Procurement analytics (spend by category, total spend).
* **getVendorPerformanceReport()**: Aggregates quotations winning ratios and PO compliance metrics.

---

## Design and Integration Assumptions
* **Transactions (`trx`)**: Every write/modify query takes an optional transaction context to allow combining operations under the controller level.
* **Database IDs**: Every function validates user/record IDs using `Number(id)` and returns `null` or empty values on failure.
