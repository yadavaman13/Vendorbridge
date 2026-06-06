import { body, param, query, validationResult } from 'express-validator';
import { sendResponse } from '../utils/response.utlis.js';

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse({
            res,
            statusCode: 400,
            success: false,
            message: 'Validation failed.',
            error: errors.array(),
        });
    }
    next();
}

const idParamValidator = [
    param('id').isInt({ min: 1 }).withMessage('Valid ID is required.'),
    validateRequest,
];

const rfqIdParamValidator = [
    param('rfqId').isInt({ min: 1 }).withMessage('Valid RFQ ID is required.'),
    validateRequest,
];

const createQuotationValidator = [
    param('rfqId').isInt({ min: 1 }).withMessage('Valid RFQ ID is required.'),
    body('notes')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Notes must be a string up to 500 characters.'),
    body('items')
        .isArray({ min: 1 })
        .withMessage('Items must be a non-empty array.'),
    body('items.*.rfqItemId')
        .isInt({ min: 1 })
        .withMessage('Valid RFQ Item ID is required.'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer.'),
    body('items.*.unitPrice')
        .isInt({ min: 1 })
        .withMessage('Unit price must be a positive integer.'),
    body('items.*.deliveryDays')
        .isInt({ min: 1 })
        .withMessage('Delivery days must be a positive integer.'),
    validateRequest,
];

const updateQuotationValidator = [
    param('id').isInt({ min: 1 }).withMessage('Valid Quotation ID is required.'),
    body('notes')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Notes must be a string up to 500 characters.'),
    body('items')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Items must be a non-empty array if provided.'),
    body('items.*.rfqItemId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid RFQ Item ID is required.'),
    body('items.*.quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer.'),
    body('items.*.unitPrice')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Unit price must be a positive integer.'),
    body('items.*.deliveryDays')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Delivery days must be a positive integer.'),
    validateRequest,
];

const listQuotationsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer.'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100.'),
    query('rfqId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('rfqId must be a positive integer.'),
    query('vendorId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('vendorId must be a positive integer.'),
    query('status')
        .optional()
        .isIn(['DRAFT', 'SUBMITTED', 'SELECTED', 'REJECTED'])
        .withMessage('Status must be one of DRAFT, SUBMITTED, SELECTED, REJECTED.'),
    validateRequest,
];

export {
    idParamValidator,
    rfqIdParamValidator,
    createQuotationValidator,
    updateQuotationValidator,
    listQuotationsValidator,
};
