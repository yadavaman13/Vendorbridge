import {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  softDeleteInvoice,
} from "../db/query/invoice.query.js";
import { getVendorByUserId, getVendorById } from "../db/query/vendor.query.js";
import { sendResponse } from "../utils/response.utlis.js";
import { generateInvoicePdf } from "../services/pdf.service.js";
import { sendEmail } from "../services/mail/mail.service.js";

/**
 * Helper to check and resolve vendor ID for current user
 */
async function resolveVendorId(req) {
  if (req.user?.role === "VENDOR") {
    const vendor = await getVendorByUserId(req.user.id);
    return vendor ? vendor.id : null;
  }
  return null;
}

/**
 * @route POST /api/invoices
 * @description Generate invoice from a PO (Vendors only)
 * @access Private (VENDOR)
 */
async function createInvoiceController(req, res) {
  try {
    const {
      poId,
      invoiceNumber,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      dueDate,
      paymentTerms,
      notes,
    } = req.body || {};

    if (!invoiceNumber || !subtotal || !totalAmount) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invoice number, subtotal, and total amount are required.",
      });
    }

    let resolvedVendorId = await resolveVendorId(req);
    
    // If user is not a VENDOR (e.g. PROCUREMENT_OFFICER), resolve vendorId from the Purchase Order
    if (!resolvedVendorId && poId) {
      const { getPurchaseOrderById } = await import("../db/query/purchase-order.query.js");
      const po = await getPurchaseOrderById(Number(poId));
      if (po) {
        resolvedVendorId = po.vendorId;
      }
    }

    if (!resolvedVendorId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Failed to resolve vendor association for this invoice.",
      });
    }

    const created = await createInvoice({
      invoiceNumber: String(invoiceNumber).trim(),
      poId: poId ? Number(poId) : null,
      vendorId: resolvedVendorId,
      issuedBy: req.user.id,
      status: "GENERATED",
      subtotal: String(subtotal),
      taxAmount: taxAmount ? String(taxAmount) : "0",
      discountAmount: discountAmount ? String(discountAmount) : "0",
      totalAmount: String(totalAmount),
      dueDate,
      paymentTerms,
      notes,
    });

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "Invoice generated successfully.",
      data: {
        record: created,
      },
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to generate invoice.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/invoices
 * @description List invoices (Role-aware: Vendors only see their own)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function listInvoicesController(req, res) {
  try {
    const vendorId = await resolveVendorId(req);
    if (req.user?.role === "VENDOR" && !vendorId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Vendor profile not found.",
      });
    }

    const { status, invoiceNumber, page, limit } = req.query || {};

    const filters = {};
    if (status) filters.status = String(status);
    if (invoiceNumber) filters.invoiceNumber = String(invoiceNumber);
    
    // Vendors are restricted to their own vendor ID
    if (req.user?.role === "VENDOR") {
      filters.vendorId = vendorId;
    } else if (req.query.vendorId) {
      filters.vendorId = Number(req.query.vendorId);
    }

    const { items, total } = await listInvoices({
      filters,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Invoices retrieved successfully.",
      data: {
        items,
        total,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      },
    });
  } catch (error) {
    console.error("Error listing invoices:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve invoices.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/invoices/:id
 * @description View invoice details
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function getInvoiceByIdController(req, res) {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Invoice not found.",
      });
    }

    // Authorization check for Vendors
    if (req.user?.role === "VENDOR") {
      const vendorId = await resolveVendorId(req);
      if (invoice.vendorId !== vendorId) {
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "Forbidden. You can only view your own invoices.",
        });
      }
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Invoice details retrieved successfully.",
      data: {
        record: invoice,
      },
    });
  } catch (error) {
    console.error("Error getting invoice details:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve invoice details.",
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/invoices/:id
 * @description Update editable fields on an invoice (notes, paymentTerms, amountPaid)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function updateInvoiceController(req, res) {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Invoice not found.",
      });
    }

    // Authorization check for Vendors
    if (req.user?.role === "VENDOR") {
      const vendorId = await resolveVendorId(req);
      if (invoice.vendorId !== vendorId) {
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "Forbidden. You can only modify your own invoices.",
        });
      }
    }

    const { notes, paymentTerms, amountPaid, dueDate, status } = req.body || {};

    const updated = await updateInvoice(id, {
      notes,
      paymentTerms,
      amountPaid,
      dueDate,
      status,
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Invoice updated successfully.",
      data: {
        record: updated,
      },
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update invoice.",
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/invoices/:id/status
 * @description Update lifecycle status of an invoice
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function updateInvoiceStatusController(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Status is required.",
      });
    }

    const invoice = await getInvoiceById(id);
    if (!invoice) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Invoice not found.",
      });
    }

    // Vendor authorization
    if (req.user?.role === "VENDOR") {
      const vendorId = await resolveVendorId(req);
      if (invoice.vendorId !== vendorId) {
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "Forbidden. You can only update your own invoices.",
        });
      }
    }

    const updated = await updateInvoiceStatus(id, status);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `Invoice status updated to ${status} successfully.`,
      data: {
        record: updated,
      },
    });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update invoice status.",
      error: error.message,
    });
  }
}

