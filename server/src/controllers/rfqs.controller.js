import {
    addRFQItemService,
    createRFQService,
    deleteRFQItemService,
    deleteRFQService,
    getRFQDetailService,
    inviteVendorToRFQService,
    listRFQsService,
    removeVendorFromRFQService,
    updateRFQItemService,
    updateRFQService,
    updateRFQStatusService,
} from '../services/rfqs.service.js';
import { sendResponse } from '../utils/response.utlis.js';

async function handleServiceResponse({
    res,
    operation,
    failureMessage,
    logLabel,
}) {
    try {
        const result = await operation();

        return sendResponse({
            res,
            ...result,
        });
    } catch (error) {
        console.error(`${logLabel} error:`, error);

        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: failureMessage,
            error: 'Internal server error',
        });
    }
}

async function createRFQController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'createRFQController',
        failureMessage: 'Failed to create RFQ.',
        operation: () =>
            createRFQService({
                body: req.body,
                userId: req.user.id,
            }),
    });
}

async function getRFQsController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'getRFQsController',
        failureMessage: 'Failed to fetch RFQs.',
        operation: () =>
            listRFQsService({
                query: req.query,
            }),
    });
}

async function getRFQByIdController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'getRFQByIdController',
        failureMessage: 'Failed to fetch RFQ.',
        operation: () =>
            getRFQDetailService({
                rfqId: req.params.id,
            }),
    });
}

async function updateRFQController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'updateRFQController',
        failureMessage: 'Failed to update RFQ.',
        operation: () =>
            updateRFQService({
                rfqId: req.params.id,
                body: req.body,
            }),
    });
}

async function deleteRFQController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'deleteRFQController',
        failureMessage: 'Failed to delete RFQ.',
        operation: () =>
            deleteRFQService({
                rfqId: req.params.id,
            }),
    });
}

async function addRFQItemController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'addRFQItemController',
        failureMessage: 'Failed to add RFQ item.',
        operation: () =>
            addRFQItemService({
                rfqId: req.params.id,
                body: req.body,
            }),
    });
}

async function updateRFQItemController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'updateRFQItemController',
        failureMessage: 'Failed to update RFQ item.',
        operation: () =>
            updateRFQItemService({
                rfqId: req.params.id,
                itemId: req.params.itemId,
                body: req.body,
            }),
    });
}

async function deleteRFQItemController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'deleteRFQItemController',
        failureMessage: 'Failed to remove RFQ item.',
        operation: () =>
            deleteRFQItemService({
                rfqId: req.params.id,
                itemId: req.params.itemId,
            }),
    });
}

async function inviteVendorToRFQController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'inviteVendorToRFQController',
        failureMessage: 'Failed to invite vendor to RFQ.',
        operation: () =>
            inviteVendorToRFQService({
                rfqId: req.params.id,
                vendorId: req.body.vendorId,
            }),
    });
}

async function removeVendorFromRFQController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'removeVendorFromRFQController',
        failureMessage: 'Failed to remove vendor from RFQ.',
        operation: () =>
            removeVendorFromRFQService({
                rfqId: req.params.id,
                vendorId: req.params.vendorId,
            }),
    });
}

async function updateRFQStatusController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'updateRFQStatusController',
        failureMessage: 'Failed to update RFQ status.',
        operation: () =>
            updateRFQStatusService({
                rfqId: req.params.id,
                body: req.body,
            }),
    });
}

export {
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
};
