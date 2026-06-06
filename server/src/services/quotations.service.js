import { and, eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import {
    listQuotations,
    getQuotationById,
    createQuotationWithItems,
    updateQuotation,
    selectQuotation,
    rejectQuotation,
} from '../db/query/quotation.query.js';
import { getVendorByUserId } from '../db/query/vendor.query.js';
import { getRFQById, getRFQQuotationsComparison } from '../db/query/rfqs.query.js';
import { quotations, quotationItems, rfqVendors, rfqItems } from '../db/schema/schema.js';

function buildSuccess(statusCode, message, data = {}) {
    return {
        statusCode,
        success: true,
        message,
        data,
    };
}

function buildFailure(statusCode, message, error = null, data = null) {
    return {
        statusCode,
        success: false,
        message,
        ...(error ? { error } : {}),
        ...(data ? { data } : {}),
    };
}

export async function createQuotationService({ rfqId, body, userId }) {
    try {
        const vendor = await getVendorByUserId(userId);
        if (!vendor) {
            return buildFailure(404, 'Vendor profile not found for user.');
        }

        if (vendor.status !== 'APPROVED') {
            return buildFailure(400, 'Vendor onboarding status must be APPROVED to create quotations.');
        }

        const rfq = await getRFQById(rfqId);
        if (!rfq) {
            return buildFailure(404, 'RFQ not found.');
        }

        if (rfq.status !== 'OPEN') {
            return buildFailure(400, 'Quotations can only be created for OPEN RFQs.');
        }

        const [invitation] = await db
            .select()
            .from(rfqVendors)
            .where(
                and(
                    eq(rfqVendors.rfqId, Number(rfqId)),
                    eq(rfqVendors.vendorId, vendor.id)
                )
            )
            .limit(1);

        if (!invitation) {
            return buildFailure(400, 'Vendor is not invited to this RFQ.');
        }

        const [existingQuotation] = await db
            .select()
            .from(quotations)
            .where(
                and(
                    eq(quotations.rfqId, Number(rfqId)),
                    eq(quotations.vendorId, vendor.id)
                )
            )
            .limit(1);

        if (existingQuotation) {
            return buildFailure(400, 'Quotation already exists for this RFQ.');
        }

        const rfqItemsList = await db
            .select()
            .from(rfqItems)
            .where(eq(rfqItems.rfqId, Number(rfqId)));
        
        const rfqItemIds = new Set(rfqItemsList.map((item) => item.id));

        for (const item of body.items) {
            if (!rfqItemIds.has(Number(item.rfqItemId))) {
                return buildFailure(400, `Invalid rfqItemId ${item.rfqItemId} for this RFQ.`);
            }
        }

        const itemsArray = body.items.map((item) => {
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);
            return {
                rfqItemId: Number(item.rfqItemId),
                quantity,
                unitPrice,
                lineTotal: quantity * unitPrice,
                deliveryDays: Number(item.deliveryDays),
            };
        });

        const totalAmount = itemsArray.reduce((sum, item) => sum + item.lineTotal, 0);

        const quotationPayload = {
            rfqId: Number(rfqId),
            vendorId: vendor.id,
            createdBy: Number(userId),
            totalAmount,
            notes: body.notes || null,
            status: 'DRAFT',
        };

        const result = await createQuotationWithItems(quotationPayload, itemsArray);

        return buildSuccess(201, 'Quotation draft created successfully.', { item: result });
    } catch (error) {
        console.error('createQuotationService error:', error);
        return buildFailure(500, 'Failed to create quotation.', error.message);
    }
}

export async function listQuotationsService({ query, user }) {
    try {
        const filters = {};

        if (user.role === 'VENDOR') {
            const vendor = await getVendorByUserId(user.id);
            if (!vendor) {
                return buildSuccess(200, 'Quotations fetched successfully.', { items: [], total: 0 });
            }
            filters.vendorId = vendor.id;
        } else {
            if (query.vendorId) {
                filters.vendorId = Number(query.vendorId);
            }
        }

        if (query.rfqId) {
            filters.rfqId = Number(query.rfqId);
        }

        if (query.status) {
            filters.status = query.status;
        }

        const result = await listQuotations({
            filters,
            page: query.page,
            limit: query.limit,
            sort: query.sort,
            order: query.order || 'desc',
        });

        return buildSuccess(200, 'Quotations fetched successfully.', {
            items: result.items,
            total: result.total,
            page: Number(query.page) || 1,
            limit: Number(query.limit) || 10,
        });
    } catch (error) {
        console.error('listQuotationsService error:', error);
        return buildFailure(500, 'Failed to list quotations.', error.message);
    }
}

export async function getQuotationDetailService({ id, user }) {
    try {
        const quotation = await getQuotationById(id);
        if (!quotation) {
            return buildFailure(404, 'Quotation not found.');
        }

        if (user.role === 'VENDOR') {
            const vendor = await getVendorByUserId(user.id);
            if (!vendor || quotation.vendorId !== vendor.id) {
                return buildFailure(401, 'Unauthorized to view this quotation.');
            }
        }

        return buildSuccess(200, 'Quotation fetched successfully.', { item: quotation });
    } catch (error) {
        console.error('getQuotationDetailService error:', error);
        return buildFailure(500, 'Failed to fetch quotation details.', error.message);
    }
}

