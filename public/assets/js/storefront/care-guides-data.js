"use strict";

// Editorial summaries, paraphrased from the linked university sources.
// Product associations and photographs follow the existing preview catalog.
window.RylvaCareGuidesData = (() =>
{
  const sourceRoot = "https://plants.ces.ncsu.edu/plants/";
  const topics =
  {
    all: "Semua topik",
    water: "Penyiraman",
    light: "Cahaya",
    media: "Media tanam",
    growth: "Daun & pertumbuhan"
  };
  const guides =
  [
    {
      id: "monstera",
      name: "Monstera",
      scientificName: "Monstera deliciosa",
      type: "indoor",
      topics: ["water", "light", "growth"],
      description: "Kenali kebutuhan cahaya, kondisi media sebelum disiram, dan penyangga untuk batang yang merambat.",
      source: sourceRoot + "monstera-deliciosa/",
      sourceName: "NC State Extension",
      sections:
      [
        { topic: "light", text: "Pilih cahaya tidak langsung; hindari paparan matahari langsung yang kuat." },
        { topic: "water", text: "Siram merata, lalu biarkan bagian atas media mengering sebelum menyiram lagi." },
        { topic: "growth", text: "Sediakan penyangga yang kokoh dan bersihkan debu pada daun secara berkala." }
      ]
    },
    {
      id: "peace-lily",
      name: "Peace Lily",
      scientificName: "Spathiphyllum spp.",
      type: "indoor",
      topics: ["water", "light", "media"],
      description: "Temukan posisi teduh dan pahami perbedaan media lembap dengan media yang terlalu basah.",
      source: sourceRoot + "spathiphyllum/",
      sourceName: "NC State Extension",
      sections:
      [
        { topic: "light", text: "Tempatkan di area teduh dan hindari sinar matahari langsung." },
        { topic: "water", text: "Jaga kelembapan media tanpa membuatnya becek. Beri kesempatan media mengering di antara penyiraman." },
        { topic: "media", text: "Gunakan campuran tanam yang kaya bahan organik." }
      ]
    },
    {
      id: "snake-plant",
      name: "Lidah Mertua",
      scientificName: "Dracaena trifasciata",
      type: "indoor",
      topics: ["water", "light", "media"],
      description: "Utamakan drainase dan periksa kekeringan media agar penyiraman tidak berlebihan.",
      source: sourceRoot + "dracaena-trifasciata/",
      sourceName: "NC State Extension",
      sections:
      [
        { topic: "water", text: "Biarkan media mengering di antara penyiraman; air berlebih dapat menyebabkan akar membusuk." },
        { topic: "media", text: "Pilih media dengan drainase baik agar air tidak tertahan di sekitar akar." },
        { topic: "light", text: "Tanaman dapat menoleransi cahaya rendah dan menerima matahari langsung sebagian hari." }
      ]
    },
    {
      id: "aglaonema",
      name: "Aglaonema",
      scientificName: "Aglaonema spp.",
      type: "indoor",
      topics: ["water", "light", "growth"],
      description: "Periksa permukaan media, sesuaikan cahaya ruangan, dan amati kondisi daun secara rutin.",
      source: "https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/aglaonema/",
      sourceName: "UF/IFAS Extension",
      sections:
      [
        { topic: "light", text: "Tempatkan di dalam ruangan dengan cahaya sedang hingga rendah." },
        { topic: "water", text: "Siram ketika sekitar 2,5 cm permukaan media terasa kering. Hindari penyiraman berlebih." },
        { topic: "growth", text: "Periksa daun secara berkala untuk mengetahui tanda gangguan hama." }
      ]
    },
    {
      id: "dracaena",
      name: "Dracaena sanderiana",
      scientificName: "Dracaena sanderiana",
      type: "indoor",
      topics: ["water", "light", "media"],
      description: "Bedakan perawatan tanaman di media pot dan di air, serta pilih cahaya tidak langsung.",
      source: sourceRoot + "dracaena-sanderiana/",
      sourceName: "NC State Extension",
      sections:
      [
        { topic: "light", text: "Untuk penempatan di dalam ruangan, pilih cahaya terang tidak langsung." },
        { topic: "media", text: "Gunakan media pot yang lembap. Tanaman ini juga dapat ditumbuhkan dalam air bebas klorin." },
        { topic: "water", text: "Jika ditumbuhkan dalam air, ganti air setiap minggu. Hindari air berlebih pada tanaman dalam media pot." }
      ]
    },
    {
      id: "petunia",
      name: "Petunia",
      scientificName: "Petunia × hybrida",
      type: "outdoor",
      topics: ["light", "media", "growth"],
      description: "Pelajari posisi bercahaya, media dengan drainase baik, dan penanganan bunga yang telah layu.",
      source: sourceRoot + "petunia-x-hybrida/",
      sourceName: "NC State Extension",
      sections:
      [
        { topic: "light", text: "Pilih matahari penuh hingga teduh sebagian. Tempat yang terlalu teduh dapat mengurangi pembungaan." },
        { topic: "media", text: "Gunakan media ringan dengan drainase baik." },
        { topic: "growth", text: "Buang bunga yang telah layu untuk mendukung pembentukan kuncup. Pangkas pucuk bila batang tumbuh terlalu memanjang." }
      ]
    }
  ];

  return { guides, topics };
})();
