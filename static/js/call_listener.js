document.addEventListener('DOMContentLoaded', function () {
    // Firebase yapılandırma (gerekliyse)
    const firebaseConfig = {
      apiKey: "AIzaSyARCS5Vm2DfKtZmgJxYf8ZNWhRlqPX6Qck",
      authDomain: "hukuk-9a8a0.firebaseapp.com",
      databaseURL: "https://hukuk-9a8a0-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "hukuk-9a8a0",
      storageBucket: "hukuk-9a8a0.appspot.com",
      messagingSenderId: "972531735321",
      appId: "1:972531735321:web:17e969ac94388ea8d50388"
    };

    // Firebase başlatma
    const app = firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Kullanıcı adı değişkeni base.html'den alınmış olmalı
    if (username) {
        // Firebase'de kullanıcıya ait düğümü dinle
        const userCallHistoryRef = database.ref(`users/${username}/call_history/phone_number`);

        userCallHistoryRef.on('value', (snapshot) => {
            const phoneNumber = snapshot.val();

            if (phoneNumber) {
                // Eğer yeni bir phone_number verisi geldiyse, yeni sekmede yönlendir
                console.log(`Yeni telefon numarası: ${phoneNumber}`);
                // Yeni bir sekme aç ve phone_number parametresi ile URL'e yönlendir
                window.open(`/call_result/?phone_number=${phoneNumber}`, '_blank');

                // Veriyi işledikten sonra Firebase'den sil
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
