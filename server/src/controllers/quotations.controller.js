import {
    createQuotationService,
    listQuotationsService,
    getQuotationDetailService,
    updateQuotationService,
    submitQuotationService,
    getQuotationComparisonService,
    selectQuotationService,
    rejectQuotationService,
} from '../services/quotations.service.js';
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

async function createQuotationController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'createQuotationController',
        failureMessage: 'Failed to create quotation.',
        operation: () =>
            createQuotationService({
                rfqId: req.params.rfqId,
                body: req.body,
                userId: req.user.id,
            }),
    });
}

async function listQuotationsController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'listQuotationsController',
        failureMessage: 'Failed to fetch quotations.',
        operation: () =>
            listQuotationsService({
                query: req.query,
                user: req.user,
            }),
    });
}

async function getQuotationByIdController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'getQuotationByIdController',
        failureMessage: 'Failed to fetch quotation details.',
        operation: () =>
            getQuotationDetailService({
                id: req.params.id,
                user: req.user,
            }),
    });
}

async function updateQuotationController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'updateQuotationController',
        failureMessage: 'Failed to update quotation.',
        operation: () =>
            updateQuotationService({
                id: req.params.id,
                body: req.body,
                user: req.user,
            }),
    });
}

async function submitQuotationController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'submitQuotationController',
        failureMessage: 'Failed to submit quotation.',
        operation: () =>
            submitQuotationService({
                id: req.params.id,
                user: req.user,
            }),
    });
}

async function getQuotationComparisonController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'getQuotationComparisonController',
        failureMessage: 'Failed to fetch quotation comparison.',
        operation: () =>
            getQuotationComparisonService({
                rfqId: req.params.rfqId,
            }),
    });
}

async function selectQuotationController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'selectQuotationController',
        failureMessage: 'Failed to select quotation.',
        operation: () =>
            selectQuotationService({
                id: req.params.id,
            }),
    });
}

async function rejectQuotationController(req, res) {
    return handleServiceResponse({
        res,
        logLabel: 'rejectQuotationController',
        failureMessage: 'Failed to reject quotation.',
        operation: () =>
            rejectQuotationService({
                id: req.params.id,
            }),
    });
}

export {
    createQuotationController,
    listQuotationsController,
    getQuotationByIdController,
    updateQuotationController,
    submitQuotationController,
    getQuotationComparisonController,
    selectQuotationController,
    rejectQuotationController,
};
