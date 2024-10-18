document.addEventListener('DOMContentLoaded', function () {
    const customersTableBody = document.getElementById('customers-body');
    const loadingOverlay = document.getElementById('loading-overlay');
    const messageContainer = document.getElementById('message-container');

    // Sayfa yüklendiğinde müşteri bilgilerini getir
    fetchCustomerDetails();

    // Müşteri bilgilerini çeken fonksiyon
    function fetchCustomerDetails() {
        showLoading(true);
        fetch('/api/customer-search/', {
            method: 'GET',
        })
        .then(response => response.json())
        .then(data => {
            showLoading(false);
            populateCustomersTable(data.result);
        })
        .catch(error => {
            showLoading(false);
            messageContainer.style.display = 'block';
            messageContainer.textContent = 'Müşteri arama sırasında hata oluştu. Lütfen tekrar deneyin.';
            console.error('Müşteri arama sırasında hata oluştu:', error);
        });
    }

    // Müşteri bilgilerini tabloya dolduran fonksiyon
    function populateCustomersTable(customers) {
        // Tabloyu temizle
        customersTableBody.innerHTML = '';

        // Her müşteri için bir satır oluştur
        customers.forEach(customer => {
            const row = document.createElement('tr');

            // Müşteri bilgilerini hücrelere yerleştir
            const customerCodeCell = createCell(customer.CustomerCode);
            const identityNumCell = createCell(customer.IdentityNum);
            const nameCell = createCell(customer.Name);
            const surnameCell = createCell(customer.Surname);
            const fatherNameCell = createCell(customer.FatherName);
            const motherNameCell = createCell(customer.MotherName);

            // Telefon numaralarını badge olarak listele
            const phoneListCell = document.createElement('td');
            const phoneList = customer.PhoneList.map(phone =>
                `<span class="badge bg-info text-dark me-1">${phone.trim()}</span>`
            ).join('');
            phoneListCell.innerHTML = phoneList;

            // Satıra hücreleri ekle
            row.appendChild(customerCodeCell);
            row.appendChild(identityNumCell);
            row.appendChild(nameCell);
            row.appendChild(surnameCell);
            row.appendChild(fatherNameCell);
            row.appendChild(motherNameCell);
            row.appendChild(phoneListCell);

            // Satırı tabloya ekle
            customersTableBody.appendChild(row);
        });
    }

    // Yardımcı fonksiyon: tablo hücreleri oluşturur
    function createCell(text) {
        const cell = document.createElement('td');
        cell.innerText = text;
        return cell;
    }

    // Yükleniyor animasyonu göster/gizle
    function showLoading(isLoading) {
        if (isLoading) {
            loadingOverlay.style.display = 'flex';
            messageContainer.style.display = 'none';
        } else {
            loadingOverlay.style.display = 'none';
        }
    }
});
