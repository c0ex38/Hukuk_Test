document.addEventListener('DOMContentLoaded', function () {
    const firebaseConfig = {
        apiKey: "AIzaSyARCS5Vm2DfKtZmgJxYf8ZNWhRlqPX6Qck",
        authDomain: "hukuk-9a8a0.firebaseapp.com",
        databaseURL: "https://hukuk-9a8a0-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "hukuk-9a8a0",
        storageBucket: "hukuk-9a8a0.appspot.com",
        messagingSenderId: "972531735321",
        appId: "1:972531735321:web:17e969ac94388ea8d50388"
    };

    const app = firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    if (username) {
        const userCallHistoryRef = database.ref(`users/${username}/call_history`);

        userCallHistoryRef.on('child_added', (snapshot) => {
            const data = snapshot.val();

            if (data && data.phone_number) {
                const phoneNumber = data.phone_number;
                console.log(`Yeni telefon numarası: ${phoneNumber}`);

                // Telefon numarasını modalın telefon alanına yerleştir
                document.getElementById('phone').value = phoneNumber;

                // Kategori seçeneklerini dinamik olarak yükle
                fetchCategories();

                // Kullanıcı not alanını temizle
                document.getElementById('user-note').value = "";

                // Modalı göster
                $('#searchModal').modal('show');

                // Modal açıldıktan sonra Firebase'deki call_history düğümünü sil
                snapshot.ref.remove()
                    .then(() => {
                        console.log('Phone number verisi başarıyla silindi.');
                    })
                    .catch((error) => {
                        console.error('Veri silinirken hata oluştu:', error);
                    });
            }
        });
    } else {
        console.error("Kullanıcı adı bulunamadı.");
    }
});

function fetchCategories() {
    const categoryContainer = document.getElementById('category-container');
    categoryContainer.innerHTML = '<p>Yükleniyor...</p>';

    fetch('/api/get-customer-note-categories/')
        .then(response => response.json())
        .then(data => {
            categoryContainer.innerHTML = '';  // Var olan içeriği temizle

            if (data.length === 0) {
                categoryContainer.innerHTML = '<p>Hiç kategori bulunamadı</p>';
                return;
            }

            data.forEach(item => {
                const radioWrapper = document.createElement('div');
                radioWrapper.classList.add('form-check', 'col');

                const radioInput = document.createElement('input');
                radioInput.classList.add('form-check-input');
                radioInput.type = 'radio';
                radioInput.name = 'category';
                radioInput.id = `category-${item.UserWarningCode}`;
                radioInput.value = item.UserWarningCode;
                radioInput.dataset.description = item.UserWarningDescription;

                const radioLabel = document.createElement('label');
                radioLabel.classList.add('form-check-label');
                radioLabel.htmlFor = `category-${item.UserWarningCode}`;
                radioLabel.textContent = item.UserWarningDescription;

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
