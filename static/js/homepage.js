// Global değişkenler
let originalPhones = [];
let originalNotes = [];
let originalInstallments = [];
let currentData = {
    phones: [],
    notes: [],
    installments: []
};

// Sıralama durumunu takip etmek için
const sortState = {
    phones: { column: null, direction: 'asc' },
    installments: { column: null, direction: 'asc' },
    notes: { column: null, direction: 'asc' }
};

// İstek durumunu takip etmek için
let isSearching = false;

// Arama fonksiyonu
async function searchCustomer(event) {
    event.preventDefault();

    if (isSearching) {
        console.log("Önceki arama devam ediyor, lütfen bekleyin...");
        return;
    }

    const searchInput = document.getElementById('search-input');
    const searchButton = document.querySelector('.search-btn');

    if (!searchInput || !searchInput.value.trim()) {
        showAlert("Lütfen bir müşteri kodu girin", "danger");
        return;
    }

    try {
        isSearching = true;
        searchButton.disabled = true;
        searchButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Aranıyor...';

        showLoadingState();

        const response = await fetch(`http://127.0.0.1:8000/api/customer-detail/${searchInput.value.trim()}/`);

        if (!response.ok) {
            throw new Error('Müşteri bulunamadı veya bir hata oluştu');
        }

        const data = await response.json();

        if (!data.customer_details || data.customer_details.length === 0) {
            throw new Error("Müşteri bilgileri bulunamadı");
        }

        updateUI(data);

    } catch (error) {
        showAlert(error.message, "danger");
        clearCustomerData();
    } finally {
        isSearching = false;
        searchButton.disabled = false;
        searchButton.innerHTML = 'Ara';
    }
}

function clearCustomerData() {
    // Müşteri verilerinin temizlenmesi için gereken kodlar
    currentData = {
        phones: [],
        notes: [],
        installments: []
    };

    updatePhonesList(currentData.phones);
    updateNotesList(currentData.notes);
    updateInstallmentsList(currentData.installments);

    const fields = [
        'customer-name', 'customer-surname', 'customer-identity',
        'customer-father', 'customer-mother', 'account-opening-date',
        'credit-limit', 'remaining-limit', 'account-status',
        'customer-job'
    ];

    fields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '---';
        }
    });
}

// Filtreleme Fonksiyonları
function filterPhones() {
    const searchText = document.getElementById('phone-filter').value.toLowerCase();
    const typeFilter = document.getElementById('phone-type-filter').value.toLowerCase();

    currentData.phones = originalPhones.filter(phone => {
        const matchSearch = phone.Phone.toLowerCase().includes(searchText) ||
                          phone.CommunicationTypeDescription.toLowerCase().includes(searchText);
        const matchType = !typeFilter || phone.CommunicationTypeDescription.toLowerCase().includes(typeFilter);
        return matchSearch && matchType;
    });

    if (sortState.phones.column) {
        sortData('phones', sortState.phones.column, sortState.phones.direction);
    } else {
        updatePhonesList(currentData.phones);
    }
}

function filterNotes() {
    const searchText = document.getElementById('notes-filter').value.toLowerCase();
    const dateFilter = document.getElementById('notes-date-filter').value;

    currentData.notes = originalNotes.filter(note => {
        const noteDate = new Date(parseInt(note.DateNote1.replace(/[^0-9]/g, '')));
        const formattedDate = noteDate.toISOString().split('T')[0];

        const matchSearch = note.DescriptionNote1.toLowerCase().includes(searchText) ||
                          note.AlertTypeNote1.toLowerCase().includes(searchText);
        const matchDate = !dateFilter || formattedDate === dateFilter;
        return matchSearch && matchDate;
    });

    if (sortState.notes.column) {
        sortData('notes', sortState.notes.column, sortState.notes.direction);
    } else {
        updateNotesList(currentData.notes);
    }
}

