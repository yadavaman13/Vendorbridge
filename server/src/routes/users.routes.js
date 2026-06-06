import { Router } from "express";
import { authUser, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getUserByIdController,
  listUsersController,
  updateUserRoleController,
} from "../controllers/users.controller.js";
import {
  listUsersValidator,
  userIdParamValidator,
  updateUserRoleValidator,
} from "../validators/users.validators.js";

const userRoutes = Router();

/**
 * @route GET /api/users
 * @description Admin lists all users with pagination
 * @access Private (ADMIN)
 */
userRoutes.get("/", authUser, isAdmin, listUsersValidator, listUsersController);

/**
 * @route GET /api/users/:id
 * @description Admin views a single user
 * @access Private (ADMIN)
 */
userRoutes.get("/:id", authUser, isAdmin, userIdParamValidator, getUserByIdController);

/**
 * @route PATCH /api/users/:id/role
 * @description Admin changes a user's role
 * @access Private (ADMIN)
 */
userRoutes.patch(
  "/:id/role",
  authUser,
  isAdmin,
  updateUserRoleValidator,
  updateUserRoleController,
);

export default userRoutes;
