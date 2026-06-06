import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../config/database.js';
import {
    addRFQItem,
    changeRFQStatus,
    createRFQ,
    createRFQWithItems,
    getRFQById,
    getRFQWithItemsAndVendors,
    inviteVendorToRFQ,
    listRFQs,
    removeRFQItem,
    removeVendorFromRFQ,
    softDeleteRFQ,
    updateRFQ,
    updateRFQItem,
} from '../db/query/rfqs.query.js';
import { rfqItems, rfqVendors } from '../db/schema/rfqs.js';
import { users } from '../db/schema/users.js';
import { vendors } from '../db/schema/vendors.js';

const RFQ_STATUS_TRANSITIONS = {
    DRAFT: new Set(['OPEN', 'REJECTED']),
    OPEN: new Set(['CLOSED', 'REJECTED']),
    CLOSED: new Set(['APPROVED', 'REJECTED']),
    APPROVED: new Set(),
    REJECTED: new Set(),
};

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

function hasOwnProperty(objectValue, key) {
    return Object.prototype.hasOwnProperty.call(objectValue ?? {}, key);
}

function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeDateValue(value) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === '') {
        return null;
    }

    return value instanceof Date ? value : new Date(value);
}

function buildDetailItem(detailPayload) {
    if (!detailPayload) {
        return null;
    }

    return {
        ...detailPayload.rfq,
        items: detailPayload.items,
        vendors: detailPayload.vendors,
    };
}

async function getRfqItemRecord(itemId) {
    const [item] = await db
        .select({
            id: rfqItems.id,
            rfqId: rfqItems.rfqId,
            itemName: rfqItems.itemName,
            quantity: rfqItems.quantity,
            createdAt: rfqItems.createdAt,
        })
        .from(rfqItems)
        .where(eq(rfqItems.id, Number(itemId)))
        .limit(1);

    return item ?? null;
}

async function getInvitationRecord(rfqId, vendorId) {
    const [invitation] = await db
        .select({
            id: rfqVendors.id,
            rfqId: rfqVendors.rfqId,
            vendorId: rfqVendors.vendorId,
            invitedAt: rfqVendors.invitedAt,
        })
        .from(rfqVendors)
        .where(
            and(
                eq(rfqVendors.rfqId, Number(rfqId)),
                eq(rfqVendors.vendorId, Number(vendorId)),
            ),
        )
        .limit(1);

    return invitation ?? null;
}

async function getVendorRecord(vendorId) {
    const [vendor] = await db
        .select({
            id: vendors.id,
            userId: vendors.userId,
            companyName: vendors.companyName,
            gstNumber: vendors.gstNumber,
            categoryId: vendors.categoryId,
            status: vendors.status,
            createdAt: vendors.createdAt,
            updatedAt: vendors.updatedAt,
            contactName: users.name,
            contactEmail: users.email,
            contactPhone: users.phone,
            userDeletedAt: users.deletedAt,
            userIsActive: users.isActive,
        })
        .from(vendors)
        .innerJoin(users, eq(users.id, vendors.userId))
        .where(and(eq(vendors.id, Number(vendorId)), isNull(users.deletedAt)))
        .limit(1);

    if (!vendor || vendor.userIsActive === false) {
        return null;
    }

    return vendor;
}

async function ensureRfqExists(rfqId) {
    const rfq = await getRFQById(rfqId);

    if (!rfq) {
        return {
            error: buildFailure(404, 'RFQ not found.'),
        };
    }

    return { rfq };
}

async function ensureDraftRfq(rfqId, message = 'Only draft RFQs can be modified.') {
    const result = await ensureRfqExists(rfqId);

    if (result.error) {
        return result;
    }

    if (result.rfq.status !== 'DRAFT') {
        return {
            error: buildFailure(400, message),
        };
    }

    return result;
}

export async function createRFQService({ body, userId }) {
    const title = normalizeText(body?.title);
    const items = Array.isArray(body?.items) ? body.items : [];
    const deadline = normalizeDateValue(body?.deadline);
    const requestedStatus = normalizeText(body?.status).toUpperCase();

    if (requestedStatus && requestedStatus !== 'DRAFT') {
        return buildFailure(400, 'New RFQs must be created in DRAFT status.');
    }

    const createPayload = {
        title,
        createdBy: userId,
        deadline,
    };

    const createdResult = items.length
        ? await createRFQWithItems(createPayload, items)
        : {
              rfq: await createRFQ(createPayload),
              items: [],
          };

    if (!createdResult?.rfq) {
        return buildFailure(400, 'Failed to create RFQ.');
    }

    const detail = await getRFQWithItemsAndVendors(createdResult.rfq.id);

    return buildSuccess(201, 'RFQ created successfully.', {
        item:
            buildDetailItem(detail) ?? {
                ...createdResult.rfq,
                items: createdResult.items,
                vendors: [],
            },
    });
}

