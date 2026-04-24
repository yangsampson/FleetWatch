// --- Element References ---
const searchInput = document.getElementById('searchInput');
const filterOutInput = document.getElementById('filterOutInput');
const resultsList = document.getElementById('resultsList');
const loadingIndicator = document.getElementById('loading');
const selectAllBtn = document.getElementById('selectAllBtn');
const refreshDataBtn = document.getElementById('refreshDataBtn');
const statusIndicator = document.getElementById('selection-status');
const copySuccessIndicator = document.getElementById('copySuccess');
const checkboxIDMode = document.getElementById('checkboxIDMode');

let allData = [];
let selectedItems = new Set();
let dataToDisplay = [];

// --- Utility Functions ---
function showCopySuccess() {
    copySuccessIndicator.style.opacity = '1';
    setTimeout(() => { copySuccessIndicator.style.opacity = '0'; }, 1500);
}

function copyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) { console.error('Copy failed', err); }
    document.body.removeChild(textArea);
}

// --- Data Loading & Rendering ---
function handleRefreshData() {
    console.log("Initializing data load...");
    loadingIndicator.style.display = 'block';
    resultsList.innerHTML = '';
    
    try {
        // Validation: Check if the data file actually loaded
        if (typeof SAMPLE_API_DATA === 'undefined') {
            throw new Error("Cannot find SAMPLE_API_DATA. Make sure sample-data.js is loaded.");
        }

        const workers = SAMPLE_API_DATA.workers;
        allData = Object.values(workers).map(item => ({
            status: item.status || 'N/A',
            workerId: item.id || 'N/A',
            displayPhoneNumber: item.phoneNumber || 'N/A',
            companyAssigned: item.assignedCompany || 'N/A',
            serialNumber: item.serialNumber || 'N/A',
            imei: item.IMEI || 'N/A'
        }));

        console.log(`Successfully loaded ${allData.length} workers.`);
        loadingIndicator.style.display = 'none';
        performSearch(); // Render the data
    } catch (error) {
        console.error("Load Error:", error);
        loadingIndicator.style.display = 'none';
        resultsList.innerHTML = `<div style="color:red; text-align:center; padding:20px;">${error.message}</div>`;
    }
}

function performSearch() {
    const search = searchInput.value.toLowerCase().trim();
    const filter = filterOutInput.value.toLowerCase().trim();
    resultsList.innerHTML = '';

    dataToDisplay = allData.filter(item => {
        const hayStack = Object.values(item).join(' ').toLowerCase();
        const matchesSearch = search === '' || hayStack.includes(search);
        const matchesFilter = filter === '' || !hayStack.includes(filter);
        return matchesSearch && matchesFilter;
    });

    dataToDisplay.forEach(item => {
        const isSelected = selectedItems.has(item.workerId);
        const div = document.createElement('div');
        div.className = `result-item ${isSelected ? 'selected' : ''}`;
        
        const statusClass = `status-${item.status.toLowerCase()}`;
        
        if (checkboxIDMode.checked) {
            div.innerHTML = `
                <div class="checkbox-container"><input type="checkbox" ${isSelected ? 'checked' : ''}></div>
                <div class="data-content id-only-display">
                    <span class="data-value">${item.workerId}</span>
                    <span class="status-line ${statusClass}">${item.status}</span>
                </div>`;
        } else {
            div.innerHTML = `
                <div class="checkbox-container"><input type="checkbox" ${isSelected ? 'checked' : ''}></div>
                <div class="data-content">
                    <div class="status-line ${statusClass}">${item.status}</div>
                    <div class="data-grid">
                        <div class="grid-entry"><strong>ID:</strong> <span class="data-value">${item.workerId}</span></div>
                        <div class="grid-entry"><strong>Phone:</strong> <span class="data-value">${item.displayPhoneNumber}</span></div>
                        <div class="grid-entry"><strong>Co:</strong> <span class="data-value">${item.companyAssigned}</span></div>
                        <div class="grid-entry"><strong>SN:</strong> <span class="data-value">${item.serialNumber}</span></div>
                    </div>
                </div>`;
        }
        resultsList.appendChild(div);
    });

    statusIndicator.textContent = `${selectedItems.size} selected / ${allData.length} total`;
}

// --- Event Listeners ---
refreshDataBtn.addEventListener('click', handleRefreshData);
searchInput.addEventListener('input', performSearch);
filterOutInput.addEventListener('input', performSearch);
checkboxIDMode.addEventListener('change', performSearch);

selectAllBtn.addEventListener('click', () => {
    const allOnScreenSelected = dataToDisplay.every(i => selectedItems.has(i.workerId));
    dataToDisplay.forEach(i => {
        if (allOnScreenSelected) selectedItems.delete(i.workerId);
        else selectedItems.add(i.workerId);
    });
    performSearch();
});

resultsList.addEventListener('click', (e) => {
    const row = e.target.closest('.result-item');
    if (!row) return;

    if (e.target.classList.contains('data-value')) {
        copyToClipboard(e.target.textContent);
        return;
    }

    const cb = row.querySelector('input');
    cb.checked = !cb.checked;
    const id = row.querySelector('.data-value').textContent;
    
    if (cb.checked) selectedItems.add(id);
    else selectedItems.delete(id);
    
    row.classList.toggle('selected');
    statusIndicator.textContent = `${selectedItems.size} selected / ${allData.length} total`;
});

document.querySelectorAll('.multi-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const field = e.target.dataset.field;
        const selected = allData.filter(i => selectedItems.has(i.workerId));
        if (selected.length === 0) return;

        const output = selected.map(i => {
            if (field === 'all') return `${i.workerId}\t${i.displayPhoneNumber}\t${i.serialNumber}`;
            return i[field];
        }).join('\n');
        
        copyToClipboard(output);
    });
});

// Run on startup
document.addEventListener('DOMContentLoaded', handleRefreshData);
