// Sayfa yüklendiğinde
window.onload = function() {
    // Geri tuşu kullanıldığında
    window.onpageshow = function(event) {
        if (event.persisted) {
            window.location.reload();
        }
    };
}

// Browser cache'ini kontrol et
if (window.performance && window.performance.navigation.type === 2) {
    window.location.reload();
}
