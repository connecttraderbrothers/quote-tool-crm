var statementItems = [];
var currentStatementRateType = 'job';
var statementNumber = 1;
var editingStatementIndex = -1;
var statementSections = [];
var activeStatementSection = null;

// Define category order (matches dropdown menu order)
var statementCategoryOrder = [
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
var statementTradeRates = {
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

// Load statement counter
if (localStorage.getItem('traderBrosStatementCount')) {
    statementNumber = parseInt(localStorage.getItem('traderBrosStatementCount')) + 1;
}
updateStatementCounter();

function updateStatementCounter() {
    document.getElementById('statementCounter').textContent = '#' + String(statementNumber).padStart(4, '0');
}

function editStatementNumber() {
    var current = statementNumber;
    var input = prompt('Enter new statement number:', current);
    if (input === null) return;
    var num = parseInt(input, 10);
    if (isNaN(num) || num < 1) {
        alert('Please enter a valid number (1 or greater).');
        return;
    }
    statementNumber = num;
    localStorage.setItem('traderBrosStatementCount', num - 1);
    updateStatementCounter();
}

// ── Section management ────────────────────────────────────────────────────────

function addStatementSection() {
    var name = document.getElementById('statementNewSectionName').value.trim();
    if (!name) {
        alert('Please enter a section name');
        return;
    }
    if (statementSections.indexOf(name) !== -1) {
        alert('A section with this name already exists');
        return;
    }
    statementSections.push(name);
    // Auto-activate the first section created
    if (statementSections.length === 1) {
        activeStatementSection = name;
    }
    document.getElementById('statementNewSectionName').value = '';
    renderStatementSections();
    updateStatementTable();
}

function removeStatementSection(name) {
    var hasItems = false;
    for (var i = 0; i < statementItems.length; i++) {
        if (statementItems[i].section === name) { hasItems = true; break; }
    }
    if (hasItems) {
        if (!confirm('Section "' + name + '" has items. Delete anyway? Those items will become unsectioned.')) {
            return;
        }
        for (var j = 0; j < statementItems.length; j++) {
            if (statementItems[j].section === name) { statementItems[j].section = ''; }
        }
    }
    var idx = statementSections.indexOf(name);
    if (idx !== -1) { statementSections.splice(idx, 1); }
    if (activeStatementSection === name) {
        activeStatementSection = statementSections.length > 0 ? statementSections[0] : null;
    }
    renderStatementSections();
    updateStatementTable();
}

function setActiveStatementSection(name) {
    activeStatementSection = name;
    renderStatementSections();
}

function renderStatementSections() {
    var container = document.getElementById('statementSectionsList');
    if (statementSections.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 13px; margin-top: 8px;">No sections yet. Add a section above to organise your line items.</p>';
        updateStatementActiveSectionIndicator();
        return;
    }
    var html = '<p style="font-size: 12px; color: #666; margin-bottom: 8px;">Tick a section to add new items into it:</p>';
    for (var i = 0; i < statementSections.length; i++) {
        var sectionName = statementSections[i];
        var isActive = sectionName === activeStatementSection;
        var itemCount = 0;
        for (var j = 0; j < statementItems.length; j++) {
            if (statementItems[j].section === sectionName) { itemCount++; }
        }
        var esc = sectionName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        html += '<div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: ' + (isActive ? '#fff8e7' : '#f9f9f9') + '; border: ' + (isActive ? '2px solid #d4af37' : '1px solid #ddd') + '; border-radius: 6px; margin-bottom: 8px;">';
        html += '<input type="radio" name="activeStatementSection" id="stmtSec_' + i + '" ' + (isActive ? 'checked' : '') + ' onchange="setActiveStatementSection(\'' + esc + '\')" style="width: 16px; height: 16px; cursor: pointer; accent-color: #d4af37;">';
        html += '<label for="stmtSec_' + i + '" style="flex: 1; font-weight: ' + (isActive ? 'bold' : 'normal') + '; cursor: pointer; color: #333; margin: 0;">';
        html += sectionName + ' <span style="font-size: 11px; color: #999; font-weight: normal;">(' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + ')</span>';
        html += '</label>';
        html += '<button onclick="removeStatementSection(\'' + esc + '\')" style="background: none; border: 1px solid #ccc; border-radius: 4px; color: #999; cursor: pointer; padding: 3px 8px; font-size: 13px; line-height: 1;" title="Remove section">\xd7</button>';
        html += '</div>';
    }
    container.innerHTML = html;
    updateStatementActiveSectionIndicator();
}

function updateStatementActiveSectionIndicator() {
    var indicator = document.getElementById('statementActiveSectionIndicator');
    if (!indicator) return;
    if (statementSections.length > 0 && activeStatementSection) {
        indicator.textContent = 'Adding items to: ' + activeStatementSection;
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

// ─────────────────────────────────────────────────────────────────────────────

// Auto-generate Customer ID from client name
document.getElementById('statementClientName').addEventListener('input', function() {
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

        document.getElementById('statementCustomerId').value = customerId;
    } else {
        document.getElementById('statementCustomerId').value = '';
    }
});

// Trade category change handler
document.getElementById('statementTradeCategory').addEventListener('change', function() {
    var selectedTrade = this.value;
    var rateInfo = document.getElementById('statementTradeRateInfo');
    var customCategoryGroup = document.getElementById('statementCustomCategoryGroup');

    // Show/hide custom category name input
    if (selectedTrade === 'Custom') {
        customCategoryGroup.classList.remove('hidden');
        rateInfo.textContent = '';
        document.getElementById('statementUnitPrice').value = '';
        return;
    } else {
        customCategoryGroup.classList.add('hidden');
    }

    if (selectedTrade && statementTradeRates[selectedTrade]) {
        var rates = statementTradeRates[selectedTrade];
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

        updateStatementPriceFromTrade();
    } else {
        rateInfo.textContent = '';
        document.getElementById('statementUnitPrice').value = '';
    }
});

function updateStatementPriceFromTrade() {
    var selectedTrade = document.getElementById('statementTradeCategory').value;
    if (selectedTrade && statementTradeRates[selectedTrade]) {
        var rates = statementTradeRates[selectedTrade];
        var price = 0;

        if (currentStatementRateType === 'hourly' && rates.hourly > 0) {
            price = rates.hourly;
        } else if (currentStatementRateType === 'daily' && rates.daily > 0) {
            price = rates.daily;
        } else if (currentStatementRateType === 'job' && rates.job > 0) {
            price = rates.job;
        }

        if (price > 0) {
            document.getElementById('statementUnitPrice').value = price;
        }
    }
}

// Rate type selector
document.querySelectorAll('.statement-rate-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.statement-rate-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        currentStatementRateType = this.getAttribute('data-type');

        var customUnitGroup = document.getElementById('statementCustomUnitGroup');
        var rateLabel = document.getElementById('statementRateLabel');

        if (currentStatementRateType === 'custom') {
            customUnitGroup.classList.remove('hidden');
            rateLabel.textContent = 'Unit Price (£) *';
        } else if (currentStatementRateType === 'daily') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Day Rate (£) *';
        } else if (currentStatementRateType === 'job') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Per Job Rate (£) *';
        } else {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Hourly Rate (£) *';
        }

        updateStatementPriceFromTrade();
    });
});

