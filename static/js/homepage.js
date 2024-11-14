// Global değişkenler
let originalPhones = [];
let originalNotes = [];
let originalInstallments = [];
let originalAddresses = [];
let originalAttributes = [];
let currentData = {
    phones: [],
    notes: [],
    installments: [],
    addresses: [],
    attributes: []
};

// Sıralama durumunu takip etmek için
const sortState = {
    phones: { column: null, direction: 'asc' },
    installments: { column: null, direction: 'asc' },
    notes: { column: null, direction: 'asc' },
    addresses: { column: null, direction: 'asc' },
    attributes: { column: null, direction: 'asc' },
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
        installments: [],
        addresses: [],
        attributes: [],
    };

    updatePhonesList(currentData.phones);
    updateNotesList(currentData.notes);
    updateInstallmentsList(currentData.installments);
    updateAddressesList(currentData.addresses);
    updateAttributesList(currentData.attributes);

    const fields = [
        'customer-name', 'customer-surname', 'customer-identity',
        'customer-father', 'customer-mother', 'account-opening-date',
        'credit-limit', 'remaining-limit', 'account-status',
        'customer-job', 'bad-debt'
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

// Adres filtreleme fonksiyonu
function filterAddresses() {
    const searchText = document.getElementById('addresses-filter').value.toLowerCase();
    const typeFilter = document.getElementById('address-type-filter').value.toLowerCase();

    currentData.addresses = originalAddresses.filter(address => {
        const matchSearch = address.Adress.toLowerCase().includes(searchText);
        const matchType = !typeFilter || address.AdressType.toLowerCase().includes(typeFilter);
        return matchSearch && matchType;
    });

    if (sortState.addresses.column) {
        sortData('addresses', sortState.addresses.column, sortState.addresses.direction);
    } else {
        updateAddressesList(currentData.addresses);
    }
}

function filterAttributes() {
    const searchText = document.getElementById('attributes-filter').value.toLowerCase();
    const dateFilter = document.getElementById('attributes-date-filter').value;

    currentData.attributes = originalAttributes.filter(attribute => {
        // Assuming we have a date field in a similar format, adjust if the date field differs.
        const attributeDate = new Date(parseInt(attribute.Date.replace(/[^0-9]/g, '')));
        const formattedDate = attributeDate.toISOString().split('T')[0];

        const matchSearch = attribute.AttributeDescription.toLowerCase().includes(searchText) ||
                            attribute.AttributeTypeDescription.toLowerCase().includes(searchText);
        const matchDate = !dateFilter || formattedDate === dateFilter;
        return matchSearch && matchDate;
    });

    if (sortState.attributes.column) {
        sortData('attributes', sortState.attributes.column, sortState.attributes.direction);
    } else {
        updateAttributesList(currentData.attributes);
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

            case 'addresses':
                switch(column) {
                    case 'type':
                        aVal = a.AdressType;
                        bVal = b.AdressType;
                        break;
                    case 'address':
                        aVal = a.Adress;
                        bVal = b.Adress;
                        break;
                }
                break;

            case 'attributes':
                switch(column) {
                    case 'type':
                        aVal = a.AttributeTypeDescription;
                        bVal = b.AttributeTypeDescription;
                        break;
                    case 'description':
                        aVal = a.AttributeDescription;
                        bVal = b.AttributeDescription;
                        break;
                    case 'code':
                        aVal = a.AttributeTypeCode;
                        bVal = b.AttributeTypeCode;
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
        case 'addresses':
            updateAddressesList(data);
            break;
        case 'attributes':
            updateAttributesList(data);
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
    originalAddresses = data.customer_addresses;
    originalAttributes = data.customer_attributes;

    // Mevcut verileri güncelle
    currentData = {
        phones: [...data.customer_phones],
        notes: [...data.customer_notes1],
        installments: [...data.customer_installments],
        addresses: [...data.customer_addresses],
        attributes: [...data.customer_attributes]
    };

    // Telefon tiplerini filtre dropdown'ına ekle
    const phoneTypes = [...new Set(data.customer_phones.map(p => p.CommunicationTypeDescription))];
    const phoneTypeFilter = document.getElementById('phone-type-filter');
    phoneTypeFilter.innerHTML = '<option value="">Tüm Tipler</option>' +
        phoneTypes.map(type => `<option value="${type}">${type}</option>`).join('');

    // Adres tiplerini filtre dropdown'ına ekle
    const addressTypes = [...new Set(data.customer_addresses.map(a => a.AdressType))];
    const addressTypeFilter = document.getElementById('address-type-filter');
    if (addressTypeFilter) {
        addressTypeFilter.innerHTML = '<option value="">Tüm Adresler</option>' +
            addressTypes.map(type => `<option value="${type}">${type}</option>`).join('');
    }

    updateCustomerDetails(data.customer_details[0]);
    updatePhonesList(currentData.phones);
    updateNotesList(currentData.notes);
    updateInstallmentsList(currentData.installments);
    updateAddressesList(currentData.addresses);
    updateAttributesList(currentData.attributes);
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
        'customer-job': details.Job,
        'bad-debt': details.BadDebt
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

// Başarılı işlem sonrası liste güncelleme fonksiyonu
function updatePhonesListAfterAdd(newPhone) {
    const phonesList = document.getElementById('phones-list');
    if (!phonesList) return;

    // Yeni telefonu listeye ekle
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${COMMUNICATION_TYPES[newPhone.CommunicationTypeCode]}</td>
        <td>${formatPhoneNumber(newPhone.CommAddress)}</td>
        <td>
            <a href="tel:${newPhone.CommAddress}" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-phone"></i>
            </a>
        </td>
    `;
    phonesList.insertBefore(newRow, phonesList.firstChild);
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

// Adres listesini güncelleme fonksiyonu
function updateAddressesList(addresses) {
    const addressesList = document.getElementById('addresses-list');
    if (!addressesList) return;

    addressesList.innerHTML = addresses.map(address => `
        <tr>
            <td><span class="badge bg-primary">${address.AdressType}</span></td>
            <td>${address.Adress}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" onclick="copyToClipboard('${address.Adress}')">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateAttributesList(attributes) {
    const attributesList = document.getElementById('attributes-list');
    if (!attributesList) return;

    attributesList.innerHTML = attributes.map(attribute => `
        <tr>
            <td><span class="badge bg-primary">${attribute.AttributeTypeDescription}</span></td>
            <td>${attribute.AttributeDescription}</td>
            <td>${attribute.AttributeTypeCode}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" onclick="copyToClipboard('${attribute.AttributeDescription}')">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        </tr>
    `).join('');
}


// Yardımcı Fonksiyonlar
function formatDate(dateString) {
    if (!dateString) return '---';
    return new Date(parseInt(dateString.replace(/[^0-9]/g, ''))).toLocaleDateString('tr-TR');
}

// Kopyalama fonksiyonu
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert("Adres kopyalandı!", "success");
    }).catch(err => {
        showAlert("Adres kopyalanırken bir hata oluştu", "danger");
    });
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
                    <span class="visually-hidden"></span>
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
        'customer-job', 'bad-debt'
    ];

    fields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '';
        }
    });
}

