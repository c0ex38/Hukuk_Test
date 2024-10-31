document.addEventListener('DOMContentLoaded', function () {
    const customersTableBody = document.getElementById('customers-body');
    const messageContainer = document.getElementById('message-container');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    let customersData = [];   // Tüm müşteri verileri
    let filteredData = [];    // Filtrelenmiş müşteri verileri
    let currentPage = 1;
    const rowsPerPage = 10;   // Her sayfada gösterilecek satır sayısı

    // Sayfa yüklendiğinde müşteri bilgilerini getir
    fetchCustomerDetails();

    // Müşteri bilgilerini çeken fonksiyon
    function fetchCustomerDetails() {
        fetch('/api/customer-search/', { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                customersData = data.result;
                filteredData = customersData; // İlk yüklemede filtrelenmiş veri tüm veriler olur
                currentPage = 1;              // İlk sayfadan başlat
                displayPage(currentPage);
            })
            .catch(error => {
                messageContainer.style.display = 'block';
                messageContainer.textContent = 'Müşteri arama sırasında hata oluştu. Lütfen tekrar deneyin.';
                console.error('Müşteri arama sırasında hata oluştu:', error);
            });
    }

    // Sayfa bilgilerini güncelleyen fonksiyon
    function displayPage(page, data = filteredData) {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageData = data.slice(start, end);

        populateCustomersTable(pageData);
        pageInfo.textContent = `Sayfa ${page}`;
        prevPageBtn.parentElement.classList.toggle('disabled', page === 1);
        nextPageBtn.parentElement.classList.toggle('disabled', end >= data.length);
    }

    // Müşteri bilgilerini tabloya dolduran fonksiyon
    function populateCustomersTable(customers) {
        customersTableBody.innerHTML = '';

        customers.forEach(customer => {
            const row = document.createElement('tr');

            // Satırı tıklanabilir yap ve "homepage" sayfasına yönlendir
            row.addEventListener('click', function() {
                const customerCode = customer.CustomerCode;
                // Yönlendirme URL'sini doğru oluşturduğunuzdan emin olun
                window.location.href = `/homepage/?customerCode=${encodeURIComponent(customerCode)}`;
            });


            // Müşteri bilgilerini hücrelere yerleştir
            row.appendChild(createCell(customer.CustomerCode));
            row.appendChild(createCell(customer.IdentityNum));
            row.appendChild(createCell(customer.Name));
            row.appendChild(createCell(customer.Surname));
            row.appendChild(createCell(customer.FatherName));
            row.appendChild(createCell(customer.MotherName));

            // Telefon numaralarını badge olarak listele
            const phoneListCell = document.createElement('td');
            phoneListCell.innerHTML = customer.PhoneList.map(phone =>
                `<span class="badge bg-info text-dark me-1">${phone.trim()}</span>`
            ).join('');
            row.appendChild(phoneListCell);

            customersTableBody.appendChild(row);
        });
    }

    // Yardımcı fonksiyon: tablo hücreleri oluşturur
    function createCell(text) {
        const cell = document.createElement('td');
        cell.innerText = text;
        return cell;
    }

    // Dinamik Filtreleme İşlevi
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('input', filterTable);
    });

    function filterTable() {
        const filters = {};
        document.querySelectorAll('.filter-input').forEach(input => {
            const column = input.getAttribute('data-column');
            const value = input.value.toLowerCase();
            if (value) filters[column] = value;
        });

        // Filtrelenmiş veriyi global `filteredData` değişkenine ata
        filteredData = customersData.filter(customer => {
            return Object.keys(filters).every(column => {
                const customerValue = Array.isArray(customer[column])
                    ? customer[column].join(' ').toLowerCase() // Telefon numaraları gibi listeleri stringe çevir
                    : (customer[column] || '').toString().toLowerCase();
                return customerValue.includes(filters[column]);
            });
        });

        currentPage = 1; // Filtreleme yapıldığında sayfayı 1'e döndür
        displayPage(currentPage, filteredData);
    }

    // Sayfa düğmeleri işlevleri
    prevPageBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            displayPage(currentPage, filteredData);
        }
    });

    nextPageBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentPage * rowsPerPage < filteredData.length) {
            currentPage++;
            displayPage(currentPage, filteredData);
        }
    });
});
