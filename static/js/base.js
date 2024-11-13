// Toggle sidebar visibility on mobile
const sidebar = document.querySelector('.sidebar');
const toggler = document.querySelector('.navbar-toggler');

toggler.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('show');
});

// Close sidebar when clicking outside of it on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('show') &&
        !sidebar.contains(e.target) && !toggler.contains(e.target)) {
        sidebar.classList.remove('show');
    }
});

// Automatically hide sidebar on window resize if viewport is larger than 768px
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('show');
    }
});
