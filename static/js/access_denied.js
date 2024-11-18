// Particle animation için mouse takibi
document.addEventListener('DOMContentLoaded', function() {
    const particles = document.querySelector('.particles');
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    const ease = 0.1; // Yumuşak geçiş için easing faktörü

    // Mouse pozisyonunu takip et
    document.addEventListener('mousemove', function(e) {
        const rect = particles.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    // Animasyon framelerini güncelle
    function animate() {
        // Yumuşak geçiş için current pozisyonları güncelle
        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;

        // CSS değişkenlerini güncelle
        particles.style.setProperty('--mouse-x', `${currentX}px`);
        particles.style.setProperty('--mouse-y', `${currentY}px`);

        requestAnimationFrame(animate);
    }

    // Animasyonu başlat
    animate();

    // Kilit animasyonunu yönet
    const lockIcon = document.querySelector('.lock-icon');
    let isLocked = true;

    // Kilit ikonuna hover efekti
    lockIcon.addEventListener('mouseenter', function() {
        if (isLocked) {
            this.classList.remove('fa-lock');
            this.classList.add('fa-lock-open');

            // Kısa bir titreşim efekti
            this.style.animation = 'none';
            this.offsetHeight; // Reflow
            this.style.animation = 'lockShake 0.5s ease-in-out';
        }
    });

    lockIcon.addEventListener('mouseleave', function() {
        if (isLocked) {
            this.classList.remove('fa-lock-open');
            this.classList.add('fa-lock');

            // Normal animasyona dön
            this.style.animation = 'lockShake 3s ease-in-out infinite';
        }
    });
});

// Error code animasyonu
const errorCode = document.querySelector('.error-code span');
if (errorCode) {
    errorCode.style.opacity = '0';

    // Sayfa yüklendikten sonra error code'u göster
    setTimeout(() => {
        errorCode.style.transition = 'opacity 1s ease-in-out';
        errorCode.style.opacity = '1';
    }, 1000);
}

// Butonlar için hover efekti
document.querySelectorAll('.btn-custom').forEach(button => {
    button.addEventListener('mousemove', function(e) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        button.style.setProperty('--x', `${x}px`);
        button.style.setProperty('--y', `${y}px`);
    });
});