// Sayfa yüklendiğinde URL parametresini kontrol et
document.addEventListener('DOMContentLoaded', function() {
    addPhoneButton();
    // URL'den customer parametresini al
    const urlParams = new URLSearchParams(window.location.search);
    const customerCode = urlParams.get('customer');
    const phoneInput = document.getElementById('phone_number');
    const currentUsername = "{{ username }}";

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

    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            e.target.value = value;
        });
    }

    // Form submit olayını engelle
    const form = document.getElementById('addPhoneForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            savePhone();
        });
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
            CustomerCode: customerCode, // Bu değer uygun müşteri koduyla değiştirilmeli
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
    document.getElementById('addresses-filter')?.addEventListener('input', filterAddresses);
    document.getElementById('address-type-filter')?.addEventListener('change', filterAddresses);
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

// Telefon kaydetme fonksiyonu
async function savePhone() {
    const saveButton = document.querySelector('#addPhoneModal .btn-primary');
    const originalButtonText = saveButton.innerHTML;

    try {
        // Loading durumunu göster
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Kaydediliyor...';

        // Form verilerini al
        const phoneType = document.getElementById('phone_type').value;
        const phoneNumber = document.getElementById('phone_number').value;

        // Validasyonlar
        if (!phoneType || !phoneNumber) {
            throw new Error("Lütfen tüm alanları doldurunuz");
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            throw new Error("Telefon numarası 10 haneli olmalıdır");
        }

        // API isteği için data hazırla
        const requestData = {
            CustomerCode: currentCustomerCode, // Global değişken - Müşteri detay sayfasından alınacak
            CommunicationTypeCode: phoneType,
            CommAddress: phoneNumber,
            username: currentUsername
        };

        // API isteği
        const response = await fetch('/api/add-customer-phone/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || 'Telefon eklenirken bir hata oluştu');
        }

        // Başarılı işlem
        const modal = bootstrap.Modal.getInstance(document.getElementById('addPhoneModal'));
        modal.hide();

        // Telefon listesini güncelle
        if (!currentData.phones) currentData.phones = [];
        currentData.phones.push({
            CommunicationTypeDescription: getCommunicationTypeDescription(phoneType),
            Phone: phoneNumber,
            CommunicationTypeCode: phoneType
        });
        updatePhonesList(currentData.phones);

        showAlert("Telefon numarası başarıyla eklendi", "success");
        document.getElementById('addPhoneForm').reset();

    } catch (error) {
        console.error('Hata:', error);
        showAlert(error.message, "danger");
    } finally {
        // Loading durumunu kaldır
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonText;
    }
}

