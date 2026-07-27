var items = [];
var currentRateType = 'job';
var estimateNumber = 1;
var editingIndex = -1;
var estimateSections = [];
var activeEstimateSection = null;

// Define category order (matches dropdown menu order)
var categoryOrder = [
    'Downtakings',
    'General Building',
    'Building work',
    'Carpentry',
    'Joinery',
    'Electrical',
    'Electricals',
    'Plumbing',
    'Gas work/Plumbing',
    'Plastering',
    'Skimming /Painting',
    'Painting & Decorating',
    'Tiling',
    'Roofing',
    'Kitchen Fitting',
    'Bathroom Fitting',
    'Bathrooms',
    'Flooring',
    'Bricklaying',
    'HVAC',
    'Groundworks',
    'Scaffolding',
    'Glazing',
    'Insulation',
    'Materials'
];

// Edinburgh 2025 standard trade rates
var tradeRates = {
    'Downtakings': { hourly: 30, daily: 220, job: 0 },
    'General Building': { hourly: 30, daily: 230, job: 0 },
    'Building work': { hourly: 30, daily: 230, job: 0 },
    'Carpentry': { hourly: 32, daily: 240, job: 0 },
    'Joinery': { hourly: 32, daily: 240, job: 0 },
    'Electrical': { hourly: 45, daily: 320, job: 200 },
    'Electricals': { hourly: 45, daily: 320, job: 200 },
    'Plumbing': { hourly: 45, daily: 300, job: 200 },
    'Gas work/Plumbing': { hourly: 50, daily: 340, job: 250 },
    'Plastering': { hourly: 30, daily: 240, job: 0 },
    'Skimming /Painting': { hourly: 28, daily: 220, job: 0 },
    'Painting & Decorating': { hourly: 28, daily: 220, job: 0 },
    'Tiling': { hourly: 32, daily: 250, job: 0 },
    'Roofing': { hourly: 35, daily: 260, job: 0 },
    'Kitchen Fitting': { hourly: 32, daily: 250, job: 3000 },
    'Bathroom Fitting': { hourly: 32, daily: 250, job: 2200 },
    'Bathrooms': { hourly: 32, daily: 250, job: 2200 },
    'Flooring': { hourly: 28, daily: 220, job: 0 },
    'Bricklaying': { hourly: 32, daily: 250, job: 0 },
    'HVAC': { hourly: 40, daily: 300, job: 0 },
    'Groundworks': { hourly: 30, daily: 230, job: 0 },
    'Scaffolding': { hourly: 0, daily: 200, job: 0 },
    'Glazing': { hourly: 32, daily: 250, job: 0 },
    'Insulation': { hourly: 28, daily: 220, job: 0 },
    'Materials': { hourly: 0, daily: 0, job: 0 }
};

// Load estimate counter
if (localStorage.getItem('traderBrosEstimateCount')) {
    estimateNumber = parseInt(localStorage.getItem('traderBrosEstimateCount')) + 1;
}
updateEstimateCounter();

function updateEstimateCounter() {
    document.getElementById('estimateCounter').textContent = '#' + String(estimateNumber).padStart(4, '0');
}

function editEstimateNumber() {
    var current = estimateNumber;
    var input = prompt('Enter new estimate number:', current);
    if (input === null) return;
    var num = parseInt(input, 10);
    if (isNaN(num) || num < 1) {
        alert('Please enter a valid number (1 or greater).');
        return;
    }
    estimateNumber = num;
    localStorage.setItem('traderBrosEstimateCount', num - 1);
    updateEstimateCounter();
}

// Auto-generate Customer ID from client name
document.getElementById('clientName').addEventListener('input', function() {
    var name = this.value.trim();
    if (name) {
        var parts = name.split(' ');
        var customerId = '';
        
        if (parts.length >= 2) {
            var firstName = parts[0].substring(0, 3).toUpperCase();
            var lastName = parts[parts.length - 1].substring(0, 3).toUpperCase();
            var randomNum = Math.floor(1000 + Math.random() * 9000);
            customerId = firstName + lastName + randomNum;
        } else if (parts.length === 1) {
            var singleName = parts[0].substring(0, 6).toUpperCase();
            var randomNum = Math.floor(1000 + Math.random() * 9000);
            customerId = singleName + randomNum;
        }
        
        document.getElementById('customerId').value = customerId;
    } else {
        document.getElementById('customerId').value = '';
    }
});

