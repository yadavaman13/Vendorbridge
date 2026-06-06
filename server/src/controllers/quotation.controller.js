import {
  listQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  selectQuotation,
  rejectQuotation,
} from "../db/query/quotation.query.js";
import { getVendorByUserId } from "../db/query/vendor.query.js";
import { sendResponse } from "../utils/response.utlis.js";

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
  return null;
}

/**
 * @route GET /api/quotations
 * @description List quotations
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
export async function listQuotationsController(req, res) {
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

    const { rfqId, status, page, limit } = req.query || {};
    const filters = {};
    if (rfqId) filters.rfqId = Number(rfqId);
    if (status) filters.status = String(status);

    // Vendors can only see their own bids
    if (user.role === "VENDOR") {
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: "Vendor profile not found.",
        });
      }
      filters.vendorId = vendorId;
    }

    const { items, total } = await listQuotations({
      filters,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Quotations retrieved successfully.",
      data: {
        items,
        total,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      },
    });
  } catch (error) {
    console.error("Error listing quotations:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve quotations.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/quotations/:id
 * @description Get quotation details
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
export async function getQuotationByIdController(req, res) {
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
    const quotation = await getQuotationById(id);

    if (!quotation) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Quotation not found.",
      });
    }

    // Vendor auth check
    if (user.role === "VENDOR") {
      const vendorId = await resolveVendorId(req);
      if (quotation.vendorId !== vendorId) {
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "Forbidden. You can only view your own quotations.",
        });
      }
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Quotation details retrieved successfully.",
      data: {
        record: quotation,
      },
    });
  } catch (error) {
    console.error("Error getting quotation detail:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve quotation details.",
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/quotations/:id/select
 * @description Select quotation as winning bid (Staff only)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER)
 */
export async function selectQuotationController(req, res) {
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
    const quotation = await getQuotationById(id);
    if (!quotation) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Quotation not found.",
      });
    }

    const updated = await selectQuotation(id);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Quotation approved/selected successfully.",
      data: {
        record: updated,
      },
    });
  } catch (error) {
    console.error("Error selecting quotation:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to select quotation.",
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/quotations/:id/reject
 * @description Reject quotation (Staff only)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER)
 */
export async function rejectQuotationController(req, res) {
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
    const quotation = await getQuotationById(id);
    if (!quotation) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Quotation not found.",
      });
    }

    const updated = await rejectQuotation(id);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Quotation rejected successfully.",
      data: {
        record: updated,
      },
    });
  } catch (error) {
    console.error("Error rejecting quotation:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to reject quotation.",
      error: error.message,
    });
  }
}
