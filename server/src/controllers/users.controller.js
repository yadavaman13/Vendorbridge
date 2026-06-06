import { sendResponse } from "../utils/response.utlis.js";
import {
  getUserById,
  getUsers,
  updateUserRole,
} from "../services/user.service.js";

function parsePagination(query) {
  const page = Number.parseInt(query?.page, 10);
  const limit = Number.parseInt(query?.limit, 10);

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10,
  };
}

async function listUsersController(req, res) {
  try {
    const { page, limit } = parsePagination(req.query);
    const result = await getUsers({ page, limit });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Users fetched successfully.",
      data: result,
    });
  } catch (error) {
    console.error("listUsersController error:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to fetch users.",
      error: "Internal server error",
    });
  }
}

async function getUserByIdController(req, res) {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    const user = await getUserById(userId);

    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "User not found.",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "User fetched successfully.",
      data: { item: user },
    });
  } catch (error) {
    console.error("getUserByIdController error:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to fetch user.",
      error: "Internal server error",
    });
  }
}

async function updateUserRoleController(req, res) {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    const role =
      typeof req.body?.role === "string"
        ? req.body.role.trim().toUpperCase()
        : "";

    if (!role) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Role is required.",
      });
    }

    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "User not found.",
      });
    }

    const updatedUser = await updateUserRole({ userId, role });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "User role updated successfully.",
      data: { item: updatedUser },
    });
  } catch (error) {
    console.error("updateUserRoleController error:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update user role.",
      error: "Internal server error",
    });
  }
}

export { listUsersController, getUserByIdController, updateUserRoleController };
