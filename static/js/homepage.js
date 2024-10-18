document.addEventListener('DOMContentLoaded', function () {
    // Input ve buton referansları
    const searchInput = document.querySelector('input[type="search"]');
    const searchButton = document.querySelector('button[type="submit"]');
    const customerCodeInput = searchInput.value; // CustomerCode
    const username = "{{ username }}"; // Kullanıcı adı

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

    const loadingOverlay = document.getElementById('loading-overlay'); // Loading overlay reference

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
        // Show loading overlay
        loadingOverlay.style.display = 'flex';

        // Show loading messages
        customerLoading.style.display = 'block';
        customerInfo.style.display = 'none';
        phonesLoading.style.display = 'block';
        phonesTable.style.display = 'none';
        addPhoneBtn.disabled = true;

        // API request
        fetch(`/api/fetch-customer-details/${customerCode}/`)
            .then(response => response.json())
            .then(data => {
                // Hide loading overlay
                loadingOverlay.style.display = 'none';

                // Fill customer details
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

                // Populate phone information
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

                        row.appendChild(typeCell);
                        row.appendChild(phoneCell);
                        phonesBody.appendChild(row);
                    });

                    addPhoneBtn.disabled = false;
                } else {
                    phonesLoading.innerText = 'Telefon bilgileri bulunamadı.';
                }

                // Populate customer notes
                populateNotes(data.customer_notes1);
                populateMessages(data.customer_messages);
                populateAttributes(data.customer_attributes);
                populateAddresses(data.customer_addresses);
            })
            .catch(error => {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
                customerLoading.innerText = 'Müşteri bilgileri yüklenirken bir hata oluştu.';
                phonesLoading.innerText = 'Telefon bilgileri yüklenirken bir hata oluştu.';
            });
    }

    function populateNotes(notes) {
        const notesList = document.getElementById('notes-list');
        notesList.innerHTML = ''; // Clear previous notes

        notes.forEach(note => {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item list-group-item-action';
            listItem.innerHTML = `
                <strong>${note.AlertTypeNote1}</strong> - ${note.DescriptionNote1}<br>
                <small>${new Date(parseInt(note.DateNote1.replace('/Date(', '').replace(')/', ''))).toLocaleDateString()} - ${note.NoteTakerNote1}</small>
            `;
            notesList.appendChild(listItem);
        });
    }

    function populateMessages(messages) {
        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = ''; // Clear previous messages

        messages.forEach(message => {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item list-group-item-action';
            listItem.innerHTML = `
                <strong>${message.TelephoneNumMessage}</strong> - ${message.Message}<br>
                <small>${new Date(parseInt(message.DateMessage.replace('/Date(', '').replace(')/', ''))).toLocaleDateString()}</small>
            `;
            messagesList.appendChild(listItem);
        });
    }

    function populateAttributes(attributes) {
        const attributesList = document.getElementById('attributes-list');
        attributesList.innerHTML = ''; // Clear previous attributes

        attributes.forEach(attribute => {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item list-group-item-action';
            listItem.innerHTML = `
                <strong>${attribute.AttributeTypeDescription}:</strong> ${attribute.AttributeDescription || 'Yok'}
            `;
            attributesList.appendChild(listItem);
        });
    }

    function populateAddresses(addresses) {
        const addressesList = document.getElementById('addresses-list');
        addressesList.innerHTML = ''; // Clear previous addresses

        addresses.forEach(address => {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item list-group-item-action';
            listItem.innerHTML = `
                <strong>${address.AdressType}:</strong> ${address.Adress}
            `;
            addressesList.appendChild(listItem);
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

        // API'ye POST isteği yap
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
                // Başarılı olursa telefon bilgilerini tekrar yükle
                fetchCustomerDetails(searchInput.value);

                // Modalı kapat
                const addPhoneModal = new bootstrap.Modal(document.getElementById('addPhoneModal'));
                addPhoneModal.hide();  // Close the modal
            }
        })
        .catch(error => {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';

            console.error('Hata:', error);
            alert('API isteği sırasında bir hata oluştu.');
        });
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
});