export async function updateQuotationService({ id, body, user }) {
    try {
        const quotation = await getQuotationById(id);
        if (!quotation) {
            return buildFailure(404, 'Quotation not found.');
        }

        const vendor = await getVendorByUserId(user.id);
        if (!vendor || quotation.vendorId !== vendor.id) {
            return buildFailure(401, 'Unauthorized to update this quotation.');
        }

        if (quotation.status !== 'DRAFT') {
            return buildFailure(400, 'Only draft quotations can be updated.');
        }

        const result = await db.transaction(async (trx) => {
            let totalAmount = quotation.totalAmount;

            if (body.items) {
                const rfqItemsList = await trx
                    .select()
                    .from(rfqItems)
                    .where(eq(rfqItems.rfqId, quotation.rfqId));
                
                const rfqItemIds = new Set(rfqItemsList.map((item) => item.id));

                for (const item of body.items) {
                    if (!rfqItemIds.has(Number(item.rfqItemId))) {
                        throw new Error(`Invalid rfqItemId ${item.rfqItemId} for this RFQ.`);
                    }
                }

                totalAmount = body.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

                await trx.delete(quotationItems).where(eq(quotationItems.quotationId, Number(id)));

                const itemsToInsert = body.items.map((item) => {
                    const quantity = Number(item.quantity);
                    const unitPrice = Number(item.unitPrice);
                    return {
                        quotationId: Number(id),
                        rfqItemId: Number(item.rfqItemId),
                        quantity,
                        unitPrice,
                        lineTotal: quantity * unitPrice,
                        deliveryDays: Number(item.deliveryDays),
                    };
                });

                await trx.insert(quotationItems).values(itemsToInsert);
            }

            const changes = {
                notes: body.notes !== undefined ? body.notes : quotation.notes,
                totalAmount,
            };

            await updateQuotation(id, changes, { trx });
        });

        const updatedDetail = await getQuotationById(id);
        return buildSuccess(200, 'Quotation updated successfully.', { item: updatedDetail });
    } catch (error) {
        console.error('updateQuotationService error:', error);
        return buildFailure(400, error.message || 'Failed to update quotation.');
    }
}

export async function submitQuotationService({ id, user }) {
    try {
        const quotation = await getQuotationById(id);
        if (!quotation) {
            return buildFailure(404, 'Quotation not found.');
        }

        const vendor = await getVendorByUserId(user.id);
        if (!vendor || quotation.vendorId !== vendor.id) {
            return buildFailure(401, 'Unauthorized to submit this quotation.');
        }

        if (quotation.status !== 'DRAFT') {
            return buildFailure(400, 'Only draft quotations can be submitted.');
        }

        const updated = await updateQuotation(id, {
            status: 'SUBMITTED',
            submittedAt: new Date(),
        });

        if (!updated) {
            return buildFailure(400, 'Failed to submit quotation.');
        }

        const finalQuotation = await getQuotationById(id);
        return buildSuccess(200, 'Quotation submitted successfully.', { item: finalQuotation });
    } catch (error) {
        console.error('submitQuotationService error:', error);
        return buildFailure(500, 'Failed to submit quotation.', error.message);
    }
}

export async function getQuotationComparisonService({ rfqId }) {
    try {
        const rfq = await getRFQById(rfqId);
        if (!rfq) {
            return buildFailure(404, 'RFQ not found.');
        }

        const comparison = await getRFQQuotationsComparison(rfqId);
        return buildSuccess(200, 'Quotation comparison fetched successfully.', comparison);
    } catch (error) {
        console.error('getQuotationComparisonService error:', error);
        return buildFailure(500, 'Failed to fetch quotation comparison.', error.message);
    }
}

export async function selectQuotationService({ id }) {
    try {
        const quotation = await getQuotationById(id);
        if (!quotation) {
            return buildFailure(404, 'Quotation not found.');
        }

        if (quotation.status !== 'SUBMITTED') {
            return buildFailure(400, 'Only submitted quotations can be selected.');
        }

        const rfq = await getRFQById(quotation.rfqId);
        if (!rfq) {
            return buildFailure(404, 'Parent RFQ not found.');
        }

        if (rfq.status !== 'CLOSED') {
            return buildFailure(400, 'Winning quotation can only be selected for CLOSED RFQs.');
        }

        await db.transaction(async (trx) => {
            await selectQuotation(id, { trx });
            
            await trx
                .update(quotations)
                .set({ status: 'REJECTED', updatedAt: new Date() })
                .where(
                    and(
                        eq(quotations.rfqId, quotation.rfqId),
                        eq(quotations.status, 'SUBMITTED'),
                        sql`${quotations.id} != ${Number(id)}`
                    )
                );
        });

        const updatedQuotation = await getQuotationById(id);
        return buildSuccess(200, 'Quotation selected as winning bid successfully.', { item: updatedQuotation });
    } catch (error) {
        console.error('selectQuotationService error:', error);
        return buildFailure(500, 'Failed to select quotation.', error.message);
    }
}

export async function rejectQuotationService({ id }) {
    try {
        const quotation = await getQuotationById(id);
        if (!quotation) {
            return buildFailure(404, 'Quotation not found.');
        }

        if (quotation.status !== 'SUBMITTED') {
            return buildFailure(400, 'Only submitted quotations can be rejected.');
        }

        await rejectQuotation(id);

        const updatedQuotation = await getQuotationById(id);
        return buildSuccess(200, 'Quotation rejected successfully.', { item: updatedQuotation });
    } catch (error) {
        console.error('rejectQuotationService error:', error);
        return buildFailure(500, 'Failed to reject quotation.', error.message);
    }
}