export async function listRFQsService({ query }) {
    const filters = {
        status: query?.status,
        createdBy: query?.createdBy,
        vendorId: query?.vendorId,
        deadlineFrom: query?.deadlineFrom,
        deadlineTo: query?.deadlineTo,
        search: query?.search,
    };

    const result = await listRFQs({
        filters,
        page: query?.page,
        limit: query?.limit,
        sort: query?.sort,
    });

    return buildSuccess(200, 'RFQs fetched successfully.', {
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
    });
}

export async function getRFQDetailService({ rfqId }) {
    const detail = await getRFQWithItemsAndVendors(rfqId);

    if (!detail) {
        return buildFailure(404, 'RFQ not found.');
    }

    return buildSuccess(200, 'RFQ fetched successfully.', {
        item: buildDetailItem(detail),
    });
}

export async function updateRFQService({ rfqId, body }) {
    const draftCheck = await ensureDraftRfq(
        rfqId,
        'Only draft RFQs can be updated.',
    );

    if (draftCheck.error) {
        return draftCheck.error;
    }

    const changes = {};

    if (hasOwnProperty(body, 'title')) {
        changes.title = normalizeText(body.title);
    }

    if (hasOwnProperty(body, 'deadline')) {
        changes.deadline = normalizeDateValue(body.deadline);
    }

    if (!Object.keys(changes).length) {
        return buildFailure(
            400,
            'At least one RFQ field is required to update.',
        );
    }

    const updatedRfq = await updateRFQ(rfqId, changes);

    if (!updatedRfq) {
        return buildFailure(400, 'Failed to update RFQ.');
    }

    const detail = await getRFQWithItemsAndVendors(rfqId);

    return buildSuccess(200, 'RFQ updated successfully.', {
        item: buildDetailItem(detail) ?? updatedRfq,
    });
}

export async function deleteRFQService({ rfqId }) {
    const draftCheck = await ensureDraftRfq(
        rfqId,
        'Only draft RFQs can be deleted.',
    );

    if (draftCheck.error) {
        return draftCheck.error;
    }

    const deletedRfq = await softDeleteRFQ(rfqId);

    if (!deletedRfq) {
        return buildFailure(404, 'RFQ not found.');
    }

    return buildSuccess(200, 'RFQ deleted successfully.', {
        item: deletedRfq,
    });
}

export async function addRFQItemService({ rfqId, body }) {
    const draftCheck = await ensureDraftRfq(
        rfqId,
        'Only draft RFQs can be edited.',
    );

    if (draftCheck.error) {
        return draftCheck.error;
    }

    const createdItem = await addRFQItem(rfqId, {
        itemName: normalizeText(body?.itemName),
        quantity: body?.quantity,
    });

    if (!createdItem) {
        return buildFailure(400, 'Failed to add RFQ item.');
    }

    return buildSuccess(201, 'RFQ item added successfully.', {
        item: createdItem,
    });
}

export async function updateRFQItemService({ rfqId, itemId, body }) {
    const draftCheck = await ensureDraftRfq(
        rfqId,
        'Only draft RFQs can be edited.',
    );

    if (draftCheck.error) {
        return draftCheck.error;
    }

    const item = await getRfqItemRecord(itemId);

    if (!item || item.rfqId !== Number(rfqId)) {
        return buildFailure(404, 'RFQ item not found.');
    }

    const changes = {};

    if (hasOwnProperty(body, 'itemName')) {
        changes.itemName = normalizeText(body.itemName);
    }

    if (hasOwnProperty(body, 'quantity')) {
        changes.quantity = body.quantity;
    }

    if (!Object.keys(changes).length) {
        return buildFailure(400, 'At least one RFQ item field is required.');
    }

    const updatedItem = await updateRFQItem(itemId, changes);

    if (!updatedItem) {
        return buildFailure(400, 'Failed to update RFQ item.');
    }

    return buildSuccess(200, 'RFQ item updated successfully.', {
        item: updatedItem,
    });
}

