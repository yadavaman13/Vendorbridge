import PDFDocument from 'pdfkit';

/**
 * Generates a styled PDF invoice for the given invoice details.
 * @param {Object} invoice - Invoice database record joined with vendor and PO details
 * @returns {Promise<Buffer>} Resolves to a PDF Buffer
 */
export function generateInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => reject(err));

      // Color Palette
      const primaryColor = '#714b67'; // Odoo Plum
      const darkColor = '#1e1d1b';    // Off-black
      const lightGray = '#f5f4f8';    // Light background
      const borderGray = '#e5e0f3';   // Border color
      const textMuted = '#6a6779';    // Muted gray text

      // Document Title/Header
      doc.fillColor(primaryColor)
         .fontSize(26)
         .font('Helvetica-Bold')
         .text('VendorBridge', 50, 50);

      doc.fillColor(textMuted)
         .fontSize(10)
         .font('Helvetica')
         .text('Enterprise Procurement Hub', 50, 80);

      doc.fillColor(darkColor)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('INVOICE', 400, 50, { align: 'right' });

      // Separator line
      doc.moveTo(50, 110).lineTo(545, 110).strokeColor(borderGray).stroke();

      // Invoice Details Metas
      doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold');
      doc.text('Invoice Number:', 50, 130);
      doc.font('Helvetica').text(invoice.invoiceNumber, 150, 130);

      doc.font('Helvetica-Bold').text('Issued Date:', 50, 150);
      doc.font('Helvetica').text(new Date(invoice.issuedDate || Date.now()).toLocaleDateString(), 150, 150);

      if (invoice.dueDate) {
        doc.font('Helvetica-Bold').text('Due Date:', 50, 170);
        doc.font('Helvetica').text(new Date(invoice.dueDate).toLocaleDateString(), 150, 170);
      }

      // Vendor Info block (Right)
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold');
      doc.text('Vendor Details:', 320, 130);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Company: ${invoice.companyName || 'N/A'}`, 320, 148);
      doc.text(`Status: ${invoice.status || 'GENERATED'}`, 320, 164);
      doc.text(`PO Reference: ${invoice.poNumber || 'N/A'}`, 320, 180);

      // Main Table Header Background
      doc.rect(50, 215, 495, 25).fill(primaryColor);

      // Table Header text
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text('Item / Description', 60, 223);
      doc.text('Amount', 400, 223, { width: 135, align: 'right' });

      // Table Content
      doc.fillColor(darkColor).fontSize(10).font('Helvetica');
      doc.text('Goods Procurement Service', 60, 255);
      doc.text(`${invoice.currency || 'INR'} ${Number(invoice.subtotal).toFixed(2)}`, 400, 255, { width: 135, align: 'right' });

      // Line separator
      doc.moveTo(50, 280).lineTo(545, 280).strokeColor(borderGray).stroke();

      // Financial calculations (Subtotal, Tax, Discount, Total)
      let currentY = 300;

      doc.fillColor(darkColor).font('Helvetica-Bold').text('Subtotal:', 300, currentY, { width: 100, align: 'right' });
      doc.font('Helvetica').text(`${invoice.currency || 'INR'} ${Number(invoice.subtotal).toFixed(2)}`, 410, currentY, { width: 125, align: 'right' });

      currentY += 20;
      doc.font('Helvetica-Bold').text('Tax Amount:', 300, currentY, { width: 100, align: 'right' });
      doc.font('Helvetica').text(`${invoice.currency || 'INR'} ${Number(invoice.taxAmount || 0).toFixed(2)}`, 410, currentY, { width: 125, align: 'right' });

      if (Number(invoice.discountAmount || 0) > 0) {
        currentY += 20;
        doc.font('Helvetica-Bold').text('Discount:', 300, currentY, { width: 100, align: 'right' });
        doc.font('Helvetica').text(`-${invoice.currency || 'INR'} ${Number(invoice.discountAmount).toFixed(2)}`, 410, currentY, { width: 125, align: 'right' });
      }

      currentY += 25;
      // Double line for Total
      doc.moveTo(350, currentY - 5).lineTo(545, currentY - 5).strokeColor(borderGray).stroke();

      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold');
      doc.text('Total Amount:', 300, currentY, { width: 100, align: 'right' });
      doc.text(`${invoice.currency || 'INR'} ${Number(invoice.totalAmount).toFixed(2)}`, 410, currentY, { width: 125, align: 'right' });

      // Notes & Terms Footer
      let footerY = 400;
      if (invoice.notes || invoice.paymentTerms) {
        doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor(borderGray).stroke();
        footerY += 15;

        doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text('Notes & Payment Terms:', 50, footerY);
        footerY += 15;

        doc.fillColor(textMuted).fontSize(9).font('Helvetica');
        const notesStr = [
          invoice.paymentTerms ? `Payment Terms: ${invoice.paymentTerms}` : '',
          invoice.notes ? `Notes: ${invoice.notes}` : ''
        ].filter(Boolean).join('\n');

        doc.text(notesStr, 50, footerY, { width: 495, lineGap: 4 });
      }

      // End document writing
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
