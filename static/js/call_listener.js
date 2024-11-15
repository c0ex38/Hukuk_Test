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

    // Sabit kategori listesi
    const categories = [
        { code: '006', description: 'GSM NUMARASI ALINSIN' },
        { code: '009', description: 'AVUKAT UYARI MEKTUBU GÖNDERİLSİN' },
        { code: '107', description: 'Ödeme Tarih Verilenler' },
        { code: '109', description: 'Arandı Ödeme Tarihi Verdi' },
        { code: '110', description: 'Arandı telefon yanlış denildi' },
        { code: '111', description: 'Arandı borcu ödemeyecem dedi' },
        { code: '112', description: 'Telefon no kullanılmıyor' },
        { code: '114', description: 'Telefona Cevap Verilmiyor' },
        { code: '116', description: 'Telefonu Meşgule alıyor' },
        { code: '119', description: 'Sözleşme Hukuk Servisinde' },
        { code: '125', description: 'Yeniden Aransın' },
        { code: '128', description: 'Uyarı Sms Yollandı' },
        { code: '132', description: 'KVKK Gereği Hesap Yenilenmesi' },
        { code: '141', description: 'İKİ DESABI OLUP BİRLEŞTİRİLEN HESAPLAR' },
        { code: '139', description: 'Vefat Edten ve Şehit Olanlar' }
    ];

    // Kategorileri UI'ya ekle
    categoryContainer.innerHTML = '';
    categories.forEach(({ code, description }) => {
        const radioWrapper = document.createElement('div');
        radioWrapper.classList.add('form-check', 'col');

        const radioInput = document.createElement('input');
        radioInput.classList.add('form-check-input');
        radioInput.type = 'radio';
        radioInput.name = 'category';
        radioInput.id = `category-${code}`;
        radioInput.value = code;
        radioInput.dataset.description = description;

        const radioLabel = document.createElement('label');
        radioLabel.classList.add('form-check-label');
        radioLabel.htmlFor = `category-${code}`;
        radioLabel.textContent = description;

        radioWrapper.appendChild(radioInput);
        radioWrapper.appendChild(radioLabel);
        categoryContainer.appendChild(radioWrapper);
    });

    if (typeof currentUsername !== 'undefined' && currentUsername) {
        const userCallHistoryRef = ref(database, `users/${currentUsername}/call_history`);

        onChildAdded(userCallHistoryRef, (snapshot) => {
            const data = snapshot.val();

            if (data && data.phone_number) {
                const phoneNumberInput = document.getElementById('phone_number');
                phoneNumberInput ? (phoneNumberInput.value = data.phone_number) : console.error("Telefon numarası alanı bulunamadı.");

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