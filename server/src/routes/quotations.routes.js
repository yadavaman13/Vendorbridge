import { Router } from 'express';
import {
    listQuotationsController,
    getQuotationByIdController,
    updateQuotationController,
    submitQuotationController,
    selectQuotationController,
    rejectQuotationController,
} from '../controllers/quotations.controller.js';
import { authUser, isVendor, allowRoles } from '../middlewares/auth.middleware.js';
import {
    idParamValidator,
    updateQuotationValidator,
    listQuotationsValidator,
} from '../validators/quotations.validators.js';

const quotationsRoutes = Router();

/**
 * @route GET /api/quotations
 * @description List quotations with filters
 * @access Private (ADMIN, PROCUREMENT_OFFICER, MANAGER, VENDOR)
 */
quotationsRoutes.get(
    '/',
    authUser,
    listQuotationsValidator,
    listQuotationsController
);

/**
 * @route GET /api/quotations/:id
 * @description Get quotation details and items
 * @access Private (ADMIN, PROCUREMENT_OFFICER, MANAGER, VENDOR)
 */
quotationsRoutes.get(
    '/:id',
    authUser,
    idParamValidator,
    getQuotationByIdController
);

/**
 * @route PATCH /api/quotations/:id
 * @description Update draft quotation details/items
 * @access Private (VENDOR)
 */
quotationsRoutes.patch(
    '/:id',
    authUser,
    isVendor,
    updateQuotationValidator,
    updateQuotationController
);

/**
 * @route POST /api/quotations/:id/submit
 * @description Submit draft quotation
 * @access Private (VENDOR)
 */
quotationsRoutes.post(
    '/:id/submit',
    authUser,
    isVendor,
    idParamValidator,
    submitQuotationController
);

/**
 * @route PATCH /api/quotations/:id/select
 * @description Select quotation as winning bid
 * @access Private (PROCUREMENT_OFFICER, MANAGER)
 */
quotationsRoutes.patch(
    '/:id/select',
    authUser,
    allowRoles('PROCUREMENT_OFFICER', 'MANAGER'),
    idParamValidator,
    selectQuotationController
);

/**
 * @route PATCH /api/quotations/:id/reject
 * @description Reject quotation
 * @access Private (PROCUREMENT_OFFICER, MANAGER)
 */
quotationsRoutes.patch(
    '/:id/reject',
    authUser,
    allowRoles('PROCUREMENT_OFFICER', 'MANAGER'),
    idParamValidator,
    rejectQuotationController
);

export default quotationsRoutes;