function addStatementItem() {
    if (statementSections.length > 0 && !activeStatementSection) {
        alert('Please tick a section in the Sectioning panel before adding items');
        return;
    }

    var categorySelect = document.getElementById('statementTradeCategory').value;
    var category = '';
    if (categorySelect === 'Custom') {
        category = document.getElementById('statementCustomCategoryName').value.trim();
        if (!category) {
            alert('Please enter a custom category name');
            return;
        }
    } else {
        category = categorySelect || 'General';
    }

    var description = document.getElementById('statementDescription').value;
    var quantity = parseFloat(document.getElementById('statementQuantity').value);
    var unitPrice = parseFloat(document.getElementById('statementUnitPrice').value);
    var customUnit = document.getElementById('statementCustomUnit').value;

    if (!description || !unitPrice) {
        alert('Please enter description and unit price');
        return;
    }

    var unit = '';
    if (currentStatementRateType === 'hourly') {
        unit = 'hour';
    } else if (currentStatementRateType === 'daily') {
        unit = 'day';
    } else if (currentStatementRateType === 'job') {
        unit = 'job';
    } else {
        unit = customUnit || 'item';
    }

    var lineTotal = unitPrice * quantity;

    statementItems.push({
        section: activeStatementSection || '',
        category: category,
        description: description,
        quantity: quantity,
        unit: unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    });

    updateStatementTable();
    clearStatementForm();
    if (statementSections.length > 0) { renderStatementSections(); }
}

