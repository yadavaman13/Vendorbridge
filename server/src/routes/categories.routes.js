import { Router } from 'express';
import {
    createCategoryController,
    deleteCategoryController,
    getCategoriesController,
    updateCategoryController,
} from '../controllers/categories.controller.js';
import { authUser, isAdmin } from '../middlewares/auth.middleware.js';
import {
    createCategoryValidator,
    deleteCategoryValidator,
    updateCategoryValidator,
} from '../validators/categories.validators.js';

const categoriesRoutes = Router();

/**
 * @route GET /api/categories
 * @description List categories
 * @access Private
 */
categoriesRoutes.get('/', authUser, getCategoriesController);

/**
 * @route POST /api/categories
 * @description Create category
 * @access Private (ADMIN)
 */
categoriesRoutes.post(
    '/',
    authUser,
    isAdmin,
    createCategoryValidator,
    createCategoryController,
);

/**
 * @route PATCH /api/categories/:id
 * @description Update category
 * @access Private (ADMIN)
 */
categoriesRoutes.patch(
    '/:id',
    authUser,
    isAdmin,
    updateCategoryValidator,
    updateCategoryController,
);

/**
 * @route DELETE /api/categories/:id
 * @description Soft-delete category
 * @access Private (ADMIN)
 */
categoriesRoutes.delete(
    '/:id',
    authUser,
    isAdmin,
    deleteCategoryValidator,
    deleteCategoryController,
);

export default categoriesRoutes;
