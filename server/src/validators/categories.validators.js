import { body, param } from 'express-validator';
import { validateRequest } from './auth.validators.js';

const categoryIdValidator = param('id')
    .notEmpty()
    .withMessage('Category id is required.')
    .isInt({ min: 1 })
    .withMessage('Category id must be a positive integer.')
    .toInt();

const createCategoryValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required.')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters.'),
    body('description')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be at most 500 characters.'),
    validateRequest,
];

const updateCategoryValidator = [
    categoryIdValidator,
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category name cannot be empty.')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters.'),
    body('description')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be at most 500 characters.'),
    validateRequest,
];

const deleteCategoryValidator = [categoryIdValidator, validateRequest];

export {
    createCategoryValidator,
    updateCategoryValidator,
    deleteCategoryValidator,
};
