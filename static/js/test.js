// constants.js bölümü
const COMMUNICATION_TYPES = {
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

// utils.js bölümü
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

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showAlert("Metin kopyalandı!", "success"))
        .catch(() => showAlert("Kopyalama işlemi başarısız oldu", "danger"));
}

// Veri yapıları ve durum yönetimi
let originalData = {
    phones: [],
    notes: [],
    installments: [],
    addresses: [],
    attributes: []
};

let currentData = {
    phones: [],
    notes: [],
    installments: [],
    addresses: [],
    attributes: []
};

const sortState = {
    phones: { column: null, direction: 'asc' },
    installments: { column: null, direction: 'asc' },
    notes: { column: null, direction: 'asc' },
    addresses: { column: null, direction: 'asc' },
    attributes: { column: null, direction: 'asc' }
};

let isSearching = false;

// API işlemleri
async function searchCustomer(event) {
    event?.preventDefault();

    if (isSearching) {
        showAlert("Önceki arama devam ediyor, lütfen bekleyin...", "warning");
        return;
    }

    const searchInput = document.getElementById('search-input');
    const searchButton = document.querySelector('.search-btn');

    if (!searchInput?.value.trim()) {
        showAlert("Lütfen bir müşteri kodu girin", "danger");
        return;
    }

    try {
        isSearching = true;
        searchButton.disabled = true;
        searchButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Aranıyor...';

        showLoadingState();

        const response = await fetch(`/api/customer-detail/${searchInput.value.trim()}/`);

        if (!response.ok) {
            throw new Error('Müşteri bulunamadı veya bir hata oluştu');
        }

        const data = await response.json();

        if (!data.customer_details?.length) {
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

async function savePhone() {
    const saveButton = document.querySelector('#addPhoneModal .btn-primary');
    const originalButtonText = saveButton.innerHTML;

    try {
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Kaydediliyor...';

        const phoneType = document.getElementById('phone_type').value;
        const phoneNumber = document.getElementById('phone_number').value;

        if (!phoneType || !phoneNumber) {
            throw new Error("Lütfen tüm alanları doldurunuz");
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            throw new Error("Telefon numarası 10 haneli olmalıdır");
        }

        const requestData = {
            CustomerCode: currentCustomerCode,
            CommunicationTypeCode: phoneType,
            CommAddress: phoneNumber,
            username: currentUsername
        };

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

        const modal = bootstrap.Modal.getInstance(document.getElementById('addPhoneModal'));
        modal.hide();

        currentData.phones.push({
            CommunicationTypeDescription: COMMUNICATION_TYPES[phoneType],
            Phone: phoneNumber,
            CommunicationTypeCode: phoneType
        });
        updatePhonesList(currentData.phones);

        showAlert("Telefon numarası başarıyla eklendi", "success");
        document.getElementById('addPhoneForm').reset();

    } catch (error) {
        showAlert(error.message, "danger");
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonText;
    }
}

async function loadAttributes(attributeTypeCode) {
    try {
        const response = await fetch(`/api/get_customer_attributes_list/${attributeTypeCode}`);
        const attributes = await response.json();

        const attributesList = document.getElementById('attributes-list');
        attributesList.innerHTML = attributes.map(attribute => `
            <tr>
                <td><span class="badge bg-primary">${attribute.AttributeTypeDescription}</span></td>
                <td>
                    <select class="form-select form-select-sm description-dropdown" 
                            onchange="postAttributeChange('${attribute.AttributeCode}', 
                            '${attribute.AttributeTypeCode}', this.value)">
                        <option value="">Seçiniz</option>
                        <option value="${attribute.AttributeDescription}">
                            ${attribute.AttributeDescription}
                        </option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary" 
                            onclick="copyToClipboard('${attribute.AttributeDescription}')">
                        <i class="fas fa-copy"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Özellikler yüklenirken hata oluştu:", error);
        showAlert("Özellikler yüklenirken hata oluştu", "danger");
    }
}

// Filtreleme fonksiyonları
function filterPhones() {
    const searchText = document.getElementById('phone-filter').value.toLowerCase();
    const typeFilter = document.getElementById('phone-type-filter').value.toLowerCase();

    currentData.phones = originalData.phones.filter(phone => {
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

    currentData.notes = originalData.notes.filter(note => {
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

    currentData.installments = originalData.installments.filter(installment => {
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

function updateList(type, data) {
    switch(type) {
        case 'phones':
            updatePhonesList(data);
            break;
        case 'notes':
            updateNotesList(data);
            break;
        case 'installments':
            updateInstallmentsList(data);
            break;
        case 'addresses':
            updateAddressesList(data);
            break;
        case 'attributes':
            updateAttributesList(data);
            break;
    }
}

// Sıralama fonksiyonları
function sortData(type, column, direction) {
    const data = [...currentData[type]];

    data.sort((a, b) => {
        let aVal, bVal;

        switch(type) {
            case 'phones':
                aVal = column === 'type' ? a.CommunicationTypeDescription : a.Phone;
                bVal = column === 'type' ? b.CommunicationTypeDescription : b.Phone;
                break;

            case 'installments':
                if (column === 'date') {
                    aVal = new Date(parseInt(a.OperationDate.replace(/[^0-9]/g, '')));
                    bVal = new Date(parseInt(b.OperationDate.replace(/[^0-9]/g, '')));
                } else if (column === 'amount') {
                    aVal = parseFloat(a.Payment.replace(/[^0-9.-]/g, ''));
                    bVal = parseFloat(b.Payment.replace(/[^0-9.-]/g, ''));
                } else {
                    aVal = a.PaymentTypeDescription;
                    bVal = b.PaymentTypeDescription;
                }
                break;

            case 'notes':
                if (column === 'date') {
                    aVal = new Date(parseInt(a.DateNote1.replace(/[^0-9]/g, '')));
                    bVal = new Date(parseInt(b.DateNote1.replace(/[^0-9]/g, '')));
                } else {
                    aVal = column === 'type' ? a.AlertTypeNote1 : a.DescriptionNote1;
                    bVal = column === 'type' ? b.AlertTypeNote1 : b.DescriptionNote1;
                }
                break;

            case 'addresses':
                aVal = column === 'type' ? a.AdressType : a.Adress;
                bVal = column === 'type' ? b.AdressType : b.Adress;
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
                    default:
                        aVal = a[column];
                        bVal = b[column];
                }
                break;

            default:
                aVal = a[column];
                bVal = b[column];
        }

        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return direction === 'asc' ? comparison : -comparison;
    });

    updateList(type, data);
    return data;
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
    originalData = {
        phones: data.customer_phones || [],
        notes: data.customer_notes1 || [],
        installments: data.customer_installments || [],
        addresses: data.customer_addresses || [],
        attributes: data.customer_attributes || []
    };

    // Mevcut verileri güncelle
    currentData = {
        phones: [...originalData.phones],
        notes: [...originalData.notes],
        installments: [...originalData.installments],
        addresses: [...originalData.addresses],
        attributes: [...originalData.attributes]
    };

    // Telefon tiplerini filtre dropdown'ına ekle
    const phoneTypes = [...new Set(data.customer_phones.map(p => p.CommunicationTypeDescription))];
    const phoneTypeFilter = document.getElementById('phone-type-filter');
    if (phoneTypeFilter) {
        phoneTypeFilter.innerHTML = '<option value="">Tüm Tipler</option>' +
            phoneTypes.map(type => `<option value="${type}">${type}</option>`).join('');
    }

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

function sendCallToFirebase(phoneNumber) {
    console.log('Gönderilen kullanıcı:', currentUsername);  // Debug için

    if (!currentUsername) {
        console.error('Kullanıcı adı bulunamadı!');
        return;
    }

    // users/{username}/call_history yoluna yeni veri ekle
    const callHistoryRef = firebase.database().ref(`users/${currentUsername}/call`);

    // Yeni bir push ile benzersiz ID oluştur ve veriyi kaydet
    callHistoryRef.set({
        phone_number: phoneNumber,
    })
    .then(() => {
        console.log('Arama kaydı başarıyla eklendi');
    })
    .catch(error => {
        console.error('Firebase kayıt hatası:', error);
        showAlert('Arama kaydı oluşturulamadı', 'danger');
    });
}

// Telefon listesi güncellenirken kullanılan fonksiyonu güncelle
function updatePhonesList(phones) {
    const phonesList = document.getElementById('phones-list');
    if (!phonesList) return;

    phonesList.innerHTML = phones.map(phone => `
        <tr>
            <td>${phone.CommunicationTypeDescription}</td>
            <td>${phone.Phone}</td>
            <td>
                <button 
                    class="btn btn-sm btn-outline-primary"
                    onclick="sendCallToFirebase('${phone.Phone}')"
                >
                    <i class="fas fa-phone"></i>
                </button>
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
                <button class="btn btn-sm btn-outline-secondary" 
                        onclick="copyToClipboard('${attribute.AttributeDescription}')">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        </tr>
    `).join('');
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

// Event Listeners ve Sayfa Yükleme
document.addEventListener('DOMContentLoaded', function() {
    // Form submit event listener'ı ekle
    const searchForm = document.getElementById('customer-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', searchCustomer);
    }

    // Telefon ekleme form listener'ı
    const phoneForm = document.getElementById('addPhoneForm');
    if (phoneForm) {
        phoneForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePhone();
        });
    }

    // Telefon input mask
    const phoneInput = document.getElementById('phone_number');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            e.target.value = value;
        });
    }

    // Not kaydetme butonu listener'ı
    const saveNoteBtn = document.getElementById('save-note-btn');
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', async function() {
            const phoneNumber = document.getElementById('phone_number').value;
            const category = document.querySelector('input[name="category"]:checked');
            const noteDescription = document.getElementById('user-note').value;

            if (!category) {
                showAlert("Lütfen bir kategori seçin.", "warning");
                return;
            }

            const requestData = {
                CustomerCode: currentCustomerCode,
                UserWarningCode: category.value,
                CommAddress: phoneNumber,
                username: currentUsername,
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
                    showAlert("Not başarıyla kaydedildi!", "success");
                    bootstrap.Modal.getInstance(document.getElementById('searchModal')).hide();
                } else {
                    const errorData = await response.json();
                    showAlert(`Hata: ${errorData.error}`, "danger");
                }
            } catch (error) {
                console.error('API isteği başarısız oldu:', error);
                showAlert("Bir hata oluştu, lütfen tekrar deneyin.", "danger");
            }
        });
    }

    // Filtreleme event listener'ları
    document.getElementById('phone-filter')?.addEventListener('input', filterPhones);
    document.getElementById('phone-type-filter')?.addEventListener('change', filterPhones);
    document.getElementById('notes-filter')?.addEventListener('input', filterNotes);
    document.getElementById('notes-date-filter')?.addEventListener('change', filterNotes);
    document.getElementById('installment-type-filter')?.addEventListener('change', filterInstallments);
    document.getElementById('installment-date-filter')?.addEventListener('change', filterInstallments);

    // Sıralama için click event listener'ları
    document.querySelectorAll('th.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const column = this.dataset.sort;
            const type = this.closest('table').id.split('-')[0];
            handleSort(type, column);
        });
    });

    // URL'den müşteri kodu kontrolü
    const urlParams = new URLSearchParams(window.location.search);
    const customerCode = urlParams.get('customer');
    if (customerCode) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = customerCode;
            searchCustomer();
        }
    }
});

// CSRF token alma yardımcı fonksiyonu
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

// Loading States ve Temizleme Fonksiyonları
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

    // Tüm listelere loading durumunu ekle
    ['phones-list', 'notes-list', 'installments-list', 'addresses-list', 'attributes-list'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = loadingTemplate;
        }
    });

    // Müşteri detay alanlarını temizle
    const detailFields = [
        'customer-name', 'customer-surname', 'customer-identity',
        'customer-father', 'customer-mother', 'account-opening-date',
        'credit-limit', 'remaining-limit', 'account-status',
        'customer-job', 'bad-debt'
    ];

    detailFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = `
                <div class="placeholder-glow">
                    <span class="placeholder col-12"></span>
                </div>
            `;
        }
    });
}

function clearCustomerData() {
    // Veri yapılarını sıfırla
    currentData = {
        phones: [],
        notes: [],
        installments: [],
        addresses: [],
        attributes: []
    };

    originalData = {
        phones: [],
        notes: [],
        installments: [],
        addresses: [],
        attributes: []
    };

    // Tüm listeleri temizle
    updatePhonesList([]);
    updateNotesList([]);
    updateInstallmentsList([]);
    updateAddressesList([]);
    updateAttributesList([]);

    // Müşteri detay alanlarını temizle
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

    // Filtreleri sıfırla
    const filters = [
        'phone-filter', 'phone-type-filter',
        'notes-filter', 'notes-date-filter',
        'installment-type-filter', 'installment-date-filter',
        'addresses-filter', 'address-type-filter'
    ];

    filters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });

    // Sıralama durumunu sıfırla
    Object.keys(sortState).forEach(key => {
        sortState[key] = { column: null, direction: 'asc' };
    });

    // Sıralama ikonlarını sıfırla
    document.querySelectorAll('th.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
}

function setupFirebaseCallListener() {
    // call düğümünü dinle
    const callRef = firebase.database().ref(`users/${currentUsername}/call`);

    // value event'i ile değişiklikleri yakala
    callRef.on('value', (snapshot) => {
        const callData = snapshot.val();
        console.log('Yeni telefon numarası algılandı:', callData);

        if (callData && callData.phone_number) {
            openCallModal(callData);
        }
    });
}

function openCallModal(callData) {
    const modal = new bootstrap.Modal(document.getElementById('searchModal'));
    const phoneInput = document.getElementById('phone_number');

    if (phoneInput && callData.phone_number) {
        phoneInput.value = callData.phone_number;
    }

    modal.show();
}

function setupModalListeners() {
    // Kaydet butonuna listener ekle
    document.getElementById('save-note-btn').addEventListener('click', function() {
        clearCallData();
        bootstrap.Modal.getInstance(document.getElementById('searchModal')).hide();
    });

    // İptal/Kapat butonuna listener ekle
    document.querySelector('button[data-bs-dismiss="modal"]').addEventListener('click', function() {
        clearCallData();
    });

    // Modal kapatıldığında da temizlik yap
    document.getElementById('searchModal').addEventListener('hidden.bs.modal', function() {
        clearCallData();
    });
}

function clearCallData() {
    // call düğümünü temizle
    const callRef = firebase.database().ref(`users/${currentUsername}/call`);

    callRef.remove()
        .then(() => {
            console.log('Call verisi başarıyla silindi');
        })
        .catch((error) => {
            console.error('Call verisi silinirken hata:', error);
        });
}

// Modal yönetimi
function setupModals() {
    // Telefon ekleme modalı
    const addPhoneModal = document.getElementById('addPhoneModal');
    if (addPhoneModal) {
        addPhoneModal.addEventListener('hidden.bs.modal', function () {
            document.getElementById('addPhoneForm')?.reset();
            const saveButton = addPhoneModal.querySelector('.btn-primary');
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.innerHTML = 'Kaydet';
            }
        });
    }

    // Not ekleme modalı
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.addEventListener('hidden.bs.modal', function () {
            document.getElementById('user-note').value = '';
            document.querySelectorAll('input[name="category"]').forEach(radio => {
                radio.checked = false;
            });
        });
    }
}

// Error handling
function handleError(error, context = '') {
    console.error(`${context} Hata:`, error);

    let errorMessage = 'Bir hata oluştu';
    if (error.response) {
        // API'den gelen hata
        errorMessage = error.response.data?.message || 'Sunucu hatası oluştu';
    } else if (error.request) {
        // İstek yapılamadı
        errorMessage = 'Sunucuya ulaşılamıyor';
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    showAlert(errorMessage, 'danger');
}

// Validation fonksiyonları
function validatePhoneNumber(phone) {
    return {
        isValid: /^\d{10}$/.test(phone),
        message: phone.length !== 10 ? 'Telefon numarası 10 haneli olmalıdır' : ''
    };
}

function validateRequiredFields(fields) {
    const emptyFields = Object.entries(fields)
        .filter(([_, value]) => !value?.trim())
        .map(([key, _]) => key);

    return {
        isValid: emptyFields.length === 0,
        message: emptyFields.length > 0 ? `Lütfen ${emptyFields.join(', ')} alanlarını doldurunuz` : ''
    };
}

// Initialize
(function initialize() {
    // Sayfa yüklendiğinde çalışacak fonksiyonlar
    document.addEventListener('DOMContentLoaded', function() {
        // Modal'ları ayarla
        setupModals();

        // URL parametrelerini kontrol et
        checkUrlParameters();

        console.log('Firebase dinleyicisi başlatılıyor...');
        setupFirebaseCallListener();

        // Modal kapatma butonlarına event listener ekle
        setupModalListeners();
    });

    // URL parametrelerini kontrol et
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const customerCode = urlParams.get('customer');
        if (customerCode) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = customerCode;
                searchCustomer();
            }
        }
    }
})();

// Public API - Global scope'a açılan fonksiyonlar
window.searchCustomer = searchCustomer;
window.handleSort = handleSort;
window.copyToClipboard = copyToClipboard;
window.filterPhones = filterPhones;
window.filterNotes = filterNotes;
window.filterInstallments = filterInstallments;
window.savePhone = savePhone;
window.loadAttributes = loadAttributes;

// Stil tanımlamaları
const styles = `
    .sortable {
        cursor: pointer;
    }
    
    .sortable.active {
        background-color: rgba(0, 0, 0, 0.05);
    }
    
    .sortable i {
        margin-left: 5px;
    }
    
    .table-danger td {
        background-color: rgba(220, 53, 69, 0.1);
    }
    
    .placeholder-glow .placeholder {
        background-color: rgba(0, 0, 0, 0.1);
    }
    
    .spinner-border {
        width: 1.5rem;
        height: 1.5rem;
    }
`;

// Stilleri sayfaya ekle
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);