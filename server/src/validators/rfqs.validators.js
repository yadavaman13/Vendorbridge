import { body, param, query } from 'express-validator';
import { validateRequest } from './auth.validators.js';

const RFQ_STATUSES = ['DRAFT', 'OPEN', 'CLOSED', 'APPROVED', 'REJECTED'];
const RFQ_SORT_PATTERN =
    /^(id|title|status|deadline|createdAt|updatedAt):(asc|desc)$/i;

const rfqIdValidator = param('id')
    .notEmpty()
    .withMessage('RFQ id is required.')
    .isInt({ min: 1 })
    .withMessage('RFQ id must be a positive integer.')
    .toInt();

const itemIdValidator = param('itemId')
    .notEmpty()
    .withMessage('RFQ item id is required.')
    .isInt({ min: 1 })
    .withMessage('RFQ item id must be a positive integer.')
    .toInt();

const vendorIdParamValidator = param('vendorId')
    .notEmpty()
    .withMessage('Vendor id is required.')
    .isInt({ min: 1 })
    .withMessage('Vendor id must be a positive integer.')
    .toInt();

const titleValidator = body('title')
    .trim()
    .notEmpty()
    .withMessage('RFQ title is required.')
    .isLength({ min: 3, max: 255 })
    .withMessage('RFQ title must be between 3 and 255 characters.');

const optionalDeadlineValidator = body('deadline')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Deadline must be a valid ISO date.')
    .toDate();

const itemPayloadValidator = body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array.')
    .custom((items) =>
        items.every(
            (item) =>
                item &&
                typeof item.itemName === 'string' &&
                item.itemName.trim().length >= 2 &&
                Number.isInteger(Number(item.quantity)) &&
                Number(item.quantity) > 0,
        ),
    )
    .withMessage(
        'Each RFQ item must include an itemName and a positive integer quantity.',
    );

const createRFQValidator = [
    titleValidator,
    optionalDeadlineValidator,
    itemPayloadValidator,
    validateRequest,
];

const listRFQsValidator = [
    query('status')
        .optional()
        .trim()
        .toUpperCase()
        .isIn(RFQ_STATUSES)
        .withMessage('Invalid RFQ status filter.'),
    query('createdBy')
        .optional()
        .isInt({ min: 1 })
        .withMessage('createdBy must be a positive integer.')
        .toInt(),
    query('vendorId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('vendorId must be a positive integer.')
        .toInt(),
    query('deadlineFrom')
        .optional()
        .isISO8601()
        .withMessage('deadlineFrom must be a valid ISO date.')
        .toDate(),
    query('deadlineTo')
        .optional()
        .isISO8601()
        .withMessage('deadlineTo must be a valid ISO date.')
        .toDate(),
    query('search')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Search must be at most 255 characters.'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be a positive integer.')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit must be between 1 and 100.')
        .toInt(),
    query('sort')
        .optional()
        .trim()
        .matches(RFQ_SORT_PATTERN)
        .withMessage(
            'sort must match field:direction using id, title, status, deadline, createdAt, or updatedAt.',
        ),
    validateRequest,
];

const getRFQByIdValidator = [rfqIdValidator, validateRequest];

const updateRFQValidator = [
    rfqIdValidator,
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('RFQ title cannot be empty.')
        .isLength({ min: 3, max: 255 })
        .withMessage('RFQ title must be between 3 and 255 characters.'),
    optionalDeadlineValidator,
    body().custom((_, { req }) => {
        if (
            Object.prototype.hasOwnProperty.call(req.body, 'title') ||
            Object.prototype.hasOwnProperty.call(req.body, 'deadline')
        ) {
            return true;
        }

        throw new Error('At least one RFQ field is required.');
    }),
    validateRequest,
];

const deleteRFQValidator = [rfqIdValidator, validateRequest];

const addRFQItemValidator = [
    rfqIdValidator,
    body('itemName')
        .trim()
        .notEmpty()
        .withMessage('Item name is required.')
        .isLength({ min: 2, max: 255 })
        .withMessage('Item name must be between 2 and 255 characters.'),
    body('quantity')
        .notEmpty()
        .withMessage('Quantity is required.')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer.')
        .toInt(),
    validateRequest,
];

const updateRFQItemValidator = [
    rfqIdValidator,
    itemIdValidator,
    body('itemName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Item name cannot be empty.')
        .isLength({ min: 2, max: 255 })
        .withMessage('Item name must be between 2 and 255 characters.'),
    body('quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer.')
        .toInt(),
    body().custom((_, { req }) => {
        if (
            Object.prototype.hasOwnProperty.call(req.body, 'itemName') ||
            Object.prototype.hasOwnProperty.call(req.body, 'quantity')
        ) {
            return true;
        }

        throw new Error('At least one RFQ item field is required.');
    }),
    validateRequest,
];

const deleteRFQItemValidator = [rfqIdValidator, itemIdValidator, validateRequest];

const inviteVendorToRFQValidator = [
    rfqIdValidator,
    body('vendorId')
        .notEmpty()
        .withMessage('Vendor id is required.')
        .isInt({ min: 1 })
        .withMessage('Vendor id must be a positive integer.')
        .toInt(),
    validateRequest,
];

const removeVendorFromRFQValidator = [
    rfqIdValidator,
    vendorIdParamValidator,
    validateRequest,
];

const updateRFQStatusValidator = [
    rfqIdValidator,
    body('status')
        .trim()
        .notEmpty()
        .withMessage('RFQ status is required.')
        .toUpperCase()
        .isIn(RFQ_STATUSES)
        .withMessage('Invalid RFQ status.'),
    validateRequest,
];

export {
    addRFQItemValidator,
    createRFQValidator,
    deleteRFQItemValidator,
    deleteRFQValidator,
    getRFQByIdValidator,
    inviteVendorToRFQValidator,
    listRFQsValidator,
    removeVendorFromRFQValidator,
    updateRFQItemValidator,
    updateRFQStatusValidator,
    updateRFQValidator,
};