// Trade category change handler
document.getElementById('tradeCategory').addEventListener('change', function() {
    var selectedTrade = this.value;
    var rateInfo = document.getElementById('tradeRateInfo');
    
    var customGroup = document.getElementById('customCategoryGroup');
    if (selectedTrade === 'Custom') {
        customGroup.classList.remove('hidden');
        rateInfo.textContent = '';
        document.getElementById('unitPrice').value = '';
    } else {
        customGroup.classList.add('hidden');
        if (selectedTrade && tradeRates[selectedTrade]) {
            var rates = tradeRates[selectedTrade];
            var infoText = 'Standard rates: ';
            var rateParts = [];
            if (rates.hourly > 0) rateParts.push('£' + rates.hourly + '/hr');
            if (rates.daily > 0) rateParts.push('£' + rates.daily + '/day');
            if (rates.job > 0) rateParts.push('£' + rates.job + '/job');
            if (rateParts.length > 0) {
                infoText += rateParts.join(' | ');
                rateInfo.textContent = infoText;
            } else {
                rateInfo.textContent = '';
            }
            updatePriceFromTrade();
        } else {
            rateInfo.textContent = '';
            document.getElementById('unitPrice').value = '';
        }
    }
});

function updatePriceFromTrade() {
    var selectedTrade = document.getElementById('tradeCategory').value;
    if (selectedTrade && tradeRates[selectedTrade]) {
        var rates = tradeRates[selectedTrade];
        var price = 0;
        
        if (currentRateType === 'hourly' && rates.hourly > 0) {
            price = rates.hourly;
        } else if (currentRateType === 'daily' && rates.daily > 0) {
            price = rates.daily;
        } else if (currentRateType === 'job' && rates.job > 0) {
            price = rates.job;
        }
        
        if (price > 0) {
            document.getElementById('unitPrice').value = price;
        }
    }
}

// Rate type selector
document.querySelectorAll('.rate-type-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.rate-type-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        currentRateType = this.getAttribute('data-type');
        
        var customUnitGroup = document.getElementById('customUnitGroup');
        var rateLabel = document.getElementById('rateLabel');
        
        if (currentRateType === 'custom') {
            customUnitGroup.classList.remove('hidden');
            rateLabel.textContent = 'Unit Price (£) *';
        } else if (currentRateType === 'daily') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Day Rate (£) *';
        } else if (currentRateType === 'job') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Per Job Rate (£) *';
        } else {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Hourly Rate (£) *';
        }
        
        updatePriceFromTrade();
    });
});

function addItem() {
    var category = document.getElementById('tradeCategory').value || 'General';
    if (category === 'Custom') {
        category = document.getElementById('customCategoryName').value.trim();
        if (!category) { alert('Please enter a category name.'); return; }
    }
    var description = document.getElementById('description').value;
    var quantity = parseFloat(document.getElementById('quantity').value);
    var unitPrice = parseFloat(document.getElementById('unitPrice').value);
    var customUnit = document.getElementById('customUnit').value;

    if (!description || !unitPrice) {
        alert('Please enter description and unit price');
        return;
    }

    var unit = '';
    if (currentRateType === 'hourly') {
        unit = 'hour';
    } else if (currentRateType === 'daily') {
        unit = 'day';
    } else if (currentRateType === 'job') {
        unit = 'job';
    } else {
        unit = customUnit || 'item';
    }

    var lineTotal = unitPrice * quantity;

    items.push({
        category: category,
        description: description,
        quantity: quantity,
        unit: unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal,
        section: activeEstimateSection || ''
    });

    updateQuoteTable();
    clearForm();
}

function clearForm() {
    document.getElementById('description').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('unitPrice').value = '';
    document.getElementById('customUnit').value = '';
    document.getElementById('tradeCategory').selectedIndex = 0;
    document.getElementById('tradeRateInfo').textContent = '';
    document.getElementById('customCategoryName').value = '';
    document.getElementById('customCategoryGroup').classList.add('hidden');
}