/**
 * @route POST /api/invoices/:id/send
 * @description Mark an invoice as SENT
 * @access Private (VENDOR)
 */
async function sendInvoiceController(req, res) {
  try {
    req.body = { status: "SENT" };
    return updateInvoiceStatusController(req, res);
  } catch (error) {
    console.error("Error sending invoice:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to send invoice.",
      error: error.message,
    });
  }
}

/**
 * @route POST /api/invoices/:id/email
 * @description Send an email notification of the invoice with the PDF attached
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function emailInvoiceController(req, res) {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Invoice not found.",
      });
    }

    // Resolve vendor email
    const vendor = await getVendorById(invoice.vendorId);
    if (!vendor || !vendor.user?.email) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Vendor email address not found.",
      });
    }

    // Generate actual PDF buffer
    const pdfBuffer = await generateInvoicePdf(invoice);

    const subject = `Invoice Issued: ${invoice.invoiceNumber}`;
    const html = `
      <div style="font-family: Arial; padding: 20px; color: #1e1d1b;">
        <h2>Invoice Notification</h2>
        <p>Dear Customer,</p>
        <p>An official invoice has been generated for your procurement order.</p>
        <hr />
        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Total Amount:</strong> ${invoice.currency} ${Number(invoice.totalAmount).toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
        <hr />
        <p>Please find the attached PDF invoice for your records.</p>
        <p>Regards,<br/>VendorBridge Hub</p>
      </div>
    `;

    try {
      await sendEmail({
        to: vendor.user.email,
        subject,
        html,
        attachments: [
          {
            filename: `invoice_${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }
        ]
      });
    } catch (emailErr) {
      console.warn("Invoice generated, but PDF email sending failed:", emailErr.message);
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Invoice emailed successfully (processed).",
    });
  } catch (error) {
    console.error("Error emailing invoice:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to email invoice.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/invoices/:id/download
 * @description Download PDF format of the invoice (returns metadata)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function downloadInvoicePdfController(req, res) {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Invoice not found.",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "PDF download request processed.",
      data: {
        downloadUrl: `/api/invoices/${id}/download/file`,
        fileName: `invoice_${invoice.invoiceNumber}.pdf`,
      },
    });
  } catch (error) {
    console.error("Error downloading invoice PDF:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to download PDF.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/invoices/:id/download/file
 * @description Serves physical PDF format of the invoice as download stream
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function downloadInvoicePdfFileController(req, res) {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found."
      });
    }

    // Generate actual PDF buffer
    const pdfBuffer = await generateInvoicePdf(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice.invoiceNumber}.pdf`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Error generating physical PDF file download:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download physical invoice PDF file.",
      error: error.message
    });
  }
}

/**
 * @route GET /api/invoices/:id/print
 * @description Get printable invoice representation
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER, VENDOR)
 */
async function printInvoiceController(req, res) {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Invoice not found.",
      });
    }

    const printHtml = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>INVOICE: ${invoice.invoiceNumber}</h2>
        <p><strong>Status:</strong> ${invoice.status}</p>
        <p><strong>Vendor Company:</strong> ${invoice.companyName}</p>
        <p><strong>PO Reference ID:</strong> ${invoice.poId || 'N/A'}</p>
        <hr/>
        <p><strong>Subtotal:</strong> ${invoice.currency} ${invoice.subtotal}</p>
        <p><strong>Tax Amount:</strong> ${invoice.currency} ${invoice.taxAmount}</p>
        <p><strong>Discount Amount:</strong> ${invoice.currency} ${invoice.discountAmount}</p>
        <h3><strong>Total Amount:</strong> ${invoice.currency} ${invoice.totalAmount}</h3>
        <p><strong>Amount Paid:</strong> ${invoice.currency} ${invoice.amountPaid}</p>
        <p><strong>Amount Due:</strong> ${invoice.currency} ${invoice.amountDue}</p>
      </div>
    `;

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Print representation fetched successfully.",
      data: {
        record: {
          html: printHtml,
        },
      },
    });
  } catch (error) {
    console.error("Error getting printable invoice format:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve printable invoice format.",
      error: error.message,
    });
  }
}

export {
  createInvoiceController,
  listInvoicesController,
  getInvoiceByIdController,
  updateInvoiceController,
  updateInvoiceStatusController,
  sendInvoiceController,
  emailInvoiceController,
  downloadInvoicePdfController,
  downloadInvoicePdfFileController,
  printInvoiceController,
};
