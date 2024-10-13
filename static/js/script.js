document.getElementById("searchForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const customerCode = document.getElementById("customerCode").value;
    const apiUrl = `http://127.0.0.1:8000/api/fetch-customer-details/${customerCode}/`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Müşteri bulunamadı veya bir hata oluştu.");
            }
            return response.json();
        })
        .then(data => {
            const resultDiv = document.getElementById("result");
            resultDiv.innerHTML = ""; // Önceki sonuçları temizle

            const sections = {
                'Müşteri Detayları': data.customer_details[0],
                'Telefon Numaraları': data.customer_phones,
                'Notlar 1': data.customer_notes1,
                'Notlar 2': data.customer_notes2,
                'Özellikler': data.customer_attributes,
                'Mesajlar': data.customer_messages,
                'Adresler': data.customer_addresses,
            };

            for (const [title, content] of Object.entries(sections)) {
                const cardDiv = document.createElement("div");
                cardDiv.classList.add("col-lg-4", "col-md-6", "col-sm-12");

                cardDiv.innerHTML = `
                    <div class="card shadow-sm result-item">
                        <div class="card-header bg-primary text-white p-2">
                            <h6 class="card-title mb-0">${title}</h6>
                        </div>
                        <div class="card-body p-2">
                            <table class="table table-bordered table-sm mb-0">
                                <thead>
                                    <tr></tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                `;

                // Tablo başlıklarını ekle
                const tableHead = cardDiv.querySelector("thead tr");
                if (Array.isArray(content) && content.length > 0) {
                    Object.keys(content[0]).forEach(key => {
                        const th = document.createElement("th");
                        th.innerText = key;
                        tableHead.appendChild(th);
                    });
                } else if (content && typeof content === "object") {
                    Object.keys(content).forEach(key => {
                        const th = document.createElement("th");
                        th.innerText = key;
                        tableHead.appendChild(th);
                    });
                }

                // Tablo içeriklerini ekle
                const tableBody = cardDiv.querySelector("tbody");
                if (Array.isArray(content)) {
                    content.forEach(item => {
                        const row = document.createElement("tr");
                        Object.values(item).forEach(value => {
                            const td = document.createElement("td");
                            td.innerText = formatValue(value);
                            row.appendChild(td);
                        });
                        tableBody.appendChild(row);
                    });
                } else if (content && typeof content === "object") {
                    const row = document.createElement("tr");
                    Object.values(content).forEach(value => {
                        const td = document.createElement("td");
                        td.innerText = formatValue(value);
                        row.appendChild(td);
                    });
                    tableBody.appendChild(row);
                }

                resultDiv.appendChild(cardDiv);
            }
        })
        .catch(error => {
            document.getElementById("result").innerHTML = `<p class="text-danger text-center">${error.message}</p>`;
        });
});

// JSON tarih formatını okunabilir hale getirir
function formatValue(value) {
    if (typeof value === "string" && value.includes("/Date(")) {
        const timestamp = parseInt(value.match(/\d+/)[0]);
        return new Date(timestamp).toLocaleDateString("tr-TR");
    }
    return value !== null ? value : "Yok";
}
