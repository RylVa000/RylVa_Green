// ==========================================
// 1. LOGIKA ANIMASI SCROLL (FADE IN)
// ==========================================
// panggil class spesifik tanpa menggunakan tag section
const targetanimasi = document.querySelectorAll('.home-overlay, .info-container, .categories-section, .why-choose-container, .plant-care-container, .bestsellers-section, .trust-container, .herokontakoverlay, .itemkartu, .kolomkiri, .bungkusform');

// buat pengamat untuk memicu kemunculan elemen
const pengamat = new IntersectionObserver((daftarentri) => {
    daftarentri.forEach((entri) => {
        if (entri.isIntersecting) {
            entri.target.classList.add('elemen-tampil');
            pengamat.unobserve(entri.target);
        }
    });
}, {
    threshold: 0.1 
});

// sembunyikan semua elemen dari awal, lalu pantau
targetanimasi.forEach((elemen) => {
    elemen.classList.add('elemen-pudar');
    pengamat.observe(elemen);
});