function filterInstallments() {
    const typeFilter = document.getElementById('installment-type-filter').value;
    const dateFilter = document.getElementById('installment-date-filter').value;

    currentData.installments = originalInstallments.filter(installment => {
        const installmentDate = new Date(parseInt(installment.OperationDate.replace(/[^0-9]/g, '')));
        const formattedMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`;

        const matchType = !typeFilter ||
            (typeFilter === 'gecikmiş' && installment.PaymentTypeDescription.includes('Gecikmiş')) ||
            (typeFilter === 'normal' && !installment.PaymentTypeDescription.includes('Gecikmiş'));
        const matchDate = !dateFilter || formattedMonth === dateFilter;
        return matchType && matchDate;
    });

    if (sortState.installments.column) {
        sortData('installments', sortState.installments.column, sortState.installments.direction);
    } else {
        updateInstallmentsList(currentData.installments);
    }
}

// Sıralama Fonksiyonları
function sortData(type, column, direction) {
    const data = [...currentData[type]];

    data.sort((a, b) => {
        let aVal, bVal;

        switch(type) {
            case 'phones':
                switch(column) {
                    case 'type':
                        aVal = a.CommunicationTypeDescription;
                        bVal = b.CommunicationTypeDescription;
                        break;
                    case 'phone':
                        aVal = a.Phone;
                        bVal = b.Phone;
                        break;
                }
                break;

            case 'installments':
                switch(column) {
                    case 'date':
                        aVal = new Date(parseInt(a.OperationDate.replace(/[^0-9]/g, '')));
                        bVal = new Date(parseInt(b.OperationDate.replace(/[^0-9]/g, '')));
                        break;
                    case 'description':
                        aVal = a.PaymentTypeDescription;
                        bVal = b.PaymentTypeDescription;
                        break;
                    case 'amount':
                        aVal = parseFloat(a.Payment.replace(/[^0-9.-]/g, ''));
                        bVal = parseFloat(b.Payment.replace(/[^0-9.-]/g, ''));
                        break;
                }
                break;

            case 'notes':
                switch(column) {
                    case 'date':
                        aVal = new Date(parseInt(a.DateNote1.replace(/[^0-9]/g, '')));
                        bVal = new Date(parseInt(b.DateNote1.replace(/[^0-9]/g, '')));
                        break;
                    case 'type':
                        aVal = a.AlertTypeNote1;
                        bVal = b.AlertTypeNote1;
                        break;
                    case 'description':
                        aVal = a.DescriptionNote1;
                        bVal = b.DescriptionNote1;
                        break;
                }
                break;
        }

        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return direction === 'asc' ? comparison : -comparison;
    });

    switch(type) {
        case 'phones':
            updatePhonesList(data);
            break;
        case 'installments':
            updateInstallmentsList(data);
            break;
        case 'notes':
            updateNotesList(data);
            break;
    }
}

function handleSort(type, column) {
    const currentState = sortState[type];
    const newDirection = currentState.column === column && currentState.direction === 'asc' ? 'desc' : 'asc';

    sortState[type] = { column, direction: newDirection };
    updateSortIcons(type, column, newDirection);
    sortData(type, column, newDirection);
}

// UI Güncelleme Fonksiyonları
function updateUI(data) {
    // Orijinal verileri sakla
    originalPhones = data.customer_phones;
    originalNotes = data.customer_notes1;
    originalInstallments = data.customer_installments;

    // Mevcut verileri güncelle
    currentData = {
        phones: [...data.customer_phones],
        notes: [...data.customer_notes1],
        installments: [...data.customer_installments]
    };

    // Telefon tiplerini filtre dropdown'ına ekle
    const phoneTypes = [...new Set(data.customer_phones.map(p => p.CommunicationTypeDescription))];
    const phoneTypeFilter = document.getElementById('phone-type-filter');
    phoneTypeFilter.innerHTML = '<option value="">Tüm Tipler</option>' +
        phoneTypes.map(type => `<option value="${type}">${type}</option>`).join('');

    updateCustomerDetails(data.customer_details[0]);
    updatePhonesList(currentData.phones);
    updateNotesList(currentData.notes);
    updateInstallmentsList(currentData.installments);
}

function updateCustomerDetails(details) {
    const fields = {
        'customer-name': details.Name,
        'customer-surname': details.Surname,
        'customer-identity': details.IdentityNum,
        'customer-father': details.FatherName,
        'customer-mother': details.MotherName,
        'account-opening-date': formatDate(details.AccountOpeningDate),
        'credit-limit': details.CreditLimit,
        'remaining-limit': details.RemainingLimit,
        'account-status': details.AccountStatus,
        'customer-job': details.Job
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || '---';
        }
    });
}

function updatePhonesList(phones) {
    const phonesList = document.getElementById('phones-list');
    if (!phonesList) return;

    phonesList.innerHTML = phones.map(phone => `
        <tr>
            <td>${phone.CommunicationTypeDescription}</td>
            <td>${phone.Phone}</td>
            <td>
                <a href="tel:${phone.Phone}" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-phone"></i>
                </a>
            </td>
        </tr>
    `).join('');
}

function updateNotesList(notes) {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;

    notesList.innerHTML = notes.map(note => `
        <tr>
            <td>${formatDate(note.DateNote1)}</td>
            <td><span class="badge bg-info">${note.AlertTypeNote1}</span></td>
            <td>${note.DescriptionNote1}</td>
            <td>${note.NoteTakerNote1}</td>
        </tr>
    `).join('');
}

function updateInstallmentsList(installments) {
    const installmentsList = document.getElementById('installments-list');
    if (!installmentsList) return;

    installmentsList.innerHTML = installments.map(installment => `
        <tr class="${installment.PaymentTypeDescription.includes('Gecikmiş') ? 'table-danger' : ''}">
            <td>${formatDate(installment.OperationDate)}</td>
            <td>${installment.PaymentTypeDescription}</td>
            <td class="text-end">${installment.Payment} TL</td>
        </tr>
    `).join('');
}

// Yardımcı Fonksiyonlar
function formatDate(dateString) {
    if (!dateString) return '---';
    return new Date(parseInt(dateString.replace(/[^0-9]/g, ''))).toLocaleDateString('tr-TR');
}

function showAlert(message, type = 'warning') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    const container = document.querySelector('.container-fluid');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function updateSortIcons(type, activeColumn, direction) {
    const table = document.getElementById(`${type}-table`);
    if (!table) return;

    const headers = table.querySelectorAll('th.sortable');
    headers.forEach(header => {
        const icon = header.querySelector('i');
        const column = header.dataset.sort;

        if (column === activeColumn) {
            icon.className = `fas fa-sort-${direction === 'asc' ? 'up' : 'down'}`;
            header.classList.add('active');
        } else {
            icon.className = 'fas fa-sort';
            header.classList.remove('active');
        }
    });
}

function showLoadingState() {
    const loadingTemplate = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
            </td>
        </tr>
    `;

    ['phones-list', 'notes-list', 'installments-list'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = loadingTemplate;
        }
    });

    const fields = [
        'customer-name', 'customer-surname', 'customer-identity',
        'customer-father', 'customer-mother', 'account-opening-date',
        'credit-limit', 'remaining-limit', 'account-status',
        'customer-job'
    ];

    fields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = 'Yükleniyor...';
        }
    });
}