function clearStatementForm() {
    document.getElementById('statementDescription').value = '';
    document.getElementById('statementQuantity').value = '1';
    document.getElementById('statementUnitPrice').value = '';
    document.getElementById('statementCustomUnit').value = '';
    document.getElementById('statementCustomCategoryName').value = '';
    document.getElementById('statementTradeCategory').selectedIndex = 0;
    document.getElementById('statementTradeRateInfo').textContent = '';
    document.getElementById('statementCustomCategoryGroup').classList.add('hidden');
}

function editStatementItem(index) {
    if (editingStatementIndex >= 0) {
        cancelStatementEdit();
    }

    editingStatementIndex = index;
    var item = statementItems[index];

    var categoryOptions = '';
    var categories = Object.keys(statementTradeRates);
    categories.unshift('General');
    for (var i = 0; i < categories.length; i++) {
        var selected = categories[i] === item.category ? 'selected' : '';
        categoryOptions += '<option value="' + categories[i] + '" ' + selected + '>' + categories[i] + '</option>';
    }
    // Add the item's category if it's a custom one not in the list
    var isCustom = categories.indexOf(item.category) === -1;
    if (isCustom) {
        categoryOptions += '<option value="' + item.category + '" selected>' + item.category + '</option>';
    }

    var allRows = document.getElementById('statementItemsBody').rows;
    var row = null;
    for (var ri = 0; ri < allRows.length; ri++) {
        if (allRows[ri].getAttribute('data-item-index') == index) { row = allRows[ri]; break; }
    }
    if (!row) return;
    row.classList.add('editing-row');
    row.innerHTML = '<td>' +
        '<select class="inline-edit-input" id="edit-statement-category-' + index + '" style="width: 100%;">' +
        categoryOptions +
        '</select>' +
        '</td>' +
        '<td>' +
        '<input type="text" class="inline-edit-input" id="edit-statement-description-' + index + '" value="' + item.description + '" style="width: 100%;">' +
        '</td>' +
        '<td class="text-center">' +
        '<input type="number" class="inline-edit-input" id="edit-statement-quantity-' + index + '" value="' + item.quantity + '" step="0.1" min="0.1" style="width: 80px;">' +
        '</td>' +
        '<td class="text-right">' +
        '<input type="number" class="inline-edit-input" id="edit-statement-price-' + index + '" value="' + item.unitPrice + '" step="0.01" min="0" style="width: 100px;">' +
        '</td>' +
        '<td class="text-right" style="font-weight: 600;">£' + item.lineTotal.toFixed(2) + '</td>' +
        '<td class="text-center">' +
        '<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">' +
        '<button class="btn-action btn-save" onclick="saveStatementEdit(' + index + ')" title="Save">Save</button>' +
        '<button class="btn-action btn-cancel" onclick="cancelStatementEdit()" title="Cancel">Cancel</button>' +
        '</div>' +
        '</td>';

    document.getElementById('edit-statement-quantity-' + index).addEventListener('input', function() {
        updateStatementEditTotal(index);
    });
    document.getElementById('edit-statement-price-' + index).addEventListener('input', function() {
        updateStatementEditTotal(index);
    });
}

