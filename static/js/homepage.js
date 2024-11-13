document.addEventListener('DOMContentLoaded', function () {
    // Input ve buton referansları
    const searchInput = document.querySelector('input[type="search"]');
    const searchButton = document.querySelector('button[type="submit"]');
    const loadingOverlay = document.getElementById('loading-overlay');

    const customerCodeInput = searchInput.value; // CustomerCode

    // Modal form referansları
    const addPhoneForm = document.getElementById('addPhoneForm');
    const communicationType = document.getElementById('communicationType');
    const phoneNumber = document.getElementById('phoneNumber');

    // Müşteri bilgileri alanları
    const customerLoading = document.getElementById('customer-loading');
    const customerInfo = document.getElementById('customer-info');

    // Telefon bilgileri alanları
    const phonesLoading = document.getElementById('phones-loading');
    const phonesTable = document.getElementById('phones-table');
    const phonesBody = document.getElementById('phones-body');
    const addPhoneBtn = document.getElementById('addPhoneBtn');
    const customerCode = getQueryParam('customerCode');

    // Helper function to get URL parameters
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Check if customerCode is present in URL
    if (customerCode) {
        searchInput.value = customerCode; // Set customerCode in search input
        fetchCustomerDetails(customerCode); // Trigger search function directly with customerCode
    }

    // Enter tuşuna basıldığında veya butona tıklanıldığında API çağrısı yap
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            fetchCustomerDetails(searchInput.value);
        }
    });

    searchButton.addEventListener('click', function (e) {
        e.preventDefault();
        fetchCustomerDetails(searchInput.value);
    });

    // API çağrısını gerçekleştiren fonksiyon
    function fetchCustomerDetails(customerCode) {
        // Yükleniyor animasyonunu göster
        loadingOverlay.style.display = 'flex';

        // Bilgi alanlarını temizle ve yükleniyor mesajlarını göster
        customerLoading.style.display = 'block';
        customerInfo.style.display = 'none';
        phonesLoading.style.display = 'block';
        phonesTable.style.display = 'none';
        addPhoneBtn.disabled = true;

        // API request
        fetch(`/api/customer-detail/${customerCode}/`)
            .then(response => response.json())
            .then(data => {
                // Yükleniyor animasyonunu gizle
                loadingOverlay.style.display = 'none';

                // Müşteri bilgilerini doldur
                if (data.customer_details) {
                    customerLoading.style.display = 'none';
                    customerInfo.style.display = 'block';

                    const details = data.customer_details[0];
                    document.getElementById('customer-name').innerText = details.Name;
                    document.getElementById('customer-surname').innerText = details.Surname;
                    document.getElementById('customer-identity').innerText = details.IdentityNum;
                    document.getElementById('customer-father').innerText = details.FatherName;
                    document.getElementById('customer-mother').innerText = details.MotherName;
                    document.getElementById('customer-opening').innerText = new Date(parseInt(details.AccountOpeningDate.replace('/Date(', '').replace(')/', ''))).toLocaleDateString();
                    document.getElementById('customer-overdue').innerText = `${details.TotalOverdueDebt} ₺`;
                    document.getElementById('customer-bad-debt').innerText = details.BadDebt;
                    document.getElementById('customer-credit').innerText = `${details.CreditLimit} ₺`;
                    document.getElementById('customer-remaining').innerText = `${details.RemainingLimit} ₺`;
                    document.getElementById('customer-status').innerText = details.AccountStatus;
                } else {
                    customerLoading.innerText = 'Müşteri bilgileri bulunamadı.';
                }

                // Uyarı mesajını gösteren fonksiyon
                function showToast(message) {
                    const toastNotification = document.getElementById('toast-notification');
                    toastNotification.querySelector('.toast-body').innerText = message;
                    toastNotification.style.display = 'block';

                    // 3 saniye sonra uyarıyı otomatik gizle
                    setTimeout(() => {
                        toastNotification.style.display = 'none';
                    }, 3000);
                }

                // Firebase'e telefon numarasını gönderen fonksiyon
                function sendPhoneToFirebase(phoneNumber) {
                    // Dinamik olarak username değişkenini kullanarak Firebase yolunu ayarla
                    const userPath = `users/${username}/call/phone_number`;

                    firebase.database().ref(userPath).set(phoneNumber)
                        .then(() => {
                            console.log('Telefon numarası Firebase\'e gönderildi:', phoneNumber);
                            showToast('Arama başlatıldı!');
                        })
                        .catch(error => {
                            console.error('Telefon numarasını Firebase\'e gönderirken hata oluştu:', error);
                            showToast('Arama başlatılamadı. Tekrar deneyin.');
                        });
                }

                // Phone information area
                if (data.customer_phones) {
                    phonesLoading.style.display = 'none';
                    phonesTable.style.display = 'table';
                    phonesBody.innerHTML = '';

                    data.customer_phones.forEach(phone => {
                        const row = document.createElement('tr');
                        const typeCell = document.createElement('td');
                        const phoneCell = document.createElement('td');

                        typeCell.innerText = phone.CommunicationTypeDescription;
                        phoneCell.innerText = phone.Phone;

                        // Clickable sınıfını ekle
                        phoneCell.classList.add('clickable-phone');

                        // Add click event to send phone number to Firebase
                        phoneCell.addEventListener('click', function () {
                            sendPhoneToFirebase(phone.Phone);
                        });

                        row.appendChild(typeCell);
                        row.appendChild(phoneCell);
                        phonesBody.appendChild(row);
                    });

                    addPhoneBtn.disabled = false;
                } else {
                    phonesLoading.innerText = 'Telefon bilgileri bulunamadı.';
                }

                // Diğer bilgileri doldur
                populateNotes(data.customer_notes1);
                populateMessages(data.customer_messages);
                populateAttributes(data.customer_attributes);
                populateAddresses(data.customer_addresses);
                populateInstallments(data.customer_installments);
            })
            .catch(error => {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
                customerLoading.innerText = 'Müşteri bilgileri yüklenirken bir hata oluştu.';
                phonesLoading.innerText = 'Telefon bilgileri yüklenirken bir hata oluştu.';
            });
    }

    // Taksit verilerini dolduracak fonksiyon
    function populateInstallments(installments) {
        const installmentsBody = document.getElementById('installments-body');
        installmentsBody.innerHTML = ''; // Önceki verileri temizle

        installments.forEach(installment => {
            const row = document.createElement('tr');

            const dateCell = document.createElement('td');
            const paymentTypeCell = document.createElement('td');
            const paymentCell = document.createElement('td');

            // Tarih formatını dönüştür
            const date = new Date(parseInt(installment.OperationDate.replace('/Date(', '').replace(')/', '')));
            dateCell.innerText = date.toLocaleDateString(); // Tarihi okunabilir formata dönüştür

            paymentTypeCell.innerText = installment.PaymentTypeDescription;
            paymentCell.innerText = `${installment.Payment} ₺`;

            row.appendChild(dateCell);
            row.appendChild(paymentTypeCell);
            row.appendChild(paymentCell);

            installmentsBody.appendChild(row);
        });
    }

    function populateNotes(notes) {
        const notesList = document.getElementById('notes-list');
        notesList.innerHTML = ''; // Önceki notları temizle

        notes.forEach(note => {
            const row = document.createElement('tr'); // Satır oluştur

            const dateCell = document.createElement('td');
            const alertTypeCell = document.createElement('td');
            const descriptionCell = document.createElement('td');
            const noteTakerCell = document.createElement('td');

            // Tarihi dönüştür
            const date = new Date(parseInt(note.DateNote1.replace('/Date(', '').replace(')/', '')));
            dateCell.innerText = date.toLocaleDateString(); // Tarihi okunabilir formata dönüştür

            // Hücrelere verileri yerleştir
            alertTypeCell.innerText = note.AlertTypeNote1;
            descriptionCell.innerText = note.DescriptionNote1;
            noteTakerCell.innerText = note.NoteTakerNote1;

            // Satıra hücreleri ekle
            row.appendChild(dateCell);
            row.appendChild(alertTypeCell);
            row.appendChild(descriptionCell);
            row.appendChild(noteTakerCell);

            // Satırı tabloya ekle
            notesList.appendChild(row);
        });
    }


    function populateMessages(messages) {
        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = ''; // Önceki mesajları temizle

        messages.forEach(message => {
            const row = document.createElement('tr'); // Satır oluştur

            const phoneCell = document.createElement('td');
            const dateCell = document.createElement('td');
            const messageCell = document.createElement('td');

            // Tarihi dönüştür
            const date = new Date(parseInt(message.DateMessage.replace('/Date(', '').replace(')/', '')));
            dateCell.innerText = date.toLocaleDateString(); // Tarihi okunabilir formata dönüştür

            // Hücrelere verileri yerleştir
            phoneCell.innerText = message.TelephoneNumMessage.trim(); // Telefon numarasındaki boşlukları temizleyelim
            messageCell.innerText = message.Message;

            // Satıra hücreleri ekle
            row.appendChild(phoneCell);
            row.appendChild(dateCell);
            row.appendChild(messageCell);

            // Satırı tabloya ekle
            messagesList.appendChild(row);
        });
    }


    function populateAttributes(attributes) {
        const attributesList = document.getElementById('attributes-list');
        attributesList.innerHTML = ''; // Önceki verileri temizle

        attributes.forEach(attribute => {
            const row = document.createElement('tr'); // Yeni bir satır oluştur

            const typeCell = document.createElement('td'); // Özellik Türü için hücre
            const descriptionCell = document.createElement('td'); // Açıklama için hücre

            typeCell.innerText = attribute.AttributeTypeDescription; // Özellik türü her zaman gelir
            descriptionCell.innerText = attribute.AttributeDescription || 'Yok'; // Açıklama boş ise 'Yok' yazılır

            // Hücreleri satıra ekle
            row.appendChild(typeCell);
            row.appendChild(descriptionCell);

            // Satırı tabloya ekle
            attributesList.appendChild(row);
        });
    }


    function populateAddresses(addresses) {
        const addressesList = document.getElementById('addresses-list');
        addressesList.innerHTML = ''; // Önceki adresleri temizle

        addresses.forEach(address => {
            const row = document.createElement('tr'); // Yeni bir satır oluştur

            const typeCell = document.createElement('td'); // Adres türü için hücre
            const addressCell = document.createElement('td'); // Adres bilgisi için hücre

            typeCell.innerText = address.AdressType; // Adres türü her zaman gelir
            addressCell.innerText = address.Adress || 'Adres Bilgisi Yok'; // Adres boş ise 'Adres Bilgisi Yok' yazılır

            // Hücreleri satıra ekle
            row.appendChild(typeCell);
            row.appendChild(addressCell);

            // Satırı tabloya ekle
            addressesList.appendChild(row);
        });
    }


    // Modal formunu işleyip API'ye POST isteği yapalım
    addPhoneForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Show loading overlay
        loadingOverlay.style.display = 'flex';

        // İletişim Türü ve Telefon Numarası bilgilerini al
        const communicationTypeCode = communicationType.value;
        const phone = phoneNumber.value;

        // POST isteği için verileri oluştur
        const postData = {
            "CustomerCode": searchInput.value,  // Use the current input value directly
            "CommunicationTypeCode": communicationTypeCode,
            "CommAddress": phone,
            "username": username
        };
        console.log("Gönderilecek Veri:", postData);

        // Gönderim işlemini test etmek istemediğimiz için fetch fonksiyonunu yorum satırına alıyoruz.
        fetch('/api/add-customer-communication/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(postData)
        })
            .then(response => response.json())
            .then(data => {
                // Hide loading overlay
                loadingOverlay.style.display = 'none';

                if (data.error) {
                    console.error('Hata:', data.error);
                    alert('Telefon bilgisi eklenirken bir hata oluştu.');
                } else {
                    alert('Telefon bilgisi başarıyla eklendi!');

                    // Modalı kapat
                    const addPhoneModal = new bootstrap.Modal(document.getElementById('addPhoneModal'));
                    addPhoneModal.hide();  // Close the modal
                    addPhoneForm.reset();  // Formu sıfırlamak için
                }
            })
            .catch(error => {
                // Hide loading overlay
                loadingOverlay.style.display = 'none';

                console.error('Hata:', error);
                alert('API isteği sırasında bir hata oluştu.');
            });
        // Loading overlay'i gizle, çünkü gönderim işlemi yapılmadı
        loadingOverlay.style.display = 'none';
    });



    // CSRF token'ı almak için yardımcı fonksiyon
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

    document.addEventListener('DOMContentLoaded', function () {
        const attributeTypes = {
        1: "Hesap Durumu",
        2: "Hukuk Servisi",
        3: "Ödeme Durumu",
        4: "Avukat İşlemleri",
        5: "Takip İşlemleri",
        6: "Mektup",
        7: "Özel Müşteri",
        8: "Meslek Grubu",
        9: "Üniversite",
        10: "Fakülte MYO",
        11: "Bölümü",
        12: "Gece/Gündüz",
        13: "Sözleşme Durumu",
        14: "Muhasebe Türü",
        15: "Taksit Yapabilir",
        16: "İnternet Taksitli Satış",
        17: "Müşteri Özellik 17",
        18: "İcra Mahkemesi",
        19: "Müşteri Özellik 19",
        20: "Müşteri Özellik 20",
        21: "Müşteri Özellik 21",
        22: "Müşteri Özellik 22",
        23: "Müşteri Özellik 23",
        24: "Müşteri Özellik 24",
        25: "Müşteri Özellik 25"
    };

        const attributeTypeSelect = document.getElementById('attributeType');
        const dynamicAttributeSection = document.getElementById('dynamicAttributeSection');
        const dynamicAttributeSelect = document.getElementById('dynamicAttributeSelect');

        // Dinamik olarak dropdown menüsüne seçenekleri ekleyelim
        for (const [code, description] of Object.entries(attributeTypes)) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = description;
        attributeTypeSelect.appendChild(option);
    }

        // Özellik türü seçildiğinde ikinci adım olan dinamik attribute listesini yükleme
        attributeTypeSelect.addEventListener('change', function () {
        const selectedTypeCode = attributeTypeSelect.value;

        // Eğer bir özellik türü seçildiyse, API'den dinamik verileri al
        if (selectedTypeCode) {
        fetch(`/api/get-customer-attribute-list/${selectedTypeCode}/`)
        .then(response => response.json())
        .then(data => {
        dynamicAttributeSection.style.display = 'block';  // Dinamik alanı göster
        dynamicAttributeSelect.innerHTML = '';  // Var olan içerikleri temizle

        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Özellik seçin...';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        dynamicAttributeSelect.appendChild(defaultOption);

        // Dropdown olarak gelen attribute verilerini ekle
        data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.AttributeCode;  // Backend'e gönderilecek kod
        option.textContent = item.AttributeDescription;  // Kullanıcıya gösterilecek açıklama
        dynamicAttributeSelect.appendChild(option);
    });
    })
        .catch(error => {
        console.error('Dinamik attribute yüklenirken hata oluştu:', error);
        dynamicAttributeSection.style.display = 'none';
    });
    }
    });

        // Form gönderimi işleme
        const addAttributeForm = document.getElementById('addAttributeForm');
        addAttributeForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const selectedTypeCode = attributeTypeSelect.value;
        const selectedAttributeCode = dynamicAttributeSelect.value;

        if (!selectedAttributeCode) {
        alert('Lütfen bir özellik seçin.');
        return;
    }

        const postData = {
        CustomerCode: '12345',
        AttributeTypeCode: selectedTypeCode,
        AttributeCode: selectedAttributeCode,
        username: 'kullaniciadi'
    };

        // API'ye POST isteği
        fetch(`/api/add-customer-attribute/`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')  // CSRF koruması için
    },
        body: JSON.stringify(postData)
    })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
        alert('Özellik başarıyla eklendi!');
        // Formu temizle ve modalı kapat
        addAttributeForm.reset();
        const addAttributeModal = new bootstrap.Modal(document.getElementById('addAttributeModal'));
        addAttributeModal.hide();
        // Yeni özelliği tabloya ekle
        fetchAttributes();  // Özellikleri yeniden yükleme fonksiyonu
    } else {
        alert('Bir hata oluştu.');
    }
    })
        .catch(error => {
        console.error('API isteği sırasında bir hata oluştu:', error);
        alert('API isteği sırasında bir hata oluştu.');
            });
        });
    });
});