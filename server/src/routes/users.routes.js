import { Router } from "express";
import { authUser, isAdmin, allowRoles } from "../middlewares/auth.middleware.js";
import {
  getUserByIdController,
  listUsersController,
  updateUserRoleController,
  updateUserController,
  deleteUserController,
} from "../controllers/users.controller.js";
import {
  listUsersValidator,
  userIdParamValidator,
  updateUserRoleValidator,
  updateUserValidator,
} from "../validators/users.validators.js";

const userRoutes = Router();

/**
 * @route GET /api/users
 * @description Admin or Manager lists all users with pagination
 * @access Private (ADMIN, MANAGER)
 */
userRoutes.get("/", authUser, allowRoles("ADMIN", "MANAGER"), listUsersValidator, listUsersController);

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

userRoutes.patch(
  "/:id",
  authUser,
  isAdmin,
  updateUserValidator,
  updateUserController,
);

userRoutes.delete(
  "/:id",
  authUser,
  isAdmin,
  userIdParamValidator,
  deleteUserController,
);

export default userRoutes;
