// Statement Preview and PDF Generation Functions

function previewStatement() {
    if (editingStatementIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }

    var clientName = document.getElementById('statementClientName').value || '[Client Name]';
    var clientPhone = document.getElementById('statementClientPhone').value;
    var clientEmail = document.getElementById('statementClientEmail').value;
    var projectAddress = document.getElementById('statementProjectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('statementProjectPostcode').value;
    var customerId = document.getElementById('statementCustomerId').value || 'N/A';
    var customNotes = document.getElementById('statementCustomNotes').value.trim();

    var today = new Date();
    var statementDate = today.toLocaleDateString('en-GB');
    var expiryDate = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    var stmtNumber = String(statementNumber).padStart(4, '0');

    var subtotal = 0;
    for (var j = 0; j < statementItems.length; j++) {
        subtotal += statementItems[j].lineTotal;
    }
    var removeVat = document.getElementById('statementRemoveVat').checked;
    var vat = removeVat ? 0 : subtotal * 0.20;
    var total = subtotal + vat;

    var previewHtml = '\
    <style>\
      * { margin: 0; padding: 0; box-sizing: border-box; }\
      .statement-container-preview { font-family: Arial, sans-serif; background: white; padding: 30px; max-width: 100%; }\
      .header-preview { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }\
      .company-info-preview { flex: 1; }\
      .company-name-preview { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }\
      .company-name-preview .highlight-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }\
      .company-details-preview { font-size: 11px; line-height: 1.6; color: #666; }\
      .logo-preview { width: 120px; height: auto; }\
      .statement-banner-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 15px 20px; margin-bottom: 25px; display: inline-block; font-weight: bold; font-size: 16px; color: white; }\
      .info-section-preview { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; gap: 100px; }\
      .client-info-preview { flex: 0 0 auto; }\
      .statement-details-preview { flex: 0 0 auto; }\
      .info-row-preview { font-size: 13px; line-height: 2; display: flex; align-items: center; }\
      .info-label-preview { color: #333; font-weight: bold; margin-right: 10px; min-width: 80px; }\
      .info-value-preview { color: #333; font-weight: normal; }\
      .expiry-date-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 5px 10px; display: inline-block; color: white; font-weight: normal; }\
      .items-table-preview { width: 100%; border-collapse: collapse; margin: 30px 0; }\
      .items-table-preview thead { background: #f5f5f5; }\
      .items-table-preview th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }\
      .items-table-preview th:nth-child(2), .items-table-preview th:nth-child(3), .items-table-preview th:nth-child(4) { text-align: right; width: 100px; }\
      .items-table-preview td { padding: 12px; font-size: 13px; border-bottom: 1px solid #eee; color: #333; }\
      .items-table-preview td:nth-child(2), .items-table-preview td:nth-child(3), .items-table-preview td:nth-child(4) { text-align: right; }\
      .category-row { background: #f9f9f9; font-weight: bold; color: #333; }\
      .category-row td { padding: 10px 12px; border-bottom: 2px solid #ddd; }\
      .notes-section-preview { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #bc9c22; }\
      .notes-section-preview h3 { font-size: 13px; margin-bottom: 10px; color: #333; }\
      .notes-section-preview ol { margin-left: 20px; font-size: 12px; line-height: 1.8; color: #666; }\
      .totals-section-preview { margin-top: 30px; display: flex; justify-content: flex-end; }\
      .totals-box-preview { width: 300px; }\
      .total-row-preview { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; }\
      .total-row-preview.subtotal { border-top: 1px solid #ddd; }\
      .total-row-preview.vat { color: #666; }\
      .total-row-preview.final { background: linear-gradient(135deg, #bc9c22, #d4af37); color: white; font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 5px; }\
      .footer-note-preview { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; font-style: italic; }\
      .thank-you-preview { margin-top: 15px; font-weight: bold; color: #333; font-size: 12px; }\
    </style>\
    <div class="statement-container-preview">\
      <div class="header-preview">\
        <div class="company-info-preview">\
          <div class="company-name-preview">TR<span class="highlight-preview">A</span>DER BROTHERS LTD</div>\
          <div class="company-details-preview">\
            8 Craigour Terrace<br>\
            Edinburgh, EH17 7PB<br>\
            07979309957<br>\
            traderbrotherslimited@gmail.com\
          </div>\
        </div>\
        <div class="logo-container-preview">\
          <img src="https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true" alt="Trader Brothers Logo" class="logo-preview">\
        </div>\
      </div>\
      <div class="statement-banner-preview">Statement for</div>\
      <div class="info-section-preview">\
        <div class="client-info-preview">\
          <div class="info-row-preview">\
            <span class="info-label-preview">Name:</span>\
            <span class="info-value-preview">' + clientName + '</span>\
          </div>\
          <div class="info-row-preview">\
            <span class="info-label-preview">Address:</span>\
            <span class="info-value-preview">' + projectAddress + '</span>\
          </div>\
          <div class="info-row-preview">\
            <span class="info-label-preview">Postcode:</span>\
            <span class="info-value-preview">' + (projectPostcode || 'N/A') + '</span>\
          </div>\
          <div class="info-row-preview">\
            <span class="info-label-preview">Phone:</span>\
            <span class="info-value-preview">' + (clientPhone || 'N/A') + '</span>\
          </div>\
          ' + (clientEmail ? '<div class="info-row-preview"><span class="info-label-preview">Email:</span><span class="info-value-preview">' + clientEmail + '</span></div>' : '') + '\
        </div>\
        <div class="statement-details-preview">\
          <div class="info-row-preview">\
            <span class="info-label-preview">Date:</span>\
            <span class="info-value-preview">' + statementDate + '</span>\
          </div>\
          <div class="info-row-preview">\
            <span class="info-label-preview">Statement #:</span>\
            <span class="info-value-preview">' + stmtNumber + '</span>\
          </div>\
          <div class="info-row-preview">\
            <span class="info-label-preview">Customer ID:</span>\
            <span class="info-value-preview">' + customerId + '</span>\
          </div>\
          <div class="info-row-preview">\
            <span class="info-label-preview">Expiry Date:</span>\
            <span class="expiry-date-preview">' + expiryDate + '</span>\
          </div>\
        </div>\
      </div>\
      <table class="items-table-preview">\
        <thead>\
          <tr>\
            <th>Description</th>\
            <th>Qty</th>\
            <th>Unit price</th>\
            <th>Total price</th>\
          </tr>\
        </thead>\
        <tbody>';

    // Render items — section-grouped when sections exist, else category-grouped
    if (statementSections.length > 0) {
        // Helper to render a flat item list grouped by category
        function renderPreviewItemsByCat(itemsArr) {
            var sorted = sortStatementItemsByCategory(itemsArr);
            var grouped = groupStatementItemsByCategory(sorted);
            var cats = [];
            statementCategoryOrder.forEach(function(c) { if (grouped[c]) cats.push(c); });
            Object.keys(grouped).forEach(function(c) { if (cats.indexOf(c) === -1) cats.push(c); });
            cats.forEach(function(c) {
                previewHtml += '<tr class="category-row"><td colspan="4"><strong>' + c + '</strong></td></tr>';
                grouped[c].forEach(function(item) {
                    previewHtml += '<tr><td>' + item.description + '</td><td>' + item.quantity + '</td><td>£' + item.unitPrice.toFixed(2) + '</td><td>£' + item.lineTotal.toFixed(2) + '</td></tr>';
                });
            });
        }
        // Unsectioned items (no header)
        var unsectioned = statementItems.filter(function(it) { return !it.section; });
        if (unsectioned.length > 0) { renderPreviewItemsByCat(unsectioned); }
        // Each section
        statementSections.forEach(function(sectionName) {
            var sectionItems = statementItems.filter(function(it) { return it.section === sectionName; });
            if (sectionItems.length > 0) {
                previewHtml += '<tr style="background: #d4af37;"><td colspan="4" style="padding: 10px 12px; font-weight: bold; color: white; font-size: 13px;">' + sectionName + '</td></tr>';
                renderPreviewItemsByCat(sectionItems);
            }
        });
    } else {
        // No sections — original category-grouped rendering
        var sortedItems = sortStatementItemsByCategory(statementItems);
        var groupedItems = groupStatementItemsByCategory(sortedItems);
        var allCategories = [];
        statementCategoryOrder.forEach(function(cat) { if (groupedItems[cat]) allCategories.push(cat); });
        Object.keys(groupedItems).forEach(function(cat) { if (allCategories.indexOf(cat) === -1) allCategories.push(cat); });
        allCategories.forEach(function(category) {
            if (groupedItems[category]) {
                previewHtml += '<tr class="category-row"><td colspan="4"><strong>' + category + '</strong></td></tr>';
                groupedItems[category].forEach(function(item) {
                    previewHtml += '<tr><td>' + item.description + '</td><td>' + item.quantity + '</td><td>£' + item.unitPrice.toFixed(2) + '</td><td>£' + item.lineTotal.toFixed(2) + '</td></tr>';
                });
            }
        });
    }

    previewHtml += '</tbody></table>';

    previewHtml += '<div class="notes-section-preview">\
       <h3>Notes:</h3>\
       <ol>\
         <li>Statement includes all works from accepted estimate/s</li>\
         <li>Statement also includes all payment made.</li>\
       </ol>\
       ' + (customNotes ? '<div style="margin-top: 15px; font-size: 12px; line-height: 1.8; color: #666;"><strong>Additional Notes:</strong><br>' + customNotes.replace(/\n/g, '<br>') + '</div>' : '') + '\
     </div>';

    previewHtml += '<div class="totals-section-preview">\
        <div class="totals-box-preview">\
          <div class="total-row-preview subtotal">\
            <span>Subtotal</span>\
            <span>£' + subtotal.toFixed(2) + '</span>\
          </div>\
          ' + (!removeVat ? '<div class="total-row-preview vat"><span>VAT (20%)</span><span>£' + vat.toFixed(2) + '</span></div>' : '') + '\
          <div class="total-row-preview final">\
            <span>Total</span>\
            <span>£' + total.toFixed(2) + '</span>\
          </div>\
        </div>\
      </div>';

    previewHtml += '<div class="footer-note-preview">\
        If you have any questions about this statement, please contact<br>\
        traderbrotherslimited@gmail.com, or 07931 810557\
        <div class="thank-you-preview">Thank you for your business</div>\
      </div>\
    </div>';

    document.getElementById('statementPreviewBody').innerHTML = previewHtml;
    document.getElementById('statementPreviewModal').style.display = 'block';
}

function generateStatementHTML() {
    var clientName = document.getElementById('statementClientName').value || '[Client Name]';
    var clientPhone = document.getElementById('statementClientPhone').value;
    var clientEmail = document.getElementById('statementClientEmail').value;
    var projectAddress = document.getElementById('statementProjectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('statementProjectPostcode').value;
    var customerId = document.getElementById('statementCustomerId').value || 'N/A';
    var customNotes = document.getElementById('statementCustomNotes').value.trim();

    var today = new Date();
    var statementDate = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    var expiryDate = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    var stmtNumber = String(statementNumber).padStart(4, '0');

    var subtotal = 0;
    for (var j = 0; j < statementItems.length; j++) {
        subtotal += statementItems[j].lineTotal;
    }
    var removeVat = document.getElementById('statementRemoveVat').checked;
    var vat = removeVat ? 0 : subtotal * 0.20;
    var total = subtotal + vat;

    var styles = '\
    <style>\
      * { margin: 0; padding: 0; box-sizing: border-box; }\
      body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }\
      .statement-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }\
      .company-info { flex: 1; }\
      .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }\
      .company-name .highlight { background: linear-gradient(135deg, #bc9c22, #d4af37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }\
      .company-details { font-size: 11px; line-height: 1.6; color: #666; }\
      .logo { width: 120px; height: auto; }\
      .statement-banner { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 15px 20px; margin-bottom: 25px; display: inline-block; font-weight: bold; font-size: 16px; color: white; }\
      .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; gap: 100px; }\
      .client-info { flex: 0 0 auto; }\
      .statement-details { flex: 0 0 auto; }\
      .info-row { font-size: 13px; line-height: 2; display: flex; align-items: center; }\
      .info-label { color: #333; font-weight: bold; margin-right: 10px; min-width: 80px; }\
      .info-value { color: #333; font-weight: normal; }\
      .expiry-date { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 5px 10px; display: inline-block; color: white; font-weight: normal; }\
      .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }\
      .items-table thead { background: #f5f5f5; }\
      .items-table th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }\
      .items-table th:nth-child(2), .items-table th:nth-child(3), .items-table th:nth-child(4) { text-align: right; width: 100px; }\
      .items-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #eee; color: #333; }\
      .items-table td:nth-child(2), .items-table td:nth-child(3), .items-table td:nth-child(4) { text-align: right; }\
      .category-row { background: #f9f9f9; font-weight: bold; color: #333; }\
      .category-row td { padding: 10px 12px; border-bottom: 2px solid #ddd; }\
      .notes-section { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #bc9c22; }\
      .notes-section h3 { font-size: 13px; margin-bottom: 10px; color: #333; }\
      .notes-section ol { margin-left: 20px; font-size: 12px; line-height: 1.8; color: #666; }\
      .totals-section { margin-top: 30px; display: flex; justify-content: flex-end; }\
      .totals-box { width: 300px; }\
      .total-row { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; }\
      .total-row.subtotal { border-top: 1px solid #ddd; }\
      .total-row.vat { color: #666; }\
      .total-row.final { background: linear-gradient(135deg, #bc9c22, #d4af37); color: white; font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 5px; }\
      .footer-note { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; font-style: italic; }\
      .thank-you { margin-top: 15px; font-weight: bold; color: #333; font-size: 12px; }\
      @media print { body { background: white; padding: 0; } .statement-container { box-shadow: none; padding: 20px; } }\
    </style>';

    var bodyContent = '\
    <div class="statement-container">\
      <div class="header">\
        <div class="company-info">\
          <div class="company-name">TR<span class="highlight">A</span>DER BROTHERS LTD</div>\
          <div class="company-details">\
            8 Craigour Terrace<br>\
            Edinburgh, EH17 7PB<br>\
            07931 810557<br>\
            traderbrotherslimited@gmail.com\
          </div>\
        </div>\
        <div class="logo-container">\
          <img src="https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true" alt="Trader Brothers Logo" class="logo">\
        </div>\
      </div>\
      <div class="statement-banner">Statement for</div>\
      <div class="info-section">\
        <div class="client-info">\
          <div class="info-row"><span class="info-label">Name:</span><span class="info-value">' + clientName + '</span></div>\
          <div class="info-row"><span class="info-label">Address:</span><span class="info-value">' + projectAddress + '</span></div>\
          <div class="info-row"><span class="info-label">Postcode:</span><span class="info-value">' + (projectPostcode || 'N/A') + '</span></div>\
          <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">' + (clientPhone || 'N/A') + '</span></div>\
          ' + (clientEmail ? '<div class="info-row"><span class="info-label">Email:</span><span class="info-value">' + clientEmail + '</span></div>' : '') + '\
        </div>\
        <div class="statement-details">\
          <div class="info-row"><span class="info-label">Date:</span><span class="info-value">' + statementDate + '</span></div>\
          <div class="info-row"><span class="info-label">Statement #:</span><span class="info-value">' + stmtNumber + '</span></div>\
          <div class="info-row"><span class="info-label">Customer ID:</span><span class="info-value">' + customerId + '</span></div>\
          <div class="info-row"><span class="info-label">Expiry Date:</span><span class="expiry-date">' + expiryDate + '</span></div>\
        </div>\
      </div>\
      <table class="items-table">\
        <thead>\
          <tr>\
            <th>Description</th>\
            <th>Qty</th>\
            <th>Unit price</th>\
            <th>Total price</th>\
          </tr>\
        </thead>\
        <tbody>';

    // Render items — section-grouped when sections exist, else category-grouped
    if (statementSections.length > 0) {
        function renderPdfItemsByCat(itemsArr) {
            var sorted = sortStatementItemsByCategory(itemsArr);
            var grouped = groupStatementItemsByCategory(sorted);
            var cats = [];
            statementCategoryOrder.forEach(function(c) { if (grouped[c]) cats.push(c); });
            Object.keys(grouped).forEach(function(c) { if (cats.indexOf(c) === -1) cats.push(c); });
            cats.forEach(function(c) {
                bodyContent += '<tr class="category-row"><td colspan="4"><strong>' + c + '</strong></td></tr>';
                grouped[c].forEach(function(item) {
                    bodyContent += '<tr><td>' + item.description + '</td><td>' + item.quantity + '</td><td>£' + item.unitPrice.toFixed(2) + '</td><td>£' + item.lineTotal.toFixed(2) + '</td></tr>';
                });
            });
        }
        var unsectioned = statementItems.filter(function(it) { return !it.section; });
        if (unsectioned.length > 0) { renderPdfItemsByCat(unsectioned); }
        statementSections.forEach(function(sectionName) {
            var sectionItems = statementItems.filter(function(it) { return it.section === sectionName; });
            if (sectionItems.length > 0) {
                bodyContent += '<tr style="background: #d4af37;"><td colspan="4" style="padding: 10px 12px; font-weight: bold; color: white; font-size: 13px;">' + sectionName + '</td></tr>';
                renderPdfItemsByCat(sectionItems);
            }
        });
    } else {
        var sortedItems = sortStatementItemsByCategory(statementItems);
        var groupedItems = groupStatementItemsByCategory(sortedItems);
        var allCategories = [];
        statementCategoryOrder.forEach(function(cat) { if (groupedItems[cat]) allCategories.push(cat); });
        Object.keys(groupedItems).forEach(function(cat) { if (allCategories.indexOf(cat) === -1) allCategories.push(cat); });
        allCategories.forEach(function(category) {
            if (groupedItems[category]) {
                bodyContent += '<tr class="category-row"><td colspan="4"><strong>' + category + '</strong></td></tr>';
                groupedItems[category].forEach(function(item) {
                    bodyContent += '<tr><td>' + item.description + '</td><td>' + item.quantity + '</td><td>£' + item.unitPrice.toFixed(2) + '</td><td>£' + item.lineTotal.toFixed(2) + '</td></tr>';
                });
            }
        });
    }

    bodyContent += '</tbody></table>';

    bodyContent += '<div class="notes-section">\
        <h3>Notes:</h3>\
        <ol>\
          <li>Statement includes all works from accepted estimate/s</li>\
          <li>Statement also includes all payment made.</li>\
        </ol>\
        ' + (customNotes ? '<div style="margin-top: 15px; font-size: 12px; line-height: 1.8; color: #666;"><strong>Additional Notes:</strong><br>' + customNotes.replace(/\n/g, '<br>') + '</div>' : '') + '\
      </div>';

    bodyContent += '<div class="totals-section">\
        <div class="totals-box">\
          <div class="total-row subtotal"><span>Subtotal</span><span>£' + subtotal.toFixed(2) + '</span></div>\
          ' + (!removeVat ? '<div class="total-row vat"><span>VAT (20%)</span><span>£' + vat.toFixed(2) + '</span></div>' : '') + '\
          <div class="total-row final"><span>Total</span><span>£' + total.toFixed(2) + '</span></div>\
        </div>\
      </div>';

    bodyContent += '<div class="footer-note">\
        If you have any questions about this statement, please contact<br>\
        us at traderbrotherslimited@gmail.com, or 07931 810557\
        <div class="thank-you">Thank you for your business</div>\
      </div>\
    </div>';

    return '<!DOCTYPE html>\
<html lang="en">\
<head>\
  <meta charset="UTF-8">\
  <meta name="viewport" content="width=device-width, initial-scale=1.0">\
  <title>Statement - Trader Brothers Ltd</title>\
  ' + styles + '\
</head>\
<body>\
  ' + bodyContent + '\
</body>\
</html>';
}

function downloadStatement() {
    if (statementItems.length === 0) {
        alert('Please add items to the statement first');
        return;
    }

    var downloadBtn = event.target;
    var originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Generating PDF...';
    downloadBtn.disabled = true;

    try {
        var htmlContent = generateStatementHTML();
        var clientName = document.getElementById('statementClientName').value || 'Client';
        var stmtNumber = String(statementNumber).padStart(4, '0');
        var sanitizedClientName = clientName.replace(/[^a-z0-9]/gi, '_');
        var filename = 'Statement_' + stmtNumber + '_' + sanitizedClientName + '.pdf';

        console.log('Sending statement request to PDFShift...');

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

            console.log('Statement PDF downloaded successfully!');

            localStorage.setItem('traderBrosStatementCount', statementNumber);
            statementNumber++;
            updateStatementCounter();

            setTimeout(function() {
                alert('✓ Statement PDF downloaded successfully!\n\nFile: ' + filename);
            }, 200);
        })
        .catch(function(error) {
            console.error('Error generating statement PDF:', error);
            console.error('Error stack:', error.stack);

            var errorMessage = 'Error generating statement PDF\n\n';
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
        console.error('Error in downloadStatement:', error);
        alert('Error: ' + error.message);
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }
}
