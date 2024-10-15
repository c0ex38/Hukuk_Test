document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneNumber = urlParams.get("phone_number");
    const status = urlParams.get("status");
    const duration = urlParams.get("duration");

    // Verileri sayfada gösterme
    document.getElementById("phoneNumberDisplay").innerText = phoneNumber || 'Bilgi yok';
    document.getElementById("callStatusDisplay").innerText = status || 'Bilgi yok';
    document.getElementById("callDurationDisplay").innerText = duration || 'Bilgi yok';
});
