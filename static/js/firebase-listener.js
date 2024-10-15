function listenForCallHistoryUpdates(username) {
    const callHistoryRef = firebase.database().ref(`users/${username}/call_history`);

    // Yeni veriler eklendiğinde tetiklenecek
    callHistoryRef.on('child_added', function(snapshot) {
        const callData = snapshot.val();
        const phoneNumber = callData.phone_number; // Telefon numarasını al
        const status = callData.status; // Durumu al
        const callDuration = callData.call_duration; // Süreyi al

        // Sayfaya yönlendirme yap
        openCallResultPage(phoneNumber, status, callDuration);
    });
}

function openCallResultPage(phoneNumber, status, callDuration) {
    // callResult sayfasına yönlendirin ve gerekli verileri URL parametreleri olarak ekleyin
    window.location.href = `/callResult?phone_number=${encodeURIComponent(phoneNumber)}&status=${encodeURIComponent(status)}&duration=${encodeURIComponent(callDuration)}`;
}

