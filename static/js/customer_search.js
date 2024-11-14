// Global değişkenler
let customers = [];
let filteredCustomers = [];
const sortState = { column: null, direction: 'asc' };

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async function() {
    await loadCustomers();
    setupEventListeners();
});

// Müşterileri yükle
async function loadCustomers() {
    try {
        const response = await fetch('/api/customer-search/');
        if (!response.ok) {
            throw new Error('Veri yüklenemedi');
        }

        const data = await response.json();
        customers = data.result || [];
        filteredCustomers = [...customers];

        updateCustomersTable();
        updateTotalCount();

    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Event Listeners
function setupEventListeners() {
    // Filtreleme
    const filterInputs = ['customerCode', 'identityNum', 'name', 'surname', 'phone'];
    filterInputs.forEach(id => {
        document.getElementById(`filter-${id}`).addEventListener('input', filterCustomers);
    });

    // Filtreleri temizle
    document.getElementById('clear-filters').addEventListener('click', clearFilters);

    // Sıralama
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            handleSort(column);
        });
    });
}

// Filtreleme fonksiyonu
function filterCustomers() {
    const filters = {
        customerCode: document.getElementById('filter-customerCode').value.toLowerCase(),
        identityNum: document.getElementById('filter-identityNum').value.toLowerCase(),
        name: document.getElementById('filter-name').value.toLowerCase(),
        surname: document.getElementById('filter-surname').value.toLowerCase(),
        phone: document.getElementById('filter-phone').value.toLowerCase()
    };

    filteredCustomers = customers.filter(customer => {
        return (
            customer.CustomerCode.toLowerCase().includes(filters.customerCode) &&
            customer.IdentityNum.toLowerCase().includes(filters.identityNum) &&
            customer.Name.toLowerCase().includes(filters.name) &&
            customer.Surname.toLowerCase().includes(filters.surname) &&
            (customer.Phone?.toLowerCase().includes(filters.phone) ||
             customer.PhoneList?.some(phone => phone.toLowerCase().includes(filters.phone)))
        );
    });

    if (sortState.column) {
        handleSort(sortState.column, true);
    } else {
        updateCustomersTable();
    }
    updateTotalCount();
}

// Filtreleri temizle
function clearFilters() {
    document.querySelectorAll('[id^="filter-"]').forEach(input => {
        input.value = '';
    });
    filteredCustomers = [...customers];
    updateCustomersTable();
    updateTotalCount();
}

// Sıralama fonksiyonu
function handleSort(column, skipDirectionToggle = false) {
    if (!skipDirectionToggle) {
        sortState.direction = sortState.column === column && sortState.direction === 'asc' ? 'desc' : 'asc';
    }
    sortState.column = column;

    filteredCustomers.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return sortState.direction === 'asc' ? comparison : -comparison;
    });

    updateCustomersTable();
    updateSortIcons();
}

// Tabloyu güncelle
function updateCustomersTable() {
    const tbody = document.getElementById('customers-list');
    if (!tbody) return;

    if (filteredCustomers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    Müşteri bulunamadı
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredCustomers.map(customer => `
        <tr>
            <td>${customer.CustomerCode}</td>
            <td>${customer.IdentityNum}</td>
            <td>${customer.Name}</td>
            <td>${customer.Surname}</td>
            <td>${customer.FatherName}</td>
            <td>${customer.MotherName}</td>
            <td>
                <div class="dropdown d-inline-block">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                            type="button" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false">
                        ${customer.PhoneList?.length || 0} Numara
                    </button>
                    <div class="dropdown-menu py-0">
                        ${customer.PhoneList?.map(phone => phone.trim()).filter(phone => phone).map(phone => `
                            <a class="dropdown-item py-2" href="tel:${phone}">
                                <i class="fas fa-phone me-2"></i>${phone}
                            </a>
                        `).join('') || 'Telefon bulunamadı'}
                    </div>
                </div>
            </td>
            <td>
                <a href="/homepage/?customer=${customer.CustomerCode}" 
                   class="btn btn-sm btn-primary">
                    <i class="fas fa-eye me-1"></i>Detay
                </a>
            </td>
        </tr>
    `).join('');
}

// Toplam sayıyı güncelle
function updateTotalCount() {
    const badge = document.getElementById('total-customers');
    if (badge) {
        badge.textContent = `${filteredCustomers.length} Müşteri`;
    }
}

// Sıralama ikonlarını güncelle
function updateSortIcons() {
    document.querySelectorAll('.sortable').forEach(header => {
        const icon = header.querySelector('i') || document.createElement('i');
        icon.className = 'fas fa-sort ms-2';

        if (header.dataset.sort === sortState.column) {
            icon.className = `fas fa-sort-${sortState.direction === 'asc' ? 'up' : 'down'} ms-2`;
            header.classList.add('active');
        } else {
            header.classList.remove('active');
        }

        if (!header.querySelector('i')) {
            header.appendChild(icon);
        }
    });
}

// Alert göster
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alert.style.zIndex = '1050';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}