function updateStatementEditTotal(index) {
    var quantity = parseFloat(document.getElementById('edit-statement-quantity-' + index).value) || 0;
    var price = parseFloat(document.getElementById('edit-statement-price-' + index).value) || 0;
    var total = quantity * price;

    var allRows = document.getElementById('statementItemsBody').rows;
    for (var ri = 0; ri < allRows.length; ri++) {
        if (allRows[ri].getAttribute('data-item-index') == index) {
            allRows[ri].cells[4].textContent = '£' + total.toFixed(2);
            break;
        }
    }
}

function saveStatementEdit(index) {
    var category = document.getElementById('edit-statement-category-' + index).value;
    var description = document.getElementById('edit-statement-description-' + index).value;
    var quantity = parseFloat(document.getElementById('edit-statement-quantity-' + index).value);
    var unitPrice = parseFloat(document.getElementById('edit-statement-price-' + index).value);

    if (!description || !unitPrice || !quantity) {
        alert('Please fill in all fields');
        return;
    }

    var lineTotal = unitPrice * quantity;

    statementItems[index] = {
        category: category,
        description: description,
        quantity: quantity,
        unit: statementItems[index].unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    };

    editingStatementIndex = -1;
    updateStatementTable();
}

function cancelStatementEdit() {
    editingStatementIndex = -1;
    updateStatementTable();
}

function removeStatementItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        statementItems.splice(index, 1);
        editingStatementIndex = -1;
        updateStatementTable();
        if (statementSections.length > 0) { renderStatementSections(); }
    }
}

function moveStatementItem(index, direction) {
    if (editingStatementIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }

    if (direction === 'up' && index > 0) {
        var temp = statementItems[index];
        statementItems[index] = statementItems[index - 1];
        statementItems[index - 1] = temp;
    } else if (direction === 'down' && index < statementItems.length - 1) {
        var temp = statementItems[index];
        statementItems[index] = statementItems[index + 1];
        statementItems[index + 1] = temp;
    }
    updateStatementTable();
}

function repositionStatementItem(index) {
    if (editingStatementIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }

    var newPosition = prompt('Enter new position (1 to ' + statementItems.length + '):', (index + 1));
    if (newPosition === null) return;

    newPosition = parseInt(newPosition);
    if (isNaN(newPosition) || newPosition < 1 || newPosition > statementItems.length) {
        alert('Invalid position. Please enter a number between 1 and ' + statementItems.length);
        return;
    }

    var item = statementItems.splice(index, 1)[0];
    statementItems.splice(newPosition - 1, 0, item);
    updateStatementTable();
}

// Helper function to sort items by category order
function sortStatementItemsByCategory(itemsArray) {
    return itemsArray.slice().sort(function(a, b) {
        var indexA = statementCategoryOrder.indexOf(a.category);
        var indexB = statementCategoryOrder.indexOf(b.category);

        // Custom categories go after all standard ones
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;

        return indexA - indexB;
    });
}