function editItem(index) {
    if (editingIndex >= 0) {
        cancelEdit();
    }
    
    editingIndex = index;
    var item = items[index];
    
    var categoryOptions = '';
    var categories = Object.keys(tradeRates);
    categories.unshift('General');
    // If the item's category isn't in the known list (custom name), add it so it shows correctly
    if (item.category && categories.indexOf(item.category) === -1) {
        categories.push(item.category);
    }
    for (var i = 0; i < categories.length; i++) {
        var selected = categories[i] === item.category ? 'selected' : '';
        categoryOptions += '<option value="' + categories[i] + '" ' + selected + '>' + categories[i] + '</option>';
    }
    
    var allRows = document.getElementById('quoteItems').rows;
    var row = null;
    for (var ri = 0; ri < allRows.length; ri++) {
        if (allRows[ri].getAttribute('data-item-index') == index) { row = allRows[ri]; break; }
    }
    if (!row) return;
    row.classList.add('editing-row');
    row.innerHTML = `
        <td>
            <select class="inline-edit-input" id="edit-category-${index}" style="width: 100%;">
                ${categoryOptions}
            </select>
        </td>
        <td>
            <input type="text" class="inline-edit-input" id="edit-description-${index}" value="${item.description}" style="width: 100%;">
        </td>
        <td class="text-center">
            <input type="number" class="inline-edit-input" id="edit-quantity-${index}" value="${item.quantity}" step="0.1" min="0.1" style="width: 80px;">
        </td>
        <td class="text-right">
            <input type="number" class="inline-edit-input" id="edit-price-${index}" value="${item.unitPrice}" step="0.01" min="0" style="width: 100px;">
        </td>
        <td class="text-right" style="font-weight: 600;">£${item.lineTotal.toFixed(2)}</td>
        <td class="text-center">
            <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-action btn-save" onclick="saveEdit(${index})" title="Save">Save</button>
                <button class="btn-action btn-cancel" onclick="cancelEdit()" title="Cancel">Cancel</button>
            </div>
        </td>
    `;
    
    document.getElementById('edit-quantity-' + index).addEventListener('input', function() {
        updateEditTotal(index);
    });
    document.getElementById('edit-price-' + index).addEventListener('input', function() {
        updateEditTotal(index);
    });
}

function updateEditTotal(index) {
    var quantity = parseFloat(document.getElementById('edit-quantity-' + index).value) || 0;
    var price = parseFloat(document.getElementById('edit-price-' + index).value) || 0;
    var total = quantity * price;

    var allRows = document.getElementById('quoteItems').rows;
    var row = null;
    for (var ri = 0; ri < allRows.length; ri++) {
        if (allRows[ri].getAttribute('data-item-index') == index) { row = allRows[ri]; break; }
    }
    if (row) row.cells[4].textContent = '£' + total.toFixed(2);
}

function saveEdit(index) {
    var category = document.getElementById('edit-category-' + index).value;
    var description = document.getElementById('edit-description-' + index).value;
    var quantity = parseFloat(document.getElementById('edit-quantity-' + index).value);
    var unitPrice = parseFloat(document.getElementById('edit-price-' + index).value);
    
    if (!description || !unitPrice || !quantity) {
        alert('Please fill in all fields');
        return;
    }
    
    var lineTotal = unitPrice * quantity;
    
    items[index] = {
        category: category,
        description: description,
        quantity: quantity,
        unit: items[index].unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal,
        section: items[index].section || ''
    };
    
    editingIndex = -1;
    updateQuoteTable();
}

function cancelEdit() {
    editingIndex = -1;
    updateQuoteTable();
}

function removeItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        items.splice(index, 1);
        editingIndex = -1;
        updateQuoteTable();
    }
}

