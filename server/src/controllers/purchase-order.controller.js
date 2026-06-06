import {
  listPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePOStatus,
  listVendorPOs,
} from "../db/query/purchase-order.query.js";
import { getQuotationById } from "../db/query/quotation.query.js";
import { getVendorById, getVendorByUserId } from "../db/query/vendor.query.js";
import { sendResponse } from "../utils/response.utlis.js";
import { sendEmail } from "../services/mail/mail.service.js";

/**
 * Helper to fetch complete user context with role
 */
async function getUserWithRole(req) {
  if (!req.user?.email) return null;
  const { getUserByEmail } = await import("../services/user.service.js");
  return await getUserByEmail(req.user.email);
}

/**
 * Helper to resolve vendor profile for the logged in user
 */
async function resolveVendorId(req) {
  if (req.user?.role === "VENDOR") {
    const vendor = await getVendorByUserId(req.user.id);
    return vendor ? vendor.id : null;
  }
  const user = await getUserWithRole(req);
  if (user && user.role === "VENDOR") {
    const vendor = await getVendorByUserId(user.id);
    return vendor ? vendor.id : null;
  }
  return null;
}

/**
 * Helper to generate a unique PO number
 */
function generatePoNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${dateStr}-${randomStr}`;
}

/**
 * @route POST /api/purchase-orders
 * @description Create a purchase order from an approved quotation (Staff only)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER)
 */
async function createPurchaseOrderController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER" && user.role !== "PROCUREMENT_OFFICER")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Procurement staff or admins only.",
      });
    }

    const { quotationId, expectedDeliveryDate, notes, taxRate } = req.body || {};

    if (!quotationId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Quotation ID is required.",
      });
    }

    // Fetch the quotation
    const quotation = await getQuotationById(quotationId);
    if (!quotation) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Quotation not found.",
      });
    }

    // Verify quotation is approved (selected)
    if (quotation.status !== "SELECTED") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Purchase Order can only be created from an approved/selected quotation.",
      });
    }

    // Perform calculations
    const subtotal = Number(quotation.totalAmount);
    const rate = Number(taxRate) || 0;
    const taxAmount = (subtotal * rate) / 100;
    const totalAmount = subtotal + taxAmount;
    const poNumber = generatePoNumber();

    const created = await createPurchaseOrder({
      poNumber,
      rfqId: quotation.rfqId,
      quotationId: quotation.id,
      vendorId: quotation.vendorId,
      createdBy: user.id,
      status: "CREATED",
      currency: "INR",
      subtotal: String(subtotal),
      taxAmount: String(taxAmount),
      totalAmount: String(totalAmount),
      expectedDeliveryDate,
      notes,
    });

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "Purchase Order generated successfully.",
      data: {
        record: created,
      },
    });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to generate Purchase Order.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/purchase-orders
 * @description List purchase orders (Staff sees all, Vendor only their own)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function listPurchaseOrdersController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized.",
      });
    }

    const { status, poNumber, page, limit } = req.query || {};
    const filters = {};

    if (status) filters.status = String(status);
    if (poNumber) filters.poNumber = String(poNumber);

    // If Vendor, restrict to their own vendor ID
    if (user.role === "VENDOR") {
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: "Vendor profile not found for this user.",
        });
      }
      filters.vendorId = vendorId;
    } else if (req.query.vendorId) {
      filters.vendorId = Number(req.query.vendorId);
    }

    const { items, total } = await listPurchaseOrders({
      filters,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Purchase Orders retrieved successfully.",
      data: {
        items,
        total,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      },
    });
  } catch (error) {
    console.error("Error listing purchase orders:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve Purchase Orders.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/purchase-orders/:id
 * @description Retrieve PO details
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function getPurchaseOrderByIdController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized.",
      });
    }

    const { id } = req.params;
    const po = await getPurchaseOrderById(id);

    if (!po) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Purchase Order not found.",
      });
    }

    // Vendor access check
    if (user.role === "VENDOR") {
      const vendorId = await resolveVendorId(req);
      if (po.vendorId !== vendorId) {
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "Forbidden. You can only view your own Purchase Orders.",
        });
      }
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Purchase Order details retrieved successfully.",
      data: {
        record: po,
      },
    });
  } catch (error) {
    console.error("Error getting PO details:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve Purchase Order details.",
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/purchase-orders/:id
 * @description Update editable fields on a PO (Staff only)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER)
 */
async function updatePurchaseOrderController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER" && user.role !== "PROCUREMENT_OFFICER")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Procurement staff or admins only.",
      });
    }

    const { id } = req.params;
    const po = await getPurchaseOrderById(id);

    if (!po) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Purchase Order not found.",
      });
    }

    const { notes, expectedDeliveryDate, status } = req.body || {};

    const updated = await updatePurchaseOrder(id, {
      notes,
      expectedDeliveryDate,
      status,
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Purchase Order updated successfully.",
      data: {
        record: updated,
      },
    });
  } catch (error) {
    console.error("Error updating PO:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update Purchase Order.",
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/purchase-orders/:id/status
 * @description Update PO lifecycle status
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function updatePOStatusController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized.",
      });
    }

    const { id } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Status is required.",
      });
    }

    const po = await getPurchaseOrderById(id);
    if (!po) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Purchase Order not found.",
      });
    }

    // Vendor authorization
    if (user.role === "VENDOR") {
      const vendorId = await resolveVendorId(req);
      if (po.vendorId !== vendorId) {
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "Forbidden. You can only update your own Purchase Orders.",
        });
      }
      // Vendors can only transition to ACKNOWLEDGED
      if (status !== "ACKNOWLEDGED") {
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: "Vendors are only allowed to acknowledge POs.",
        });
      }
    }

    const updated = await updatePOStatus(id, status);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `Purchase Order status updated to ${status} successfully.`,
      data: {
        record: updated,
      },
    });
  } catch (error) {
    console.error("Error updating PO status:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update Purchase Order status.",
      error: error.message,
    });
  }
}

/**
 * @route POST /api/purchase-orders/:id/send
 * @description Mark PO as SENT and email details to the Vendor (Staff only)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER)
 */
async function sendPOController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER" && user.role !== "PROCUREMENT_OFFICER")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Procurement staff or admins only.",
      });
    }

    const { id } = req.params;
    const po = await getPurchaseOrderById(id);

    if (!po) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Purchase Order not found.",
      });
    }

    // Fetch vendor details to get their email address
    const vendor = await getVendorById(po.vendorId);
    if (!vendor || !vendor.user?.email) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Vendor contact email not found.",
      });
    }

    const updated = await updatePOStatus(id, "SENT");

    // Email delivery
    const subject = `Official Purchase Order Issued: ${po.poNumber}`;
    const html = `
      <div style="font-family: Arial; padding: 20px; color: #1e1d1b;">
        <h2>Official Purchase Order Issued</h2>
        <p>Dear ${vendor.companyName},</p>
        <p>An official Purchase Order has been generated and issued to you by the procurement team.</p>
        <hr />
        <p><strong>PO Number:</strong> ${po.poNumber}</p>
        <p><strong>Total Amount:</strong> ${po.currency} ${Number(po.totalAmount).toFixed(2)}</p>
        ${po.expectedDeliveryDate ? `<p><strong>Expected Delivery Date:</strong> ${po.expectedDeliveryDate}</p>` : ''}
        ${po.notes ? `<p><strong>Notes:</strong> ${po.notes}</p>` : ''}
        <hr />
        <p>Please log into the VendorBridge portal to acknowledge and accept this Purchase Order.</p>
        <p>Regards,<br/>Procurement Team</p>
      </div>
    `;

    try {
      await sendEmail({
        to: vendor.user.email,
        subject,
        html,
      });
    } catch (emailErr) {
      console.warn("PO status updated to SENT, but email sending failed:", emailErr.message);
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Purchase Order sent to vendor successfully.",
      data: {
        record: updated,
      },
    });
  } catch (error) {
    console.error("Error sending PO:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to send Purchase Order.",
      error: error.message,
    });
  }
}

/**
 * @route POST /api/purchase-orders/:id/acknowledge
 * @description Vendor acknowledges the PO (Vendors only)
 * @access Private (VENDOR)
 */
async function acknowledgePOController(req, res) {
  try {
    req.body = { status: "ACKNOWLEDGED" };
    return updatePOStatusController(req, res);
  } catch (error) {
    console.error("Error acknowledging PO:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to acknowledge Purchase Order.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/vendors/me/purchase-orders
 * @description Retrieve POs for the logged in vendor
 * @access Private (VENDOR)
 */
async function listVendorPOsController(req, res) {
  try {
    const vendorId = await resolveVendorId(req);
    if (!vendorId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Vendor profile not found for this user.",
      });
    }

    const pos = await listVendorPOs(vendorId);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Vendor Purchase Orders retrieved successfully.",
      data: {
        items: pos,
        total: pos.length,
      },
    });
  } catch (error) {
    console.error("Error listing vendor POs:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve vendor Purchase Orders.",
      error: error.message,
    });
  }
}

export {
  createPurchaseOrderController,
  listPurchaseOrdersController,
  getPurchaseOrderByIdController,
  updatePurchaseOrderController,
  updatePOStatusController,
  sendPOController,
  acknowledgePOController,
  listVendorPOsController,
};