// Helper function to group items by category
function groupStatementItemsByCategory(itemsArray) {
    var grouped = {};
    itemsArray.forEach(function(item) {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    return grouped;
}

function renderStatementItemRowHtml(item, i) {
    var html = '<tr data-item-index="' + i + '">';
    html += '<td>' + item.category + '</td>';
    html += '<td>' + item.description + '</td>';
    html += '<td class="text-center">' + item.quantity + '</td>';
    html += '<td class="text-right">£' + item.unitPrice.toFixed(2) + '</td>';
    html += '<td class="text-right" style="font-weight: 600;">£' + item.lineTotal.toFixed(2) + '</td>';
    html += '<td class="text-center">';
    html += '<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">';
    html += '<button class="btn-action btn-edit" onclick="editStatementItem(' + i + ')" title="Edit">Edit</button>';
    html += '<button class="btn-action btn-move" onclick="moveStatementItem(' + i + ', \'up\')" title="Move Up" ' + (i === 0 ? 'disabled' : '') + '>↑</button>';
    html += '<button class="btn-action btn-move" onclick="moveStatementItem(' + i + ', \'down\')" title="Move Down" ' + (i === statementItems.length - 1 ? 'disabled' : '') + '>↓</button>';
    html += '<button class="btn-action btn-reposition" onclick="repositionStatementItem(' + i + ')" title="Move to Position">#</button>';
    html += '<button class="btn-action btn-delete" onclick="removeStatementItem(' + i + ')" title="Delete">Del</button>';
    html += '</div>';
    html += '</td>';
    html += '</tr>';
    return html;
}

function updateStatementTable() {
    var tbody = document.getElementById('statementItemsBody');
    var itemsSection = document.getElementById('statementItemsSection');
    var generateSection = document.getElementById('generateStatementSection');

    if (statementItems.length === 0) {
        itemsSection.style.display = 'none';
        generateSection.style.display = 'none';
        return;
    }

    itemsSection.style.display = 'block';
    generateSection.style.display = 'block';

    var html = '';

    if (statementSections.length > 0) {
        // Unsectioned items first (no header)
        for (var u = 0; u < statementItems.length; u++) {
            if (!statementItems[u].section) {
                html += renderStatementItemRowHtml(statementItems[u], u);
            }
        }
        // Sectioned items grouped under bold headers
        for (var s = 0; s < statementSections.length; s++) {
            var sectionName = statementSections[s];
            var hasAny = false;
            for (var si = 0; si < statementItems.length; si++) {
                if (statementItems[si].section === sectionName) { hasAny = true; break; }
            }
            if (hasAny) {
                html += '<tr style="background: #f0e8cc;"><td colspan="6" style="padding: 10px 12px; font-weight: bold; color: #5a4200; border-bottom: 2px solid #d4af37; font-size: 14px;">' + sectionName + '</td></tr>';
                for (var sj = 0; sj < statementItems.length; sj++) {
                    if (statementItems[sj].section === sectionName) {
                        html += renderStatementItemRowHtml(statementItems[sj], sj);
                    }
                }
            }
        }
    } else {
        // No sections — flat list
        for (var i = 0; i < statementItems.length; i++) {
            html += renderStatementItemRowHtml(statementItems[i], i);
        }
    }

    var subtotal = 0;
    for (var j = 0; j < statementItems.length; j++) {
        subtotal += statementItems[j].lineTotal;
    }

    var removeVat = document.getElementById('statementRemoveVat').checked;
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

function closeStatementPreview() {
    document.getElementById('statementPreviewModal').style.display = 'none';
}

// ── Import from Estimate / Invoice ────────────────────────────────────────────

function processStatementImportFile(file) {
    var name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) {
        var reader = new FileReader();
        reader.onload = function(e) { parsePdfForStatement(e.target.result); };
        reader.readAsArrayBuffer(file);
    } else if (name.endsWith('.json')) {
        var reader = new FileReader();
        reader.onload = function(e) { importStatementJson(e.target.result); };
        reader.readAsText(file);
    } else {
        alert('Please attach a PDF generated by this tool, or a .json export file.');
    }
}

// ── JSON import (unchanged from previous version) ─────────────────────────────

function importStatementJson(text) {
    try {
        var data = JSON.parse(text);
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            alert('No items found in this export file.');
            return;
        }
        if (data.sections && Array.isArray(data.sections)) {
            for (var i = 0; i < data.sections.length; i++) {
                if (statementSections.indexOf(data.sections[i]) === -1) {
                    statementSections.push(data.sections[i]);
                }
            }
            renderStatementSections();
        }
        for (var j = 0; j < data.items.length; j++) { statementItems.push(data.items[j]); }
        updateStatementTable();
        var label = data.number ? (data.source || 'file') + ' #' + data.number : (data.source || 'file');
        alert(data.items.length + ' item(s) imported from ' + label + '.');
    } catch (err) {
        alert('Could not read the file. Please make sure it is a valid export file.');
    }
}

// ── PDF import ─────────────────────────────────────────────────────────────────

function parsePdfForStatement(arrayBuffer) {
    if (typeof pdfjsLib === 'undefined') {
        alert('PDF parser is not available. Please check your internet connection and reload the page.');
        return;
    }
    pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function(pdf) {
        var pagePromises = [];
        for (var p = 1; p <= pdf.numPages; p++) {
            pagePromises.push(pdf.getPage(p).then(function(page) {
                return page.getTextContent();
            }));
        }
        return Promise.all(pagePromises);
    }).then(function(pageContents) {
        var allItems = [];
        for (var pi = 0; pi < pageContents.length; pi++) {
            var tc = pageContents[pi];
            var pageOffset = pi * 10000; // hoisted: same for every item on this page
            for (var ii = 0; ii < tc.items.length; ii++) {
                var raw = tc.items[ii];
                if (!raw.str || !raw.str.trim() || !raw.transform) continue;
                // Clone and apply a page-index y-offset so items from different
                // pages never share the same y-coordinate. Without this, page 1
                // y=400 and page 2 y=400 get merged into the same "line",
                // scrambling categories and items.
                // Subtracting pi*10000 keeps pages in reading order when sorted
                // descending (page 1 items have larger y → appear first).
                var item = { str: raw.str, fontName: raw.fontName,
                             transform: raw.transform.slice() };
                item.transform[5] -= pageOffset;
                allItems.push(item);
            }
        }
        var parsed = parseTbPdfItems(allItems);
        applyParsedDataToStatement(parsed);
    }).catch(function(err) {
        alert('Could not read the PDF. Please make sure it was generated by this tool.');
        console.error('PDF parse error:', err);
    });
}

