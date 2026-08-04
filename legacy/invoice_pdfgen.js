// Invoice Preview and PDF Generation Functions
// This file handles the preview modal and PDF generation for invoices

function previewInvoice() {
    if (editingInvoiceIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    var clientName = document.getElementById('invoiceClientName').value || '[Client Name]';
    var clientPhone = document.getElementById('invoiceClientPhone').value;
    var clientEmail = document.getElementById('invoiceClientEmail').value;
    var projectAddress = document.getElementById('invoiceProjectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('invoiceProjectPostcode').value;
    var customerId = document.getElementById('invoiceCustomerId').value || 'N/A';
    var paymentDueDays = document.getElementById('paymentDueDays').value || '30';
    var paymentStatus = document.getElementById('paymentStatus').value;
    var deduction = parseFloat(document.getElementById('invoiceDeduction').value) || 0;
    var customNotes = document.getElementById('invoiceCustomNotes').value.trim();
    
    var today = new Date();
    var invoiceDate = today.toLocaleDateString('en-GB');
    var dueDate = new Date(today.getTime() + parseInt(paymentDueDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    var invNumber = String(invoiceNumber).padStart(4, '0');
    
    var subtotal = 0;
    for (var j = 0; j < invoiceItems.length; j++) {
        subtotal += invoiceItems[j].lineTotal;
    }
    var removeVat = document.getElementById('invoiceRemoveVat').checked;
    var vat = removeVat ? 0 : subtotal * 0.20;
    var total = subtotal + vat;
    var amountDue = total - deduction;

    var statusBadge = '';
    if (paymentStatus === 'paid') {
        statusBadge = '<span style="background: #10b981; color: white; padding: 5px 15px; border-radius: 4px; font-weight: bold;">PAID</span>';
    } else if (paymentStatus === 'partial') {
        statusBadge = '<span style="background: #f59e0b; color: white; padding: 5px 15px; border-radius: 4px; font-weight: bold;">PARTIALLY PAID</span>';
    } else {
        statusBadge = '<span style="background: #ef4444; color: white; padding: 5px 15px; border-radius: 4px; font-weight: bold;">UNPAID</span>';
    }

    var previewHtml = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      .invoice-container-preview { font-family: Arial, sans-serif; background: white; padding: 30px; max-width: 100%; }
      .header-preview { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
      .company-info-preview { flex: 1; }
      .company-name-preview { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }
      .company-name-preview .highlight-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .company-details-preview { font-size: 11px; line-height: 1.6; color: #666; }
      .logo-preview { width: 120px; height: auto; }
      .invoice-banner-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 15px 20px; margin-bottom: 25px; display: inline-block; font-weight: bold; font-size: 16px; color: white; }
      .info-section-preview { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; gap: 100px; }
      .client-info-preview { flex: 0 0 auto; }
      .invoice-details-preview { flex: 0 0 auto; }
      .info-row-preview { font-size: 13px; line-height: 2; display: flex; align-items: center; }
      .info-label-preview { color: #333; font-weight: bold; margin-right: 10px; min-width: 80px; }
      .info-value-preview { color: #333; font-weight: normal; }
      .due-date-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 5px 10px; display: inline-block; color: white; font-weight: normal; }
      .items-table-preview { width: 100%; border-collapse: collapse; margin: 30px 0; }
      .items-table-preview thead { background: #f5f5f5; }
      .items-table-preview th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }
      .items-table-preview th:nth-child(2), .items-table-preview th:nth-child(3), .items-table-preview th:nth-child(4) { text-align: right; width: 100px; }
      .items-table-preview td { padding: 12px; font-size: 13px; border-bottom: 1px solid #eee; color: #333; }
      .items-table-preview td:nth-child(2), .items-table-preview td:nth-child(3), .items-table-preview td:nth-child(4) { text-align: right; }
      .category-row { background: #f9f9f9; font-weight: bold; color: #333; }
      .category-row td { padding: 10px 12px; border-bottom: 2px solid #ddd; }
      .payment-terms-preview { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #bc9c22; }
      .payment-terms-preview h3 { font-size: 13px; margin-bottom: 10px; color: #333; }
      .payment-terms-preview p { font-size: 12px; line-height: 1.8; color: #666; margin-bottom: 8px; }
      .bank-details-preview { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #bc9c22; }
      .bank-details-preview h3 { font-size: 13px; margin-bottom: 10px; color: #333; }
      .bank-details-preview p { font-size: 12px; line-height: 1.8; color: #666; margin: 5px 0; }
      .bottom-section-preview { display: flex; gap: 30px; margin-top: 30px; align-items: flex-start; }
      .totals-section-preview { margin-top: 30px; display: flex; justify-content: flex-end; }
      .totals-box-preview { width: 300px; }
      .total-row-preview { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; }
      .total-row-preview.subtotal { border-top: 1px solid #ddd; }
      .total-row-preview.vat { color: #666; }
      .total-row-preview.final { background: linear-gradient(135deg, #bc9c22, #d4af37); color: white; font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 5px; }
      .footer-note-preview { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; font-style: italic; }
      .thank-you-preview { margin-top: 15px; font-weight: bold; color: #333; font-size: 12px; }
    </style>
    <div class="invoice-container-preview">
      <div class="header-preview">
        <div class="company-info-preview">
          <div class="company-name-preview">TR<span class="highlight-preview">A</span>DER BROTHERS LTD</div>
          <div class="company-details-preview">
            8 Craigour Terrace<br>
            Edinburgh, EH17 7PB<br>
            07979309957<br>
            traderbrotherslimited@gmail.com
          </div>
        </div>
        <div class="logo-container-preview">
          <img src="https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true" alt="Trader Brothers Logo" class="logo-preview">
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <div class="invoice-banner-preview">Invoice for</div>
        <div>${statusBadge}</div>
      </div>

      <div class="info-section-preview">
        <div class="client-info-preview">
          <div class="info-row-preview">
            <span class="info-label-preview">Name:</span>
            <span class="info-value-preview">${clientName}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Address:</span>
            <span class="info-value-preview">${projectAddress}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Postcode:</span>
            <span class="info-value-preview">${projectPostcode || 'N/A'}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Phone:</span>
            <span class="info-value-preview">${clientPhone || 'N/A'}</span>
          </div>
          ${clientEmail ? `<div class="info-row-preview"><span class="info-label-preview">Email:</span><span class="info-value-preview">${clientEmail}</span></div>` : ''}
        </div>

        <div class="invoice-details-preview">
          <div class="info-row-preview">
            <span class="info-label-preview">Date:</span>
            <span class="info-value-preview">${invoiceDate}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Invoice #:</span>
            <span class="info-value-preview">${invNumber}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Customer ID:</span>
            <span class="info-value-preview">${customerId}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Due Date:</span>
            <span class="due-date-preview">${dueDate}</span>
          </div>
        </div>
      </div>

      <table class="items-table-preview">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total price</th>
          </tr>
        </thead>
        <tbody>`;

    // Render items - section-aware if sections exist, else grouped by category
    function renderPreviewInvoiceByCat(itemsArr) {
        var sorted = sortInvoiceItemsByCategory(itemsArr);
        var grouped = groupInvoiceItemsByCategory(sorted);
        categoryOrder.forEach(function(cat) {
            if (grouped[cat]) {
                previewHtml += '<tr class="category-row"><td colspan="4"><strong>' + cat + '</strong></td></tr>';
                grouped[cat].forEach(function(it) {
                    previewHtml += '<tr><td>' + it.description + '</td><td>' + it.quantity + '</td><td>£' + it.unitPrice.toFixed(2) + '</td><td>£' + it.lineTotal.toFixed(2) + '</td></tr>';
                });
            }
        });
        var seenCustom = {};
        itemsArr.forEach(function(it) {
            if (categoryOrder.indexOf(it.category) === -1 && !seenCustom[it.category]) {
                seenCustom[it.category] = true;
                var catItems = itemsArr.filter(function(x) { return x.category === it.category; });
                previewHtml += '<tr class="category-row"><td colspan="4"><strong>' + it.category + '</strong></td></tr>';
                catItems.forEach(function(x) {
                    previewHtml += '<tr><td>' + x.description + '</td><td>' + x.quantity + '</td><td>£' + x.unitPrice.toFixed(2) + '</td><td>£' + x.lineTotal.toFixed(2) + '</td></tr>';
                });
            }
        });
    }

    if (invoiceSections.length > 0) {
        var unsectioned = invoiceItems.filter(function(it) { return !it.section; });
        if (unsectioned.length > 0) {
            renderPreviewInvoiceByCat(unsectioned);
        }
        invoiceSections.forEach(function(sectionName) {
            var sectionItems = invoiceItems.filter(function(it) { return it.section === sectionName; });
            if (sectionItems.length > 0) {
                previewHtml += '<tr style="background: #d4af37;"><td colspan="4" style="padding: 10px 12px; font-weight: bold; color: white; font-size: 13px;">' + sectionName + '</td></tr>';
                renderPreviewInvoiceByCat(sectionItems);
            }
        });
    } else {
        renderPreviewInvoiceByCat(invoiceItems);
    }

    previewHtml += `
        </tbody>
      </table>

      <div class="payment-terms-preview">
        <h3>Payment Terms:</h3>
        <p>Payment due within ${paymentDueDays} days from invoice date.</p>
       ${customNotes ? '<div style="margin-top: 15px; font-size: 12px; line-height: 1.8; color: #666;"><strong>Additional Notes:</strong><br>' + customNotes.replace(/\n/g, '<br>') + '</div>' : ''}
     </div>
     
      <div class="bottom-section-preview">
        <div class="bank-details-preview" style="flex: 1;">
          <h3>Bank Details:</h3>
          <p><strong>Account Name:</strong> Trader Brothers Ltd</p>
          <p><strong>Sort Code:</strong> 04-06-05</p>
          <p><strong>Account Number:</strong> 24049254</p>
        </div>

        <div class="totals-section-preview" style="flex: 0 0 auto;">
          <div class="totals-box-preview">
            <div class="total-row-preview subtotal">
              <span>Subtotal</span>
              <span>£${subtotal.toFixed(2)}</span>
            </div>
            ${!removeVat ? `<div class="total-row-preview vat">
              <span>VAT (20%)</span>
              <span>£${vat.toFixed(2)}</span>
            </div>` : ''}
            <div class="total-row-preview subtotal">
              <span>Total</span>
              <span>£${total.toFixed(2)}</span>
            </div>
            ${deduction > 0 ? `<div class="total-row-preview vat">
              <span>Deduction</span>
              <span>-£${deduction.toFixed(2)}</span>
            </div>` : ''}
            <div class="total-row-preview final">
              <span>Amount Due</span>
              <span>£${amountDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-note-preview">
        If you have any questions about this invoice, please contact<br>
        us at traderbrotherslimited@gmail.com on 07931 810557
        <div class="thank-you-preview">Thank you for your business</div>
      </div>
    </div>`;

    document.getElementById('invoicePreviewBody').innerHTML = previewHtml;
    document.getElementById('invoicePreviewModal').style.display = 'block';
}

function downloadInvoice() {
    if (invoiceItems.length === 0) {
        alert('Please add items to the invoice first');
        return;
    }

    var downloadBtn = event.target;
    var originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Generating PDF...';
    downloadBtn.disabled = true;

    try {
        var htmlContent = generateInvoiceHTML();
        var clientName = document.getElementById('invoiceClientName').value || 'Client';
        var invNumber = String(invoiceNumber).padStart(4, '0');
        var sanitizedClientName = clientName.replace(/[^a-z0-9]/gi, '_');
        var filename = 'Invoice_' + invNumber + '_' + sanitizedClientName + '.pdf';

        console.log('Sending invoice request to PDFShift...');

        fetch('https://api.pdfshift.io/v3/convert/pdf', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa('api:sk_baa46c861371ec5f60ab2e83221fdac1ccce517b'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: htmlContent,
                landscape: false,
                use_print: true,
                margin: {
                    top: '20px',
                    bottom: '20px',
                    left: '20px',
                    right: '20px'
                }
            })
        })
        .then(function(response) {
            console.log('Response status:', response.status);

            if (!response.ok) {
                return response.json().then(function(errorData) {
                    if (response.status === 401) {
                        throw new Error('Authentication failed. Please check your PDFShift API key.');
                    } else if (response.status === 403) {
                        throw new Error('Access forbidden. Your API key may not have permission.');
                    } else if (response.status === 429) {
                        throw new Error('Rate limit exceeded. You may have used your free tier quota (250 PDFs/month).');
                    } else if (response.status === 400) {
                        throw new Error('Bad Request: ' + (errorData.error || errorData.message || 'Invalid request'));
                    } else {
                        throw new Error((errorData.error || errorData.message) || 'API Error (' + response.status + '): ' + response.statusText);
                    }
                });
            }

            return response.blob();
        })
        .then(function(blob) {
            if (blob.size === 0) {
                throw new Error('Received empty PDF from server');
            }

            console.log('PDF blob size:', blob.size, 'bytes');

            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            setTimeout(function() {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            console.log('Invoice PDF downloaded successfully!');
            
            localStorage.setItem('traderBrosInvoiceCount', invoiceNumber);
            invoiceNumber++;
            updateInvoiceCounter();

            setTimeout(function() {
                alert('✓ Invoice PDF downloaded successfully!\n\nFile: ' + filename);
            }, 200);
        })
        .catch(function(error) {
            console.error('Error generating invoice PDF:', error);
            console.error('Error stack:', error.stack);

            var errorMessage = 'Error generating invoice PDF\n\n';
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage += 'Network Error - Cannot connect to PDFShift API.\n\n';
                errorMessage += 'Please check:\n';
                errorMessage += '• Your internet connection\n';
                errorMessage += '• Firewall or browser extensions blocking the request\n';
                errorMessage += '• Try using a different browser\n\n';
                errorMessage += 'Technical details are in the console (press F12)';
            } else {
                errorMessage += error.message;
                errorMessage += '\n\nCheck console for more details (press F12)';
            }
            alert(errorMessage);
        })
        .finally(function() {
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        });

    } catch (error) {
        console.error('Error in downloadInvoice:', error);
        alert('Error: ' + error.message);
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }
}

function generateInvoiceHTML() {
    var clientName = document.getElementById('invoiceClientName').value || '[Client Name]';
    var clientPhone = document.getElementById('invoiceClientPhone').value;
    var clientEmail = document.getElementById('invoiceClientEmail').value;
    var projectAddress = document.getElementById('invoiceProjectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('invoiceProjectPostcode').value;
    var customerId = document.getElementById('invoiceCustomerId').value || 'N/A';
    var paymentDueDays = document.getElementById('paymentDueDays').value || '30';
    var paymentStatus = document.getElementById('paymentStatus').value;
    var deduction = parseFloat(document.getElementById('invoiceDeduction').value) || 0;
    var customNotes = document.getElementById('invoiceCustomNotes').value.trim();
    
    var today = new Date();
    var invoiceDate = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    var dueDate = new Date(today.getTime() + parseInt(paymentDueDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    var invNumber = String(invoiceNumber).padStart(4, '0');
    
    var subtotal = 0;
    for (var j = 0; j < invoiceItems.length; j++) {
        subtotal += invoiceItems[j].lineTotal;
    }
    var removeVat = document.getElementById('invoiceRemoveVat').checked;
    var vat = removeVat ? 0 : subtotal * 0.20;
    var total = subtotal + vat;
    var amountDue = total - deduction;

    var statusBadge = '';
    var statusColor = '';
    if (paymentStatus === 'paid') {
        statusColor = '#10b981';
        statusBadge = 'PAID';
    } else if (paymentStatus === 'partial') {
        statusColor = '#f59e0b';
        statusBadge = 'PARTIALLY PAID';
    } else {
        statusColor = '#ef4444';
        statusBadge = 'UNPAID';
    }

    var styles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: Arial, sans-serif;
        background: #f5f5f5;
        padding: 20px;
      }
      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #333;
      }
      .company-info {
        flex: 1;
      }
      .company-name {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #333;
      }
      .company-name .highlight {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .company-details {
        font-size: 11px;
        line-height: 1.6;
        color: #666;
      }
      .logo {
        width: 120px;
        height: auto;
      }
      .invoice-header-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
      }
      .invoice-banner {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        padding: 15px 20px;
        display: inline-block;
        font-weight: bold;
        font-size: 16px;
        color: white;
      }
      .status-badge {
        background: ${statusColor};
        color: white;
        padding: 8px 20px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 13px;
      }
      .info-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        align-items: flex-start;
        gap: 100px;
      }
      .client-info {
        flex: 0 0 auto;
      }
      .invoice-details {
        flex: 0 0 auto;
      }
      .info-row {
        font-size: 13px;
        line-height: 2;
        display: flex;
        align-items: center;
      }
      .info-label {
        color: #333;
        font-weight: bold;
        margin-right: 10px;
        min-width: 80px;
      }
      .info-value {
        color: #333;
        font-weight: normal;
      }
      .due-date {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        padding: 5px 10px;
        display: inline-block;
        color: white;
        font-weight: normal;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 30px 0;
      }
      .items-table thead {
        background: #f5f5f5;
      }
      .items-table th {
        padding: 12px;
        text-align: left;
        font-size: 12px;
        font-weight: bold;
        color: #333;
        border-bottom: 2px solid #ddd;
      }
      .items-table th:nth-child(2),
      .items-table th:nth-child(3),
      .items-table th:nth-child(4) {
        text-align: right;
        width: 100px;
      }
      .items-table td {
        padding: 12px;
        font-size: 13px;
        border-bottom: 1px solid #eee;
        color: #333;
      }
      .items-table td:nth-child(2),
      .items-table td:nth-child(3),
      .items-table td:nth-child(4) {
        text-align: right;
      }
      .category-row {
        background: #f9f9f9;
        font-weight: bold;
        color: #333;
      }
      .category-row td {
        padding: 10px 12px;
        border-bottom: 2px solid #ddd;
      }
      .payment-terms {
        margin: 30px 0;
        padding: 20px;
        background: #f9f9f9;
        border-left: 3px solid #bc9c22;
      }
      .payment-terms h3 {
        font-size: 13px;
        margin-bottom: 10px;
        color: #333;
      }
      .payment-terms p {
        font-size: 12px;
        line-height: 1.8;
        color: #666;
        margin-bottom: 8px;
      }
      .bank-details {
        margin: 30px 0;
        padding: 20px;
        background: #f9f9f9;
        border-left: 3px solid #bc9c22;
        flex: 1;
      }
      .bank-details h3 {
        font-size: 13px;
        margin-bottom: 10px;
        color: #333;
      }
      .bank-details p {
        font-size: 12px;
        line-height: 1.8;
        color: #666;
        margin: 5px 0;
      }
      .bottom-section {
        display: flex;
        gap: 30px;
        margin-top: 30px;
        align-items: flex-start;
      }
      .totals-section {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
        flex: 0 0 auto;
      }
      .totals-box {
        width: 300px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 15px;
        font-size: 13px;
      }
      .total-row.subtotal {
        border-top: 1px solid #ddd;
      }
      .total-row.vat {
        color: #666;
      }
      .total-row.final {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        color: white;
        font-weight: bold;
        font-size: 16px;
        border-top: 2px solid #333;
        margin-top: 5px;
      }
      .footer-note {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        text-align: center;
        font-size: 11px;
        color: #666;
        font-style: italic;
      }
      .thank-you {
        margin-top: 15px;
        font-weight: bold;
        color: #333;
        font-size: 12px;
      }
      @media print {
        body {
          background: white;
          padding: 0;
        }
        .invoice-container {
          box-shadow: none;
          padding: 20px;
        }
      }
    </style>
  `;

    var bodyContent = `
    <div class="invoice-container">
      <div class="header">
        <div class="company-info">
          <div class="company-name">TR<span class="highlight">A</span>DER BROTHERS LTD</div>
          <div class="company-details">
            8 Craigour Terrace<br>
            Edinburgh, EH17 7PB<br>
            07931 810557<br>
            traderbrotherslimited@gmail.com
          </div>
        </div>
        <div class="logo-container">
          <img src="https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true" alt="Trader Brothers Logo" class="logo">
        </div>
      </div>

      <div class="invoice-header-section">
        <div class="invoice-banner">Invoice for</div>
        <div class="status-badge">${statusBadge}</div>
      </div>

      <div class="info-section">
        <div class="client-info">
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${clientName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${projectAddress}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Postcode:</span>
            <span class="info-value">${projectPostcode || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${clientPhone || 'N/A'}</span>
          </div>
          ${clientEmail ? '<div class="info-row"><span class="info-label">Email:</span><span class="info-value">' + clientEmail + '</span></div>' : ''}
        </div>

        <div class="invoice-details">
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${invoiceDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Invoice #:</span>
            <span class="info-value">${invNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Customer ID:</span>
            <span class="info-value">${customerId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Date:</span>
            <span class="due-date">${dueDate}</span>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total price</th>
          </tr>
        </thead>
        <tbody>`;

    // Render items - section-aware if sections exist, else grouped by category
    function renderPdfInvoiceByCat(itemsArr) {
        var sorted = sortInvoiceItemsByCategory(itemsArr);
        var grouped = groupInvoiceItemsByCategory(sorted);
        categoryOrder.forEach(function(cat) {
            if (grouped[cat]) {
                bodyContent += '<tr class="category-row"><td colspan="4"><strong>' + cat + '</strong></td></tr>';
                grouped[cat].forEach(function(it) {
                    bodyContent += '<tr><td>' + it.description + '</td><td>' + it.quantity + '</td><td>£' + it.unitPrice.toFixed(2) + '</td><td>£' + it.lineTotal.toFixed(2) + '</td></tr>';
                });
            }
        });
        var seenCustom = {};
        itemsArr.forEach(function(it) {
            if (categoryOrder.indexOf(it.category) === -1 && !seenCustom[it.category]) {
                seenCustom[it.category] = true;
                var catItems = itemsArr.filter(function(x) { return x.category === it.category; });
                bodyContent += '<tr class="category-row"><td colspan="4"><strong>' + it.category + '</strong></td></tr>';
                catItems.forEach(function(x) {
                    bodyContent += '<tr><td>' + x.description + '</td><td>' + x.quantity + '</td><td>£' + x.unitPrice.toFixed(2) + '</td><td>£' + x.lineTotal.toFixed(2) + '</td></tr>';
                });
            }
        });
    }

    if (invoiceSections.length > 0) {
        var unsectioned = invoiceItems.filter(function(it) { return !it.section; });
        if (unsectioned.length > 0) {
            renderPdfInvoiceByCat(unsectioned);
        }
        invoiceSections.forEach(function(sectionName) {
            var sectionItems = invoiceItems.filter(function(it) { return it.section === sectionName; });
            if (sectionItems.length > 0) {
                bodyContent += '<tr style="background: #d4af37;"><td colspan="4" style="padding: 10px 12px; font-weight: bold; color: white; font-size: 13px;">' + sectionName + '</td></tr>';
                renderPdfInvoiceByCat(sectionItems);
            }
        });
    } else {
        renderPdfInvoiceByCat(invoiceItems);
    }

    bodyContent += `
        </tbody>
      </table>

      <div class="payment-terms">
        <h3>Payment Terms:</h3>
        <p>Payment due within ${paymentDueDays} days from invoice date.</p>
      ${customNotes ? '<div style="margin-top: 15px; font-size: 12px; line-height: 1.8; color: #666;"><strong>Additional Notes:</strong><br>' + customNotes.replace(/\n/g, '<br>') + '</div>' : ''}
    </div>
     
      <div class="bottom-section">
        <div class="bank-details">
          <h3>Bank Details:</h3>
          <p><strong>Account Name:</strong> Trader Brothers Ltd</p>
          <p><strong>Sort Code:</strong> 04-06-05</p>
          <p><strong>Account Number:</strong> 24049254</p>
        </div>

        <div class="totals-section">
          <div class="totals-box">
            <div class="total-row subtotal">
              <span>Subtotal</span>
              <span>£${subtotal.toFixed(2)}</span>
            </div>
            ${!removeVat ? '<div class="total-row vat"><span>VAT (20%)</span><span>£' + vat.toFixed(2) + '</span></div>' : ''}
            <div class="total-row subtotal">
              <span>Total</span>
              <span>£${total.toFixed(2)}</span>
            </div>
            ${deduction > 0 ? '<div class="total-row vat"><span>Deduction</span><span>-£' + deduction.toFixed(2) + '</span></div>' : ''}
            <div class="total-row final">
              <span>Amount Due</span>
              <span>£${amountDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-note">
        If you have any questions about this invoice, please contact<br>
        us at traderbrotherslimited@gmail.com, or 07931 810557 
        <div class="thank-you">Thank you for your business</div>
      </div>
    </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - Trader Brothers Ltd</title>
  ${styles}
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}