export async function deleteRFQItemService({ rfqId, itemId }) {
    const draftCheck = await ensureDraftRfq(
        rfqId,
        'Only draft RFQs can be edited.',
    );

    if (draftCheck.error) {
        return draftCheck.error;
    }

    const item = await getRfqItemRecord(itemId);

    if (!item || item.rfqId !== Number(rfqId)) {
        return buildFailure(404, 'RFQ item not found.');
    }

    const deletedItem = await removeRFQItem(itemId);

    if (!deletedItem) {
        return buildFailure(404, 'RFQ item not found.');
    }

    return buildSuccess(200, 'RFQ item removed successfully.', {
        item: deletedItem,
    });
}

export async function inviteVendorToRFQService({ rfqId, vendorId }) {
    const draftCheck = await ensureDraftRfq(
        rfqId,
        'Only draft RFQs can be edited.',
    );

    if (draftCheck.error) {
        return draftCheck.error;
    }

    const vendor = await getVendorRecord(vendorId);

    if (!vendor) {
        return buildFailure(404, 'Vendor not found.');
    }

    if (vendor.status !== 'APPROVED') {
        return buildFailure(
            400,
            'Only approved vendors can be invited to an RFQ.',
        );
    }

    const existingInvitation = await getInvitationRecord(rfqId, vendorId);

    if (existingInvitation) {
        return buildSuccess(200, 'Vendor is already invited to this RFQ.', {
            item: existingInvitation,
        });
    }

    const invitation = await inviteVendorToRFQ(rfqId, vendorId);

    if (!invitation) {
        return buildFailure(400, 'Failed to invite vendor to RFQ.');
    }

    return buildSuccess(201, 'Vendor invited successfully.', {
        item: invitation,
    });
}

export async function removeVendorFromRFQService({ rfqId, vendorId }) {
    const draftCheck = await ensureDraftRfq(
        rfqId,
        'Only draft RFQs can be edited.',
    );

    if (draftCheck.error) {
        return draftCheck.error;
    }

    const existingInvitation = await getInvitationRecord(rfqId, vendorId);

    if (!existingInvitation) {
        return buildFailure(404, 'Vendor invitation not found.');
    }

    const deletedInvitation = await removeVendorFromRFQ(rfqId, vendorId);

    if (!deletedInvitation) {
        return buildFailure(404, 'Vendor invitation not found.');
    }

    return buildSuccess(200, 'Vendor invitation removed successfully.', {
        item: deletedInvitation,
    });
}

export async function updateRFQStatusService({ rfqId, body }) {
    const rfqCheck = await ensureRfqExists(rfqId);

    if (rfqCheck.error) {
        return rfqCheck.error;
    }

    const currentStatus = rfqCheck.rfq.status;
    const nextStatus = normalizeText(body?.status).toUpperCase();

    if (!nextStatus) {
        return buildFailure(400, 'RFQ status is required.');
    }

    if (currentStatus === nextStatus) {
        return buildFailure(400, `RFQ is already in ${nextStatus} status.`);
    }

    const allowedTransitions = RFQ_STATUS_TRANSITIONS[currentStatus] ?? new Set();

    if (!allowedTransitions.has(nextStatus)) {
        return buildFailure(
            400,
            `RFQ status cannot move from ${currentStatus} to ${nextStatus}.`,
        );
    }

    if (nextStatus === 'OPEN') {
        if (!rfqCheck.rfq.deadline) {
            return buildFailure(
                400,
                'RFQ deadline is required before moving to OPEN.',
            );
        }

        if (rfqCheck.rfq.itemCount === 0) {
            return buildFailure(
                400,
                'At least one RFQ item is required before moving to OPEN.',
            );
        }

        if (rfqCheck.rfq.vendorCount === 0) {
            return buildFailure(
                400,
                'At least one vendor invitation is required before moving to OPEN.',
            );
        }
    }

    // TODO: Enforce quotation and approval prerequisites before APPROVED once those modules are wired.
    const updatedRfq = await changeRFQStatus(rfqId, nextStatus);

    if (!updatedRfq) {
        return buildFailure(400, 'Failed to update RFQ status.');
    }

    const detail = await getRFQWithItemsAndVendors(rfqId);

    return buildSuccess(200, 'RFQ status updated successfully.', {
        item: buildDetailItem(detail) ?? updatedRfq,
    });
}