// Group PDF.js text items into lines: sorted top→bottom, left→right
function groupPdfItemsIntoLines(items) {
    var sorted = items.slice().sort(function(a, b) {
        var ay = a.transform[5], by = b.transform[5];
        var ax = a.transform[4], bx = b.transform[4];
        if (Math.abs(ay - by) > 5) return by - ay;
        return ax - bx;
    });
    var lines = [];
    var curItems = [];
    var curY = null;
    for (var i = 0; i < sorted.length; i++) {
        var y = sorted[i].transform[5];
        if (curY === null || Math.abs(y - curY) > 5) {
            if (curItems.length) lines.push(curItems);
            curItems = [sorted[i]];
            curY = y;
        } else {
            curItems.push(sorted[i]);
        }
    }
    if (curItems.length) lines.push(curItems);
    return lines;
}

// Normalise a category string to survive PDF.js text-run splitting.
// Chromium (PDFShift) sometimes breaks "Skimming /Painting" into two runs
// ["Skimming /", "Painting"], which when re-joined with a space produces
// "Skimming / Painting" — an extra space that breaks exact matching.
// Similarly "&" may be split off or emitted as "&amp;".
// Normalising both sides of the comparison absorbs these artifacts.
function normalizeCategoryText(s) {
    return s.replace(/&amp;/g, '&')      // HTML entity → literal ampersand
             .replace(/\u00a0/g, ' ')    // non-breaking space → regular space
             .replace(/\s*\/\s*/g, '/')  // "Skimming / Painting" → "Skimming/Painting"
             .replace(/\s*&\s*/g, ' & ') // normalise spacing around ampersand
             .replace(/\s+/g, ' ')       // collapse remaining whitespace
             .trim();
}

// Returns the canonical category name from statementCategoryOrder whose
// normalised form matches normalizeCategoryText(lineText), or null if none.
function findMatchingCategory(lineText) {
    var norm = normalizeCategoryText(lineText);
    for (var i = 0; i < statementCategoryOrder.length; i++) {
        if (normalizeCategoryText(statementCategoryOrder[i]) === norm) {
            return statementCategoryOrder[i];
        }
    }
    return null;
}

