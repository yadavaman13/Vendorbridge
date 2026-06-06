import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../config/database.js';
import { categories } from '../db/schema/categories.js';
import { sendResponse } from '../utils/response.utlis.js';

function normalizeCategoryPayload(payload) {
    const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
    const description =
        typeof payload?.description === 'string'
            ? payload.description.trim()
            : null;

    return {
        name,
        description: description || null,
    };
}

async function getCategoriesController(req, res) {
    try {
        const items = await db
            .select({
                id: categories.id,
                name: categories.name,
                description: categories.description,
                isActive: categories.isActive,
                createdAt: categories.createdAt,
                updatedAt: categories.updatedAt,
            })
            .from(categories)
            .where(
                and(
                    eq(categories.isActive, true),
                    isNull(categories.deletedAt),
                ),
            );

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Categories fetched successfully.',
            data: {
                items,
                total: items.length,
            },
        });
    } catch (error) {
        console.error('getCategoriesController error:', error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to fetch categories.',
            error: 'Internal server error',
        });
    }
}

async function createCategoryController(req, res) {
    try {
        const { name, description } = normalizeCategoryPayload(req.body);

        const [existingCategory] = await db
            .select({ id: categories.id })
            .from(categories)
            .where(and(eq(categories.name, name), isNull(categories.deletedAt)))
            .limit(1);

        if (existingCategory) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Category with this name already exists.',
            });
        }

        const [createdCategory] = await db
            .insert(categories)
            .values({
                name,
                description,
                isActive: true,
            })
            .returning();

        return sendResponse({
            res,
            statusCode: 201,
            success: true,
            message: 'Category created successfully.',
            data: {
                item: createdCategory,
            },
        });
    } catch (error) {
        console.error('createCategoryController error:', error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to create category.',
            error: 'Internal server error',
        });
    }
}

async function updateCategoryController(req, res) {
    try {
        const categoryId = Number(req.params.id);
        const payload = normalizeCategoryPayload(req.body);
        const updates = {};

        if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
            updates.name = payload.name;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
            updates.description = payload.description;
        }

        if (!Object.keys(updates).length) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'At least one field is required to update category.',
            });
        }

        if (updates.name) {
            const [duplicateCategory] = await db
                .select({ id: categories.id })
                .from(categories)
                .where(
                    and(
                        eq(categories.name, updates.name),
                        isNull(categories.deletedAt),
                    ),
                )
                .limit(1);

            if (duplicateCategory && duplicateCategory.id !== categoryId) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'Category with this name already exists.',
                });
            }
        }

        const [updatedCategory] = await db
            .update(categories)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(categories.id, categoryId),
                    isNull(categories.deletedAt),
                ),
            )
            .returning();

        if (!updatedCategory) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Category not found.',
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Category updated successfully.',
            data: {
                item: updatedCategory,
            },
        });
    } catch (error) {
        console.error('updateCategoryController error:', error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to update category.',
            error: 'Internal server error',
        });
    }
}

async function deleteCategoryController(req, res) {
    try {
        const categoryId = Number(req.params.id);

        const [deletedCategory] = await db
            .update(categories)
            .set({
                isActive: false,
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(categories.id, categoryId),
                    isNull(categories.deletedAt),
                ),
            )
            .returning();

        if (!deletedCategory) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Category not found.',
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Category removed successfully.',
            data: {
                item: deletedCategory,
            },
        });
    } catch (error) {
        console.error('deleteCategoryController error:', error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to remove category.',
            error: 'Internal server error',
        });
    }
}

export {
    getCategoriesController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController,
};
