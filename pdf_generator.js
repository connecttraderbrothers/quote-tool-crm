// PDFShift API Configuration
const PDFSHIFT_API_KEY = 'sk_baa46c861371ec5f60ab2e83221fdac1ccce517b';

// Generate complete HTML for PDF conversion
function generateCompleteHTML() {
    var clientName = document.getElementById('clientName').value || '[Client Name]';
    var clientPhone = document.getElementById('clientPhone').value;
    var clientEmail = document.getElementById('clientEmail').value;
    var projectAddress = document.getElementById('projectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('projectPostcode').value;
    var customerId = document.getElementById('customerId').value || 'N/A';
    var depositPercent = document.getElementById('depositPercent').value || '30';
    var customNotes = document.getElementById('customNotes').value.trim();
    
    var today = new Date();
    var quoteDate = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    var expiryDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    var estNumber = String(estimateNumber).padStart(4, '0');
    
    var subtotal = 0;
    for (var j = 0; j < items.length; j++) {
        subtotal += items[j].lineTotal;
    }
    var removeVat = document.getElementById('removeVat').checked;
    var vat = removeVat ? 0 : subtotal * 0.20;
    var total = subtotal + vat;

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
      .estimate-container {
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
      .estimate-banner {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        padding: 15px 20px;
        margin-bottom: 25px;
        display: inline-block;
        font-weight: bold;
        font-size: 16px;
        color: white;
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
      .estimate-details {
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
      .expiry-date {
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
      .notes-section {
        margin: 30px 0;
        padding: 20px;
        background: #f9f9f9;
        border-left: 3px solid #bc9c22;
      }
      .notes-section h3 {
        font-size: 13px;
        margin-bottom: 10px;
        color: #333;
      }
      .notes-section ol {
        margin-left: 20px;
        font-size: 12px;
        line-height: 1.8;
        color: #666;
      }
      .totals-section {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
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
        .estimate-container {
          box-shadow: none;
          padding: 20px;
        }
      }
    </style>
  `;

    var bodyContent = `
    <div class="estimate-container">
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

      <div class="estimate-banner">Estimate for</div>

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

        <div class="estimate-details">
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${quoteDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Estimate #:</span>
            <span class="info-value">${estNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Customer ID:</span>
            <span class="info-value">${customerId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Expiry Date:</span>
            <span class="expiry-date">${expiryDate}</span>
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
    function renderPdfEstimateByCat(itemsArr) {
        var sorted = sortItemsByCategory(itemsArr);
        var grouped = groupItemsByCategory(sorted);
        categoryOrder.forEach(function(cat) {
            if (grouped[cat]) {
                bodyContent += '<tr class="category-row"><td colspan="4"><strong>' + cat + '</strong></td></tr>';
                grouped[cat].forEach(function(it) {
                    bodyContent += '<tr><td>' + it.description + '</td><td>' + it.quantity + '</td><td>£' + it.unitPrice.toFixed(2) + '</td><td>£' + it.lineTotal.toFixed(2) + '</td></tr>';
                });
            }
        });
        // Custom categories not in categoryOrder
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

    if (estimateSections.length > 0) {
        var unsectioned = items.filter(function(it) { return !it.section; });
        if (unsectioned.length > 0) {
            renderPdfEstimateByCat(unsectioned);
        }
        estimateSections.forEach(function(sectionName) {
            var sectionItems = items.filter(function(it) { return it.section === sectionName; });
            if (sectionItems.length > 0) {
                bodyContent += '<tr style="background: #d4af37;"><td colspan="4" style="padding: 10px 12px; font-weight: bold; color: white; font-size: 13px;">' + sectionName + '</td></tr>';
                renderPdfEstimateByCat(sectionItems);
            }
        });
    } else {
        renderPdfEstimateByCat(items);
    }

    bodyContent += `
        </tbody>
      </table>

      <div class="notes-section">
        <h3>Notes:</h3>
        <ol>
          <li>Estimate valid for 30 days</li>
          <li>Payment of ${depositPercent}% is required to secure start date</li>
          <li>Parking to be supplied by customer</li>
          <li>Any additional work to be charged accordingly</li>
       </ol>
      ${customNotes ? '<div style="margin-top: 15px; font-size: 12px; line-height: 1.8; color: #666;"><strong>Additional Notes:</strong><br>' + customNotes.replace(/\n/g, '<br>') + '</div>' : ''}
    </div>
    
      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row subtotal">
            <span>Subtotal</span>
            <span>£${subtotal.toFixed(2)}</span>
          </div>
          ${!removeVat ? '<div class="total-row vat"><span>VAT (20%)</span><span>£' + vat.toFixed(2) + '</span></div>' : ''}
          <div class="total-row final">
            <span>Total</span>
            <span>£${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer-note">
        If you have any questions about this estimate, please contact<br>
        us at traderbrotherslimited@gmail.com, or 07931 810557
        <div class="thank-you">Thank you for your business</div>
      </div>
    `;
    var importPayload = JSON.stringify({ v: 1, items: items, sections: estimateSections });
    var importEncoded = btoa(encodeURIComponent(importPayload));
    bodyContent += '<div style="font-size:4pt;color:#f5f5f5;font-family:Courier,monospace;line-height:4pt;word-break:break-all;margin:4px 0 0 0;padding:0;">OMEGA_IMPORT_V1_START' + importEncoded + 'OMEGA_IMPORT_V1_END</div></div>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate - Trader Brothers Ltd</title>
  ${styles}
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

// Download PDF using PDFShift API
async function downloadQuote() {
    if (items.length === 0) {
        alert('Please add items to the quote first');
        return;
    }

    var downloadBtn = event.target;
    var originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Generating PDF...';
    downloadBtn.disabled = true;

    try {
        var htmlContent = generateCompleteHTML();
        var clientName = document.getElementById('clientName').value || 'Client';
        var estNumber = String(estimateNumber).padStart(4, '0');
        var sanitizedClientName = clientName.replace(/[^a-z0-9]/gi, '_');
        var filename = 'Estimate_' + estNumber + '_' + sanitizedClientName + '.pdf';

        console.log('Sending request to PDFShift...');

        var response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa('api:' + PDFSHIFT_API_KEY),
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
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            var errorData;
            try {
                errorData = await response.json();
                console.error('PDFShift error response:', errorData);
            } catch (e) {
                errorData = { error: await response.text() || 'Unknown error' };
            }

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
        }

        console.log('Receiving PDF from PDFShift...');
        var blob = await response.blob();

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

        console.log('PDF downloaded successfully!');
        
        localStorage.setItem('traderBrosEstimateCount', estimateNumber);
        estimateNumber++;
        updateEstimateCounter();

        setTimeout(function() {
            alert('✓ PDF downloaded successfully!\n\nFile: ' + filename);
        }, 200);

    } catch (error) {
        console.error('Error generating PDF:', error);
        console.error('Error stack:', error.stack);

        var errorMessage = 'Error generating PDF\n\n';
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

    } finally {
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }
}