// İletişim tiplerinin açıklamalarını getir
function getCommunicationTypeDescription(code) {
    const types = {
        '001': 'Kendi Cep Telefonu',
        '002': 'Ulaşılmasını İstediği 2.Cep Numarası',
        '003': 'İş Telefonu',
        '004': 'Ev Telefonu',
        '010': 'Baba Telefonu',
        '011': 'Anne Telefonu',
        '012': 'Eşinin Telefonu',
        '013': 'Arkadaş Telefonu',
        '014': 'Kardeş (aile bireyi)',
        '016': 'Kızı',
        '017': 'Oğlu',
        '018': 'Yakın akrabası',
        '019': 'Tanıdığı',
        '022': 'Güncel Olabilecek Telefonu',
        '023': 'Yeni Güncel Telefonu Olabilir'
    };
    return types[code] || 'Bilinmeyen Tip';
}

// Başlık kısmına ekle butonunu ekle
function addPhoneButton() {
    const button = document.createElement('button');
    button.className = 'btn btn-primary btn-sm ms-2';
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#addPhoneModal');
    button.innerHTML = '<i class="fas fa-plus me-1"></i> Yeni Telefon';

    const headerActions = document.querySelector('.card-header .d-flex:first-child');
    if (headerActions) {
        headerActions.appendChild(button);
    }
}


// Telefon numarası format fonksiyonu
function formatPhoneNumber(number) {
    return number.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}

 // Dropdown'dan seçenekleri yükler
async function loadAttributes(attributeTypeCode) {
    try {
        const response = await fetch(`/api/get_customer_attributes_list/${attributeTypeCode}`);
        const attributes = await response.json();

        const attributesList = document.getElementById('attributes-list');
        attributesList.innerHTML = ''; // Clear the list

        attributes.forEach(attribute => {
            attributesList.innerHTML += `
                <tr>
                    <td><span class="badge bg-primary">${attribute.AttributeTypeDescription}</span></td>
                    <td>
                        <select class="form-select form-select-sm description-dropdown" onchange="postAttributeChange('${attribute.AttributeCode}', '${attribute.AttributeTypeCode}', this.value)">
                            <option value="">Seçiniz</option>
                            <option value="${attribute.AttributeDescription}">${attribute.AttributeDescription}</option>
                            <!-- Add more options here if available -->
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary" onclick="copyToClipboard('${attribute.AttributeDescription}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Özellikler yüklenirken hata oluştu:", error);
    }
}


// Dropdown değiştiğinde POST isteği gönderen fonksiyon
async function postAttributeChange(attributeCode, attributeTypeCode, selectedDescription) {
    if (!selectedDescription) return; // Boş seçimlerde işlem yapma

    const customerCode = searchInput.value.trim();
    if (!customerCode) {
        alert("Müşteri kodu giriniz.");
        return;
    }

    const data = {
        CustomerCode: customerCode,
        AttributeTypeCode: attributeTypeCode,
        AttributeCode: attributeCode,
        Description: selectedDescription,
        username: currentUsername
    };

    try {
        const response = await fetch('/api/add_customer_attribute/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            alert("Açıklama başarıyla kaydedildi!");
        } else {
            alert("Açıklama kaydedilemedi: " + result.error);
        }
    } catch (error) {
        console.error("Açıklama kaydedilirken hata oluştu:", error);
    }
}
