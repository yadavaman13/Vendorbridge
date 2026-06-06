import {
  getVendorsList,
  getVendorById,
  getVendorByUserId,
  updateVendorStatus,
} from "../services/vendors.service.js";
import { sendResponse } from "../utils/response.utlis.js";

async function getVendorsController(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const { items, total } = await getVendorsList({ page, limit, status });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Vendors retrieved successfully.",
      data: { items, total, page, limit },
    });
  } catch (error) {
    console.error("Error retrieving vendors:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve vendors.",
      error: error.message,
    });
  }
}

async function getVendorByIdController(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid vendor ID format.",
      });
    }

    const vendor = await getVendorById(id);
    if (!vendor) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Vendor not found.",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Vendor retrieved successfully.",
      data: { record: vendor },
    });
  } catch (error) {
    console.error("Error retrieving vendor details:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve vendor details.",
      error: error.message,
    });
  }
}

async function patchVendorStatusController(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid vendor ID format.",
      });
    }

    const { status } = req.body;
    if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status.toUpperCase())) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid status value. Must be PENDING, APPROVED, or REJECTED.",
      });
    }

    const updated = await updateVendorStatus(id, status);
    if (!updated) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Vendor not found.",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `Vendor onboarding status updated to ${status.toUpperCase()}.`,
      data: { record: updated },
    });
  } catch (error) {
    console.error("Error updating vendor status:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update vendor status.",
      error: error.message,
    });
  }
}

async function getVendorMeController(req, res) {
  try {
    const userId = req.user.id;
    const vendor = await getVendorByUserId(userId);
    if (!vendor) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Vendor profile not found for this user.",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "My vendor profile retrieved successfully.",
      data: { record: vendor },
    });
  } catch (error) {
    console.error("Error retrieving own vendor profile:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve own vendor profile.",
      error: error.message,
    });
  }
}

export {
  getVendorsController,
  getVendorByIdController,
  patchVendorStatusController,
  getVendorMeController,
};
