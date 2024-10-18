// static/js/user_panel.js

document.addEventListener('DOMContentLoaded', function () {
    // Dinamik bileşenler ekleme
    const componentArea = document.getElementById('component-area');

    // Bir örnek bileşen: kullanıcı bilgisi
    const userInfoComponent = document.createElement('div');
    userInfoComponent.classList.add('user-info');
    userInfoComponent.innerHTML = `
        <h2>Kullanıcı Bilgileri</h2>
        <p>Bu, bir bileşen örneğidir. Burada kullanıcıya ait bilgileri gösterebiliriz.</p>
    `;

    componentArea.appendChild(userInfoComponent);

    // Gelecekte daha fazla bileşen ekleyebiliriz
});