function parseTbPdfItems(allItems) {
    var result = {
        clientName: '', clientPhone: '', clientEmail: '',
        projectAddress: '', projectPostcode: '',
        items: [], sections: []
    };

    // ── 1. Client info: label→value pair extraction ────────────────────────
    // The info-section is a two-column flex layout so items from both columns
    // share the same y-coordinate. Find each known label item then collect the
    // value items immediately to its right before the next label is reached.

    var sortedAll = allItems.slice().sort(function(a, b) {
        var ay = a.transform[5], by = b.transform[5];
        var ax = a.transform[4], bx = b.transform[4];
        if (Math.abs(ay - by) > 5) return by - ay;
        return ax - bx;
    });

    var infoLabels = {
        'Name:':     'clientName',
        'Address:':  'projectAddress',
        'Postcode:': 'projectPostcode',
        'Phone:':    'clientPhone',
        'Email:':    'clientEmail'
    };

    for (var i = 0; i < sortedAll.length; i++) {
        var itemStr = sortedAll[i].str.trim();
        if (!itemStr) continue;

        // Case A: label + value in one text run e.g. "Name: John Smith"
        var foundLbl = null, foundInlineVal = '';
        for (var lbl in infoLabels) {
            if (itemStr.indexOf(lbl) === 0) {
                foundLbl = lbl;
                foundInlineVal = itemStr.substring(lbl.length).trim();
                break;
            }
        }
        if (foundLbl && foundInlineVal && foundInlineVal !== 'N/A') {
            // Got label + value inline — store and move on
            result[infoLabels[foundLbl]] = foundInlineVal;
            continue;
        }
        // foundLbl matched but value was empty: the label is a standalone text
        // run — fall through to Case B to pick up the value from the next item

        // Case B: standalone label — value items follow to its right on same line
        if (!itemStr.endsWith(':')) continue;
        if (!infoLabels.hasOwnProperty(itemStr)) continue;

        var lblX = sortedAll[i].transform[4];
        var lblY = sortedAll[i].transform[5];
        var valueParts = [];

        for (var j = i + 1; j < sortedAll.length; j++) {
            var vItem = sortedAll[j];
            if (Math.abs(vItem.transform[5] - lblY) > 5) break; // moved to next line
            if (vItem.transform[4] <= lblX) continue;           // to the left, skip
            var vStr = vItem.str.trim();
            if (!vStr) continue;
            if (vStr.endsWith(':')) break;                       // hit the next label
            if (vStr !== 'N/A') valueParts.push(vStr);
        }

        if (valueParts.length > 0) {
            result[infoLabels[itemStr]] = valueParts.join(' ').replace(/\s+/g, ' ').trim();
        }
    }

    // ── 2. Table items: line-based extraction ──────────────────────────────
    // Each table row shares a y-coordinate so grouping by y is correct.
    // Join items with spaces so the item regex works: without this, adjacent
    // text items concatenate as "Door installation2£150.00" and the regex fails.
    //
    // Section/category detection uses font weight: both section rows and category
    // rows are rendered bold (font-weight:bold via inline style / .category-row).
    // Wrapped description continuations are NOT bold. Checking fontName for
    // "Bold" lets us skip continuations and avoid creating phantom sections.

    var lines = groupPdfItemsIntoLines(sortedAll); // reuse already-sorted array
    var inTable = false;
    var currentCategory = '';
    var currentSection = '';

    for (var li = 0; li < lines.length; li++) {
        var lineText = lines[li].map(function(it) { return it.str; }).join(' ').replace(/\s+/g, ' ').trim();
        if (!lineText) continue;

        // Table header row
        if (/Description\s+Qty\s+Unit price\s+Total price/i.test(lineText)) {
            inTable = true;
            continue;
        }

        if (!inTable) continue;

        // Stop at totals / notes
        if (/^(Subtotal|VAT\b|Total\b|Notes?:|Payment Terms|Statement includes)/i.test(lineText)) {
            inTable = false;
            continue;
        }

        // Item row: "description  qty  £unitPrice  £lineTotal"
        var itemM = lineText.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+£([\d,]+\.\d{2})\s+£([\d,]+\.\d{2})$/);
        if (itemM) {
            result.items.push({
                category:  currentCategory || 'Materials',
                description: itemM[1].trim(),
                quantity:  parseFloat(itemM[2]),
                unit:      'job',
                unitPrice: parseFloat(itemM[3].replace(/,/g, '')),
                lineTotal: parseFloat(itemM[4].replace(/,/g, '')),
                section:   currentSection
            });
            continue;
        }

        // Spanning row (no £): category sub-header or section header.
        if (lineText.indexOf('£') === -1) {
            // Known category names are matched by exact string — font-independent.
            // This must come first: if the bold-font check ran first and the
            // PDF engine embedded bold fonts under names without "Bold", category
            // rows would be silently skipped and all items would inherit the
            // wrong (or default "Materials") category.
            var matchedCategory = findMatchingCategory(lineText);
            if (matchedCategory !== null) {
                currentCategory = matchedCategory;
                continue;
            }

            // For everything else, use bold font to tell section headers apart
            // from wrapped description continuations (which are not bold).
            var lineBold = false;
            for (var k = 0; k < lines[li].length; k++) {
                if (lines[li][k].fontName && /Bold/i.test(lines[li][k].fontName)) {
                    lineBold = true;
                    break;
                }
            }
            if (!lineBold) continue; // description continuation — skip

            // Bold, non-category text → user-defined section header
            if (lineText.length > 0 && lineText.length < 80) {
                currentSection = lineText;
                currentCategory = '';
                if (result.sections.indexOf(lineText) === -1) {
                    result.sections.push(lineText);
                }
            }
        }
    }

    return result;
}

