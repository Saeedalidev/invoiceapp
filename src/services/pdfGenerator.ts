import type { Invoice } from '../types/schemas/invoice';
import { formatCurrency } from './currency';

export type InvoiceTemplate = 'classic' | 'modern' | 'minimalist';

export const generateInvoiceHTML = (invoice: Invoice, template: InvoiceTemplate = 'classic'): string => {
  const {
    companyProfile,
    client,
    invoiceNumber,
    issueDate,
    dueDate,
    items,
    subtotal,
    discount,
    discountType,
    tax,
    taxType,
    grandTotal,
    notes,
    terms,
    currency,
  } = invoice;

  const discountAmount = discountType === 'percentage'
    ? (subtotal * discount) / 100
    : discount;

  const taxAmount = taxType === 'percentage'
    ? ((subtotal - discountAmount) * tax) / 100
    : tax;

  const logoHTML = companyProfile.logoUri
    ? `<img src="${companyProfile.logoUri}" alt="Company Logo" style="max-width: 150px; max-height: 80px;" />`
    : '';

  // Template-specific configurations
  const colors = {
    classic: { primary: '#4F46E5', text: '#333', secondary: '#666', bg: '#F9FAFB' },
    modern: { primary: '#059669', text: '#111', secondary: '#4B5563', bg: '#ECFDF5' },
    minimalist: { primary: '#000000', text: '#000', secondary: '#444', bg: '#FFFFFF' }
  }[template];

  const styles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.6; color: ${colors.text}; padding: 40px; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: white; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid ${colors.primary}; padding-bottom: 20px; }
    .company-logo-container { flex: 1; text-align: left; }
    .company-info-right { flex: 1; text-align: right; }
    .company-details { font-size: 11px; color: ${colors.secondary}; }
    .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .bill-to, .invoice-details { flex: 1; }
    .section-title { font-weight: 600; font-size: 11px; text-transform: uppercase; color: ${colors.secondary}; margin-bottom: 10px; }
    .client-info, .invoice-info { font-size: 12px; }
    .invoice-info { text-align: right; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead { background-color: ${colors.primary}; color: white; }
    ${template === 'minimalist' ? 'thead { background-color: white; color: black; border-bottom: 2px solid black; }' : ''}
    th { padding: 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; }
    th:last-child, td:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #E5E7EB; }
    tbody tr:hover { background-color: ${colors.bg}; }
    td { padding: 12px; font-size: 12px; }
    .item-description { color: ${colors.secondary}; font-size: 10px; margin-top: 4px; }
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-table { width: 300px; }
    .totals-table table { margin-bottom: 0; }
    .totals-table td { padding: 8px 12px; border: none; }
    .totals-table .total-row { background-color: ${colors.primary}; color: white; font-weight: 600; font-size: 14px; }
    ${template === 'minimalist' ? '.totals-table .total-row { background-color: white; color: black; border-top: 2px solid black; }' : ''}
    .notes-section, .terms-section { margin-bottom: 20px; }
    .notes-section h3, .terms-section h3 { font-size: 11px; text-transform: uppercase; color: ${colors.secondary}; margin-bottom: 8px; }
    .notes-content, .terms-content { font-size: 11px; color: #555; line-height: 1.6; padding: 12px; background-color: ${colors.bg}; border-radius: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; font-size: 10px; color: #999; }
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="invoice-container">
    <div class="header" ${template === 'modern' ? 'style="border-bottom-width: 5px;"' : ''}>
      <div class="company-logo-container">
        ${logoHTML}
      </div>
      <div class="company-info-right">
        <strong style="font-size: 20px; display: block; margin-bottom: 8px; color: ${colors.primary};">${companyProfile.companyName}</strong>
        <div class="company-details">
          <div>${companyProfile.businessAddress}</div>
          <div>${companyProfile.phoneNumber}</div>
          <div>${companyProfile.email}</div>
          ${companyProfile.website ? `<div>${companyProfile.website}</div>` : ''}
        </div>
      </div>
    </div>
    
    <div class="invoice-meta">
      <div class="bill-to">
        <div class="section-title">Bill To:</div>
        <div class="client-info">
          <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${client.clientName}</strong>
          <div>${client.clientAddress}</div>
          <div>${client.contactNumber}</div>
          <div>${client.email}</div>
        </div>
      </div>
      <div class="invoice-details">
        <div class="section-title">Invoice Details:</div>
        <div class="invoice-info">
          <div><strong>Invoice #:</strong> ${invoiceNumber}</div>
          <div><strong>Issue Date:</strong> ${issueDate}</div>
          <div><strong>Due Date:</strong> ${dueDate}</div>
          <div><strong>Currency:</strong> ${currency}</div>
        </div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 40%;">Items</th>
          <th style="width: 15%; text-align: center;">Quantity</th>
          <th style="width: 15%;">Price</th>
          ${items.some(i => i.tax && i.tax > 0) ? '<th style="width: 15%;">Tax</th>' : ''}
          <th style="width: 15%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => {
    const itemTotal = item.quantity * item.unitPrice;
    const hasItemTax = item.tax && item.tax > 0;
    const itemTaxAmt = hasItemTax
      ? item.taxType === 'percentage'
        ? (itemTotal * item.tax!) / 100
        : item.tax!
      : 0;
    const total = itemTotal + itemTaxAmt;

    return `
            <tr>
              <td>
                <strong style="${template === 'modern' ? `color: ${colors.primary};` : ''}">${item.productServiceName}</strong>
                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
              </td>
              <td style="text-align: center;">${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice, currency)}</td>
              ${items.some(i => i.tax && i.tax > 0) ? `<td>${hasItemTax ? (item.taxType === 'percentage' ? `${item.tax}%` : formatCurrency(item.tax!, currency)) : '-'}</td>` : ''}
              <td>${formatCurrency(total, currency)}</td>
            </tr>
          `;
  }).join('')}
      </tbody>
    </table>
    
    <div class="totals-section">
      <div class="totals-table">
        <table>
          <tr>
            <td><strong>Subtotal:</strong></td>
            <td>${formatCurrency(subtotal, currency)}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td><strong>Discount ${discountType === 'percentage' ? `(${discount}%)` : ''}:</strong></td>
            <td>-${formatCurrency(discountAmount, currency)}</td>
          </tr>
          ` : ''}
          ${taxAmount > 0 ? `
          <tr>
            <td><strong>Tax ${taxType === 'percentage' ? `(${tax}%)` : ''}:</strong></td>
            <td>${formatCurrency(taxAmount, currency)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td><strong>TOTAL:</strong></td>
            <td><strong>${formatCurrency(grandTotal, currency)}</strong></td>
          </tr>
        </table>
      </div>
    </div>
    
    ${notes ? `
    <div class="notes-section">
      <h3>Notes:</h3>
      <div class="notes-content">${notes}</div>
    </div>
    ` : ''}
    
    ${terms ? `
    <div class="terms-section">
      <h3>Terms & Conditions:</h3>
      <div class="terms-content">${terms}</div>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>This invoice was generated by Invoice Creator App</p>
    </div>
  </div>
</body>
</html>
  `;
};

export default {
  generateInvoiceHTML,
};
