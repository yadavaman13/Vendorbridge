import { Router } from 'express';
import {
    addRFQItemController,
    createRFQController,
    deleteRFQController,
    deleteRFQItemController,
    getRFQByIdController,
    getRFQsController,
    inviteVendorToRFQController,
    removeVendorFromRFQController,
    updateRFQController,
    updateRFQItemController,
    updateRFQStatusController,
} from '../controllers/rfqs.controller.js';
import {
    authUser,
    isAdminOrProcurementOfficer,
    isProcurementOfficer,
    isVendor,
    isOfficerOrAdmin,
} from '../middlewares/auth.middleware.js';
import {
    createQuotationController,
    getQuotationComparisonController,
} from '../controllers/quotations.controller.js';
import {
    createQuotationValidator,
    rfqIdParamValidator,
} from '../validators/quotations.validators.js';
import {
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
} from '../validators/rfqs.validators.js';

const rfqsRoutes = Router();

/**
 * @route POST /api/rfqs
 * @description Create a new RFQ draft
 * @access Private (PROCUREMENT_OFFICER)
 */
rfqsRoutes.post(
    '/',
    authUser,
    isProcurementOfficer,
    createRFQValidator,
    createRFQController,
);

/**
 * @route GET /api/rfqs
 * @description List RFQs with filters
 * @access Private (ADMIN, PROCUREMENT_OFFICER)
 */
rfqsRoutes.get(
    '/',
    authUser,
    isAdminOrProcurementOfficer,
    listRFQsValidator,
    getRFQsController,
);

/**
 * @route GET /api/rfqs/:id
 * @description Get RFQ details, items, and invited vendors
 * @access Private (ADMIN, PROCUREMENT_OFFICER)
 */
rfqsRoutes.get(
    '/:id',
    authUser,
    isAdminOrProcurementOfficer,
    getRFQByIdValidator,
    getRFQByIdController,
);

/**
 * @route PATCH /api/rfqs/:id
 * @description Update RFQ draft details
 * @access Private (PROCUREMENT_OFFICER)
 */
rfqsRoutes.patch(
    '/:id',
    authUser,
    isProcurementOfficer,
    updateRFQValidator,
    updateRFQController,
);

/**
 * @route DELETE /api/rfqs/:id
 * @description Delete a draft RFQ
 * @access Private (PROCUREMENT_OFFICER)
 */
rfqsRoutes.delete(
    '/:id',
    authUser,
    isProcurementOfficer,
    deleteRFQValidator,
    deleteRFQController,
);

/**
 * @route POST /api/rfqs/:id/items
 * @description Add an RFQ item
 * @access Private (PROCUREMENT_OFFICER)
 */
rfqsRoutes.post(
    '/:id/items',
    authUser,
    isProcurementOfficer,
    addRFQItemValidator,
    addRFQItemController,
);

/**
 * @route PATCH /api/rfqs/:id/items/:itemId
 * @description Update an RFQ item
 * @access Private (PROCUREMENT_OFFICER)
 */
rfqsRoutes.patch(
    '/:id/items/:itemId',
    authUser,
    isProcurementOfficer,
    updateRFQItemValidator,
    updateRFQItemController,
);

/**
 * @route DELETE /api/rfqs/:id/items/:itemId
 * @description Remove an RFQ item
 * @access Private (PROCUREMENT_OFFICER)
 */
rfqsRoutes.delete(
    '/:id/items/:itemId',
    authUser,
    isProcurementOfficer,
    deleteRFQItemValidator,
    deleteRFQItemController,
);

/**
 * @route POST /api/rfqs/:id/vendors
 * @description Invite a vendor to an RFQ
 * @access Private (PROCUREMENT_OFFICER)
 */
rfqsRoutes.post(
    '/:id/vendors',
    authUser,
    isProcurementOfficer,
    inviteVendorToRFQValidator,
    inviteVendorToRFQController,
);

/**
 * @route DELETE /api/rfqs/:id/vendors/:vendorId
 * @description Remove an invited vendor from an RFQ
 * @access Private (PROCUREMENT_OFFICER)
 */
rfqsRoutes.delete(
    '/:id/vendors/:vendorId',
    authUser,
    isProcurementOfficer,
    removeVendorFromRFQValidator,
    removeVendorFromRFQController,
);

/**
 * @route PATCH /api/rfqs/:id/status
 * @description Update the RFQ workflow status
 * @access Private (PROCUREMENT_OFFICER)
 */
rfqsRoutes.patch(
    '/:id/status',
    authUser,
    isProcurementOfficer,
    updateRFQStatusValidator,
    updateRFQStatusController,
);

/**
 * @route POST /api/rfqs/:rfqId/quotations
 * @description Create a quotation draft for an invited RFQ
 * @access Private (VENDOR)
 */
rfqsRoutes.post(
    '/:rfqId/quotations',
    authUser,
    isVendor,
    createQuotationValidator,
    createQuotationController,
);

/**
 * @route GET /api/rfqs/:rfqId/quotations/comparison
 * @description Compare vendor quotations for one RFQ
 * @access Private (ADMIN, PROCUREMENT_OFFICER, MANAGER)
 */
rfqsRoutes.get(
    '/:rfqId/quotations/comparison',
    authUser,
    isOfficerOrAdmin,
    rfqIdParamValidator,
    getQuotationComparisonController,
);

export default rfqsRoutes;