function applyParsedDataToStatement(parsed) {
    if (parsed.clientName) {
        document.getElementById('statementClientName').value = parsed.clientName;
        // Trigger customer ID auto-generation
        document.getElementById('statementClientName').dispatchEvent(new Event('input'));
    }
    if (parsed.clientPhone)    document.getElementById('statementClientPhone').value = parsed.clientPhone;
    if (parsed.clientEmail)    document.getElementById('statementClientEmail').value = parsed.clientEmail;
    if (parsed.projectAddress) document.getElementById('statementProjectAddress').value = parsed.projectAddress;
    if (parsed.projectPostcode) document.getElementById('statementProjectPostcode').value = parsed.projectPostcode;

    for (var si = 0; si < parsed.sections.length; si++) {
        if (statementSections.indexOf(parsed.sections[si]) === -1) {
            statementSections.push(parsed.sections[si]);
        }
    }
    if (parsed.sections.length > 0) renderStatementSections();

    for (var ii = 0; ii < parsed.items.length; ii++) {
        statementItems.push(parsed.items[ii]);
    }
    updateStatementTable();

    var msg = parsed.items.length + ' item(s) imported from PDF.';
    if (parsed.clientName) msg += '\nClient info has been filled in.';
    alert(msg);
}

// ── Wire up drag-and-drop and click-to-browse ──────────────────────────────────
(function() {
    var zone = document.getElementById('statementImportZone');
    var fileInput = document.getElementById('statementImportFile');
    if (!zone || !fileInput) return;

    zone.addEventListener('dragover', function(e) {
        e.preventDefault();
        zone.classList.add('import-zone-over');
    });
    zone.addEventListener('dragleave', function() {
        zone.classList.remove('import-zone-over');
    });
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        zone.classList.remove('import-zone-over');
        if (e.dataTransfer.files.length > 0) {
            processStatementImportFile(e.dataTransfer.files[0]);
        }
    });
    zone.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            processStatementImportFile(fileInput.files[0]);
            fileInput.value = '';
        }
    });
}());