// Sayfa yüklendiğinde URL parametresini kontrol et
document.addEventListener('DOMContentLoaded', function() {
    // URL'den customer parametresini al
    const urlParams = new URLSearchParams(window.location.search);
    const customerCode = urlParams.get('customer');

    if (customerCode) {
        // Search input'u doldur
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = customerCode;
        }

        // Arama formunu bul
        const searchForm = document.getElementById('customer-search-form');
        if (searchForm) {
            // Form submit eventini tetikle
            const submitEvent = new Event('submit', {
                bubbles: true,
                cancelable: true,
            });
            searchForm.dispatchEvent(submitEvent);
        }
    }

    // Event listener'ları ekle
    setupEventListeners();

    // İşlemi Onayla ve Notu Kaydet butonuna tıklama event listener
    document.getElementById('save-note-btn').addEventListener('click', async function () {
        // Kullanıcı tarafından girilen verileri al
        const phoneNumber = document.getElementById('phone_number').value;
        const category = document.querySelector('input[name="category"]:checked');
        const noteDescription = document.getElementById('user-note').value;

        if (!category) {
            alert("Lütfen bir kategori seçin.");
            return;
        }

        // POST isteği için veri yapısını hazırla
        const requestData = {
            CustomerCode: "ÖRNEK_MÜŞTERİ_KODU", // Bu değer uygun müşteri koduyla değiştirilmeli
            UserWarningCode: category.value,
            CommAddress: phoneNumber,
            username: currentUsername,  // currentUsername daha önce ayarlanmış olmalı
            Description: noteDescription,
            UserWarningDescription: category.dataset.description
        };

        try {
            const response = await fetch('/add-customer-note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                alert("Not başarıyla kaydedildi!");
                // Modali kapat veya gerekli işlemi yap
                $('#searchModal').modal('hide');
            } else {
                const errorData = await response.json();
                alert(`Hata: ${errorData.error}`);
            }
        } catch (error) {
            console.error('API isteği başarısız oldu:', error);
            alert("Bir hata oluştu, lütfen tekrar deneyin.");
        }
    });

    // Django CSRF tokenını almak için yardımcı fonksiyon
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

});

// Event listener'ları ayarla
function setupEventListeners() {
    // Sıralama için click event listeners
    document.querySelectorAll('th.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const column = this.dataset.sort;
            const type = this.closest('table').id.split('-')[0];
            handleSort(type, column);
        });
    });

    // Filtreleme için event listeners
    document.getElementById('phone-filter')?.addEventListener('input', filterPhones);
    document.getElementById('phone-type-filter')?.addEventListener('change', filterPhones);
    document.getElementById('notes-filter')?.addEventListener('input', filterNotes);
    document.getElementById('notes-date-filter')?.addEventListener('change', filterNotes);
    document.getElementById('installment-type-filter')?.addEventListener('change', filterInstallments);
    document.getElementById('installment-date-filter')?.addEventListener('change', filterInstallments);
}


function showCallHistoryModule(callHistory) {
  const module = document.getElementById('call-history-module');
  const content = document.getElementById('call-history-content');

  // Modülü göster
  module.classList.remove('d-none');

  // Arama geçmişi verilerini içeriğe ekle
  content.innerHTML = '';
  callHistory.forEach(call => {
    const callElement = document.createElement('div');
    callElement.textContent = `${call.caller} - ${call.duration}s`;
    content.appendChild(callElement);
  });
}


function showCustomerNotesModule(notes) {
  const module = document.getElementById('customer-notes-module');
  const list = document.getElementById('customer-notes-list');

  // Modülü göster
  module.classList.remove('d-none');

  // Notları listeye ekle
  list.innerHTML = '';
  notes.forEach(note => {
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item';
    listItem.textContent = `${note.type} - ${note.description}`;
    list.appendChild(listItem);
  });
}