function moveItem(index, direction) {
    if (editingIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    if (direction === 'up' && index > 0) {
        var temp = items[index];
        items[index] = items[index - 1];
        items[index - 1] = temp;
    } else if (direction === 'down' && index < items.length - 1) {
        var temp = items[index];
        items[index] = items[index + 1];
        items[index + 1] = temp;
    }
    updateQuoteTable();
}

function repositionItem(index) {
    if (editingIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    var newPosition = prompt('Enter new position (1 to ' + items.length + '):', (index + 1));
    if (newPosition === null) return;
    
    newPosition = parseInt(newPosition);
    if (isNaN(newPosition) || newPosition < 1 || newPosition > items.length) {
        alert('Invalid position. Please enter a number between 1 and ' + items.length);
        return;
    }
    
    var item = items.splice(index, 1)[0];
    items.splice(newPosition - 1, 0, item);
    updateQuoteTable();
}

// Helper function to sort items by category order
function sortItemsByCategory(itemsArray) {
    return itemsArray.slice().sort(function(a, b) {
        var indexA = categoryOrder.indexOf(a.category);
        var indexB = categoryOrder.indexOf(b.category);
        
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        
        return indexA - indexB;
    });
}

// Helper function to group items by category
function groupItemsByCategory(itemsArray) {
    var grouped = {};
    itemsArray.forEach(function(item) {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    return grouped;
}

function renderEstimateItemRowHtml(item, i) {
    var html = '<tr data-item-index="' + i + '">';
    html += '<td>' + item.category + '</td>';
    html += '<td>' + item.description + '</td>';
    html += '<td class="text-center">' + item.quantity + '</td>';
    html += '<td class="text-right">£' + item.unitPrice.toFixed(2) + '</td>';
    html += '<td class="text-right" style="font-weight: 600;">£' + item.lineTotal.toFixed(2) + '</td>';
    html += '<td class="text-center">';
    html += '<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">';
    html += '<button class="btn-action btn-edit" onclick="editItem(' + i + ')" title="Edit">Edit</button>';
    html += '<button class="btn-action btn-move" onclick="moveItem(' + i + ', \'up\')" title="Move Up" ' + (i === 0 ? 'disabled' : '') + '>↑</button>';
    html += '<button class="btn-action btn-move" onclick="moveItem(' + i + ', \'down\')" title="Move Down" ' + (i === items.length - 1 ? 'disabled' : '') + '>↓</button>';
    html += '<button class="btn-action btn-reposition" onclick="repositionItem(' + i + ')" title="Move to Position">#</button>';
    html += '<button class="btn-action btn-delete" onclick="removeItem(' + i + ')" title="Delete">Del</button>';
    html += '</div>';
    html += '</td>';
    html += '</tr>';
    return html;
}

function updateQuoteTable() {
    var tbody = document.getElementById('quoteItems');
    var quoteSection = document.getElementById('quoteSection');
    var generateSection = document.getElementById('generateSection');

    if (items.length === 0) {
        quoteSection.style.display = 'none';
        generateSection.style.display = 'none';
        return;
    }

    quoteSection.style.display = 'block';
    generateSection.style.display = 'block';

    var html = '';
    var i, si;

    if (estimateSections.length > 0) {
        // Render unsectioned items first
        var hasUnsectioned = false;
        for (i = 0; i < items.length; i++) {
            if (!items[i].section) { hasUnsectioned = true; break; }
        }
        if (hasUnsectioned) {
            html += '<tr style="background: #333; border-bottom: 2px solid #555;"><td colspan="6" style="padding: 8px 12px; font-weight: bold; color: #aaa; font-size: 12px; font-style: italic;">Unsectioned Items</td></tr>';
            for (i = 0; i < items.length; i++) {
                if (!items[i].section) {
                    html += renderEstimateItemRowHtml(items[i], i);
                }
            }
        }
        // Render each named section
        for (si = 0; si < estimateSections.length; si++) {
            var sectionName = estimateSections[si];
            var hasSectionItems = false;
            for (i = 0; i < items.length; i++) {
                if (items[i].section === sectionName) { hasSectionItems = true; break; }
            }
            if (hasSectionItems) {
                html += '<tr style="background: #f0e8cc;"><td colspan="6" style="padding: 8px 12px; font-weight: bold; color: #5a4200; font-size: 13px;">' + sectionName + '</td></tr>';
                for (i = 0; i < items.length; i++) {
                    if (items[i].section === sectionName) {
                        html += renderEstimateItemRowHtml(items[i], i);
                    }
                }
            }
        }
    } else {
        for (i = 0; i < items.length; i++) {
            html += renderEstimateItemRowHtml(items[i], i);
        }
    }

    var subtotal = 0;
    for (var j = 0; j < items.length; j++) {
        subtotal += items[j].lineTotal;
    }

    var removeVat = document.getElementById('removeVat').checked;
    var vat = removeVat ? 0 : subtotal * 0.20;
    var total = subtotal + vat;

    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right">Subtotal:</td>';
    html += '<td class="text-right">£' + subtotal.toFixed(2) + '</td>';
    html += '<td></td>';
    html += '</tr>';
    if (!removeVat) {
        html += '<tr class="total-row">';
        html += '<td colspan="4" class="text-right">VAT (20%):</td>';
        html += '<td class="text-right">£' + vat.toFixed(2) + '</td>';
        html += '<td></td>';
        html += '</tr>';
    }
    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right" style="font-size: 16px;"><strong>TOTAL:</strong></td>';
    html += '<td class="text-right" style="font-size: 16px;"><strong>£' + total.toFixed(2) + '</strong></td>';
    html += '<td></td>';
    html += '</tr>';

    tbody.innerHTML = html;
}

function previewQuote() {
    if (editingIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    var clientName = document.getElementById('clientName').value || '[Client Name]';
    var clientPhone = document.getElementById('clientPhone').value;
    var clientEmail = document.getElementById('clientEmail').value;
    var projectAddress = document.getElementById('projectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('projectPostcode').value;
    var customerId = document.getElementById('customerId').value || 'N/A';
    var depositPercent = document.getElementById('depositPercent').value || '30';
    var customNotes = document.getElementById('customNotes').value.trim();
    
    var today = new Date();
    var quoteDate = today.toLocaleDateString('en-GB');
    var expiryDate = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    var estNumber = String(estimateNumber).padStart(4, '0');
    
    var subtotal = 0;
    for (var j = 0; j < items.length; j++) {
        subtotal += items[j].lineTotal;
    }
    var removeVat = document.getElementById('removeVat').checked;
    var vat = removeVat ? 0 : subtotal * 0.20;
    var total = subtotal + vat;

    var previewHtml = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      .estimate-container-preview { font-family: Arial, sans-serif; background: white; padding: 30px; max-width: 100%; }
      .header-preview { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
      .company-info-preview { flex: 1; }
      .company-name-preview { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }
      .company-name-preview .highlight-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .company-details-preview { font-size: 11px; line-height: 1.6; color: #666; }
      .logo-preview { width: 120px; height: auto; }
      .estimate-banner-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 15px 20px; margin-bottom: 25px; display: inline-block; font-weight: bold; font-size: 16px; color: white; }
      .info-section-preview { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; gap: 100px; }
      .client-info-preview { flex: 0 0 auto; }
      .estimate-details-preview { flex: 0 0 auto; }
      .info-row-preview { font-size: 13px; line-height: 2; display: flex; align-items: center; }
      .info-label-preview { color: #333; font-weight: bold; margin-right: 10px; min-width: 80px; }
      .info-value-preview { color: #333; font-weight: normal; }
      .expiry-date-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 5px 10px; display: inline-block; color: white; font-weight: normal; }
      .items-table-preview { width: 100%; border-collapse: collapse; margin: 30px 0; }
      .items-table-preview thead { background: #f5f5f5; }
      .items-table-preview th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }
      .items-table-preview th:nth-child(2), .items-table-preview th:nth-child(3), .items-table-preview th:nth-child(4) { text-align: right; width: 100px; }
      .items-table-preview td { padding: 12px; font-size: 13px; border-bottom: 1px solid #eee; color: #333; }
      .items-table-preview td:nth-child(2), .items-table-preview td:nth-child(3), .items-table-preview td:nth-child(4) { text-align: right; }
      .category-row { background: #f9f9f9; font-weight: bold; color: #333; }
      .category-row td { padding: 10px 12px; border-bottom: 2px solid #ddd; }
      .notes-section-preview { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #bc9c22; }
      .notes-section-preview h3 { font-size: 13px; margin-bottom: 10px; color: #333; }
      .notes-section-preview ol { margin-left: 20px; font-size: 12px; line-height: 1.8; color: #666; }
      .totals-section-preview { margin-top: 30px; display: flex; justify-content: flex-end; }
      .totals-box-preview { width: 300px; }
      .total-row-preview { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; }
      .total-row-preview.subtotal { border-top: 1px solid #ddd; }
      .total-row-preview.vat { color: #666; }
      .total-row-preview.final { background: linear-gradient(135deg, #bc9c22, #d4af37); color: white; font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 5px; }
      .footer-note-preview { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; font-style: italic; }
      .thank-you-preview { margin-top: 15px; font-weight: bold; color: #333; font-size: 12px; }
    </style>
    <div class="estimate-container-preview">
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

      <div class="estimate-banner-preview">Estimate for</div>

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

        <div class="estimate-details-preview">
          <div class="info-row-preview">
            <span class="info-label-preview">Date:</span>
            <span class="info-value-preview">${quoteDate}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Estimate #:</span>
            <span class="info-value-preview">${estNumber}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Customer ID:</span>
            <span class="info-value-preview">${customerId}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Expiry Date:</span>
            <span class="expiry-date-preview">${expiryDate}</span>
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
    function renderPreviewEstimateByCat(itemsArr) {
        var sorted = sortItemsByCategory(itemsArr);
        var grouped = groupItemsByCategory(sorted);
        categoryOrder.forEach(function(cat) {
            if (grouped[cat]) {
                previewHtml += '<tr class="category-row"><td colspan="4"><strong>' + cat + '</strong></td></tr>';
                grouped[cat].forEach(function(it) {
                    previewHtml += '<tr><td>' + it.description + '</td><td>' + it.quantity + '</td><td>£' + it.unitPrice.toFixed(2) + '</td><td>£' + it.lineTotal.toFixed(2) + '</td></tr>';
                });
            }
        });
        // Custom categories not in categoryOrder
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

    if (estimateSections.length > 0) {
        var unsectionedItems = items.filter(function(it) { return !it.section; });
        if (unsectionedItems.length > 0) {
            renderPreviewEstimateByCat(unsectionedItems);
        }
        estimateSections.forEach(function(sectionName) {
            var sectionItems = items.filter(function(it) { return it.section === sectionName; });
            if (sectionItems.length > 0) {
                previewHtml += '<tr style="background: #d4af37;"><td colspan="4" style="padding: 10px 12px; font-weight: bold; color: white; font-size: 13px;">' + sectionName + '</td></tr>';
                renderPreviewEstimateByCat(sectionItems);
            }
        });
    } else {
        var sortedItems = sortItemsByCategory(items);
        var groupedItems = groupItemsByCategory(sortedItems);
        categoryOrder.forEach(function(category) {
            if (groupedItems[category]) {
                previewHtml += '<tr class="category-row"><td colspan="4"><strong>' + category + '</strong></td></tr>';
                groupedItems[category].forEach(function(item) {
                    previewHtml += '<tr><td>' + item.description + '</td><td>' + item.quantity + '</td><td>£' + item.unitPrice.toFixed(2) + '</td><td>£' + item.lineTotal.toFixed(2) + '</td></tr>';
                });
            }
        });
    }

    previewHtml += `
        </tbody>
      </table>

     <div class="notes-section-preview">
       <h3>Notes:</h3>
       <ol>
         <li>Estimate valid for 31 days</li>
         <li>Payment of ${depositPercent}% is required to secure start date</li>
         <li>Parking to be supplied by customer</li>
         <li>Any extras to be charged accordingly</li>
      </ol>
     ${customNotes ? '<div style="margin-top: 15px; font-size: 12px; line-height: 1.8; color: #666;"><strong>Additional Notes:</strong><br>' + customNotes.replace(/\n/g, '<br>') + '</div>' : ''}
   </div>
   
      <div class="totals-section-preview">
        <div class="totals-box-preview">
          <div class="total-row-preview subtotal">
            <span>Subtotal</span>
            <span>£${subtotal.toFixed(2)}</span>
          </div>
          ${!removeVat ? `<div class="total-row-preview vat">
            <span>VAT (20%)</span>
            <span>£${vat.toFixed(2)}</span>
          </div>` : ''}
          <div class="total-row-preview final">
            <span>Total</span>
            <span>£${total.toFixed(2)}</span>
          </div>
         </div>
        </div>

      <div class="footer-note-preview">
        If you have any questions about this estimate, please contact<br>
        traderbrotherslimited@gmail.com, or 07931 810557
        <div class="thank-you-preview">Thank you for your business</div>
      </div>
    </div>`;

    document.getElementById('previewBody').innerHTML = previewHtml;
    document.getElementById('previewModal').style.display = 'block';
}

function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
}

window.onclick = function(event) {
    var modal = document.getElementById('previewModal');
    if (event.target == modal) {
        closePreview();
    }
};

// Estimate Sectioning functions
function addEstimateSection() {
    var nameInput = document.getElementById('estimateNewSectionName');
    var name = nameInput.value.trim();
    if (!name) {
        alert('Please enter a section name');
        return;
    }
    if (estimateSections.indexOf(name) >= 0) {
        alert('A section with that name already exists');
        return;
    }
    estimateSections.push(name);
    if (estimateSections.length === 1) {
        activeEstimateSection = name;
    }
    nameInput.value = '';
    renderEstimateSections();
}

function removeEstimateSection(name) {
    var sectionItems = items.filter(function(it) { return it.section === name; });
    if (sectionItems.length > 0) {
        if (!confirm('Section "' + name + '" contains items. They will become unsectioned. Continue?')) {
            return;
        }
        for (var i = 0; i < items.length; i++) {
            if (items[i].section === name) { items[i].section = ''; }
        }
    }
    var idx = estimateSections.indexOf(name);
    if (idx >= 0) { estimateSections.splice(idx, 1); }
    if (activeEstimateSection === name) {
        activeEstimateSection = estimateSections.length > 0 ? estimateSections[0] : null;
    }
    renderEstimateSections();
    updateQuoteTable();
}

function setActiveEstimateSection(name) {
    activeEstimateSection = name;
    renderEstimateSections();
}

function renderEstimateSections() {
    var container = document.getElementById('estimateSectionsList');
    if (estimateSections.length === 0) {
        container.innerHTML = '<p style="font-size: 13px; color: #888; font-style: italic;">No sections added yet.</p>';
        updateEstimateActiveSectionIndicator();
        return;
    }
    var html = '';
    for (var i = 0; i < estimateSections.length; i++) {
        var sectionName = estimateSections[i];
        var isActive = activeEstimateSection === sectionName;
        html += '<div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: ' + (isActive ? '#fff8e7' : '#2a2a2a') + '; border: 1px solid ' + (isActive ? '#d4af37' : '#444') + '; border-radius: 6px; margin-bottom: 8px;">';
        html += '<input type="radio" name="estimateActiveSection" value="' + sectionName.replace(/'/g, '&#39;') + '" ' + (isActive ? 'checked' : '') + ' onchange="setActiveEstimateSection(\'' + sectionName.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\')" style="cursor: pointer;">';
        html += '<span style="flex: 1; font-size: 13px; color: ' + (isActive ? '#5a4200' : '#ccc') + '; font-weight: ' + (isActive ? 'bold' : 'normal') + ';">' + sectionName + '</span>';
        html += '<button class="btn-action btn-delete" onclick="removeEstimateSection(\'' + sectionName.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\')" style="font-size: 11px; padding: 3px 8px;">Remove</button>';
        html += '</div>';
    }
    container.innerHTML = html;
    updateEstimateActiveSectionIndicator();
}

function updateEstimateActiveSectionIndicator() {
    var indicator = document.getElementById('estimateActiveSectionIndicator');
    if (estimateSections.length > 0 && activeEstimateSection) {
        indicator.style.display = 'block';
        indicator.textContent = 'Adding items to section: ' + activeEstimateSection;
    } else if (estimateSections.length > 0) {
        indicator.style.display = 'block';
        indicator.textContent = 'No section selected — items will be unsectioned';
    } else {
        indicator.style.display = 'none';
    }
}

function exportEstimateItems() {
    if (items.length === 0) {
        alert('No items to export. Please add items first.');
        return;
    }
    var num = String(estimateNumber).padStart(4, '0');
    var data = {
        source: 'estimate',
        number: num,
        items: items,
        sections: estimateSections
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'estimate-' + num + '.tbdata.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── PDF Import ─────────────────────────────────────────────────────────────

(function initEstimateImportZone() {
    function ready(fn) {
        if (document.readyState !== 'loading') { fn(); } else { document.addEventListener('DOMContentLoaded', fn); }
    }
    ready(function() {
        var zone = document.getElementById('estimateImportZone');
        if (!zone) return;
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            setEstimateImportZoneState('over');
        });
        zone.addEventListener('dragleave', function(e) {
            if (!zone.contains(e.relatedTarget)) setEstimateImportZoneState('idle');
        });
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            setEstimateImportZoneState('idle');
            var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                processEstimatePDFFile(file);
            } else {
                alert('Please drop a PDF file.');
            }
        });
    });
}());

function handleEstimatePDFImport(event) {
    var file = event.target.files && event.target.files[0];
    if (file) processEstimatePDFFile(file);
    event.target.value = '';
}

function processEstimatePDFFile(file) {
    setEstimateImportZoneState('loading');
    var reader = new FileReader();
    reader.onload = function(e) {
        var arrayBuffer = e.target.result;
        extractEstimatePDFText(arrayBuffer)
            .then(function(text) {
                var data = decodeOmegaImportPayload(text);
                if (!data) {
                    setEstimateImportZoneState('idle');
                    alert('No importable data found in this PDF.\n\nOnly PDFs generated by this tool (with embedded data) can be imported.');
                    return;
                }
                applyEstimateImportData(data);
                setEstimateImportZoneState('idle');
            })
            .catch(function(err) {
                setEstimateImportZoneState('idle');
                alert('Could not read the PDF. Please try again.\n\n' + err);
            });
    };
    reader.readAsArrayBuffer(file);
}

function extractEstimatePDFText(arrayBuffer) {
    return pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function(pdf) {
        var pagePromises = [];
        for (var i = 1; i <= pdf.numPages; i++) {
            pagePromises.push(
                pdf.getPage(i).then(function(page) {
                    return page.getTextContent().then(function(tc) {
                        return tc.items.map(function(item) { return item.str; }).join('');
                    });
                })
            );
        }
        return Promise.all(pagePromises).then(function(pages) { return pages.join(''); });
    });
}

function decodeOmegaImportPayload(text) {
    var start = text.indexOf('OMEGA_IMPORT_V1_START');
    var end = text.indexOf('OMEGA_IMPORT_V1_END');
    if (start === -1 || end === -1) return null;
    var raw = text.slice(start + 'OMEGA_IMPORT_V1_START'.length, end).replace(/\s/g, '');
    try {
        return JSON.parse(decodeURIComponent(atob(raw)));
    } catch (err) {
        return null;
    }
}

function applyEstimateImportData(data) {
    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
        alert('The imported PDF has no line items.');
        return;
    }
    if (!confirm('Import ' + data.items.length + ' item(s)' + (data.sections && data.sections.length ? ' and ' + data.sections.length + ' section(s)' : '') + ' from this estimate?\n\nThis will replace all current items and sections.')) {
        return;
    }
    // Replace sections
    estimateSections = [];
    if (Array.isArray(data.sections)) {
        for (var s = 0; s < data.sections.length; s++) {
            var sName = String(data.sections[s]).trim();
            if (sName) estimateSections.push(sName);
        }
    }
    activeEstimateSection = estimateSections.length > 0 ? estimateSections[0] : null;
    renderEstimateSections();
    updateEstimateActiveSectionIndicator();
    // Replace items
    items = [];
    for (var i = 0; i < data.items.length; i++) {
        var src = data.items[i];
        items.push({
            category:    String(src.category || ''),
            description: String(src.description || ''),
            quantity:    Number(src.quantity) || 0,
            unit:        String(src.unit || 'job'),
            unitPrice:   Number(src.unitPrice) || 0,
            lineTotal:   Number(src.lineTotal) || 0,
            section:     String(src.section || '')
        });
    }
    updateQuoteTable();
    alert('Import successful: ' + items.length + ' item(s) loaded.');
}

function setEstimateImportZoneState(state) {
    var zone = document.getElementById('estimateImportZone');
    if (!zone) return;
    if (state === 'over') {
        zone.classList.add('import-zone-over');
        zone.querySelector('.import-zone-text').textContent = 'Release to import';
    } else if (state === 'loading') {
        zone.classList.remove('import-zone-over');
        zone.querySelector('.import-zone-icon').textContent = '\u23F3';
        zone.querySelector('.import-zone-text').textContent = 'Reading PDF\u2026';
        zone.querySelector('.import-zone-sub').textContent = '';
    } else {
        zone.classList.remove('import-zone-over');
        zone.querySelector('.import-zone-icon').innerHTML = '&#128196;';
        zone.querySelector('.import-zone-text').textContent = 'Drag & drop an estimate PDF here';
        zone.querySelector('.import-zone-sub').textContent = 'or click to browse files';
    }
}
