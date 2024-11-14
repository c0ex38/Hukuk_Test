import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getDatabase, ref, onChildAdded, remove } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";

// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "hukuk-9a8a0.firebaseapp.com",
    databaseURL: "https://hukuk-9a8a0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "hukuk-9a8a0",
    storageBucket: "hukuk-9a8a0.appspot.com",
    messagingSenderId: "972531735321",
    appId: "1:972531735321:web:17e969ac94388ea8d50388"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', function () {
    const categoryContainer = document.getElementById('category-container');
    const dateInputContainer = document.getElementById('date-input-container');
    const extraDateInput = document.getElementById('extra-date');

    if (typeof currentUsername !== 'undefined' && currentUsername) {
        const userCallHistoryRef = ref(database, `users/${currentUsername}/call_history`);

        onChildAdded(userCallHistoryRef, (snapshot) => {
            const data = snapshot.val();

            if (data && data.phone_number) {
                const phoneNumberInput = document.getElementById('phone_number');
                phoneNumberInput ? (phoneNumberInput.value = data.phone_number) : console.error("Telefon numarası alanı bulunamadı.");

                get_Note_Categories();
                document.getElementById('user-note').value = "";

                $('#searchModal').modal('show');

                document.querySelectorAll('button').forEach(button => {
                    button.addEventListener('click', () => {
                        remove(snapshot.ref)
                            .then(() => {
                                console.log('call_history girdisi başarıyla silindi.');
                                $('#searchModal').modal('hide');
                            })
                            .catch((error) => console.error('call_history girdisi silinirken hata oluştu:', error));
                    });
                });
            }
        });

        // Belirli UserWarningCode'lar için tarih alanı göstermek
        const codesWithDate = ['107', '109'];

        // Radyo buton değişikliğinde tarih alanını göster
        categoryContainer.addEventListener('change', function (event) {
            if (event.target.name === 'category') {
                const selectedCode = event.target.value;
                if (codesWithDate.includes(selectedCode)) {
                    dateInputContainer.classList.remove('d-none');
                    extraDateInput.required = true;
                } else {
                    dateInputContainer.classList.add('d-none');
                    extraDateInput.required = false;
                    extraDateInput.value = '';
                }
            }
        });
    } else {
        console.error("Kullanıcı adı bulunamadı.");
    }
});

// Kategorileri getirme fonksiyonu
function get_Note_Categories() {
    const categoryContainer = document.getElementById('category-container');
    categoryContainer.innerHTML = '<p>Yükleniyor...</p>';

    fetch('/api/get-customer-note-categories/')
        .then(response => response.json())
        .then(data => {
            categoryContainer.innerHTML = '';

            if (data.length === 0) {
                categoryContainer.innerHTML = '<p>Hiç kategori bulunamadı</p>';
                return;
            }

            const allowedCodes = ['006', '009', '107', '109', '110', '111', '112', '114', '116', '119', '125', '128', '132', '141', '139'];
            const filteredData = data.filter(item => allowedCodes.includes(item.UserWarningCode));

            if (filteredData.length === 0) {
                categoryContainer.innerHTML = '<p>Filtrelenen kategoriler bulunamadı</p>';
                return;
            }

            filteredData.forEach(({ UserWarningCode, UserWarningDescription }) => {
                const radioWrapper = document.createElement('div');
                radioWrapper.classList.add('form-check', 'col');

                const radioInput = document.createElement('input');
                radioInput.classList.add('form-check-input');
                radioInput.type = 'radio';
                radioInput.name = 'category';
                radioInput.id = `category-${UserWarningCode}`;
                radioInput.value = UserWarningCode;
                radioInput.dataset.description = UserWarningDescription;

                const radioLabel = document.createElement('label');
                radioLabel.classList.add('form-check-label');
                radioLabel.htmlFor = `category-${UserWarningCode}`;
                radioLabel.textContent = UserWarningDescription;

                radioWrapper.appendChild(radioInput);
                radioWrapper.appendChild(radioLabel);
                categoryContainer.appendChild(radioWrapper);
            });
        })
        .catch(error => {
            console.error('Kategori yüklenirken hata oluştu:', error);
            categoryContainer.innerHTML = '<p>Veri Yüklenemedi</p>';
        });
}
