# Kontrak adapter pembayaran dan kurir v1

Diterapkan 21 November 2026 untuk menyelesaikan kontrak/mock M0. Ini kontrak internal PHP, bukan endpoint HTTP baru atau bukti integrasi vendor. Acuan bisnis: spesifikasi v2.6 D-06, D-11, BR-04, BR-14 dan A.6.

## Batas tanggung jawab

- `PaymentGatewayInterface` mengatur pembuatan transaksi gateway, pembacaan status, permintaan refund dan verifikasi webhook.
- `CourierProviderInterface` mengatur kuotasi, pembuatan pengiriman, pelacakan dan verifikasi webhook.
- Keduanya mengembalikan array terstruktur, integer rupiah, referensi provider dan waktu UTC berformat `YYYY-MM-DDTHH:mm:ssZ`.
- Mock hanya dapat dibuat dengan lingkungan `development` atau `testing`. Konstruktor menolak `staging` dan `production`; kontrol skenario tidak tersedia dalam interface umum atau route publik.
- Semua hasil mock berisi `provider: mock`, `isSimulation: true` dan referensi berawalan `mock_`. Tidak ada QR pembayaran, rekening, URL transaksi atau nomor resi nyata.
- Mock menyimpan state **di memori satu instance**. Idempotensi lintas proses, event deduplication, audit, saldo stok, izin, persetujuan refund dan penyimpanan pesanan tetap tugas layanan aplikasi M1–M6.

Vendor belum dipilih. `VendorPaymentGatewayAdapter.php` dan `VendorCourierProviderAdapter.php` tetap kerangka; tidak ada URL vendor, kredensial, kontrak SDK atau respons vendor yang dikarang.

## Pembayaran

| Operasi | Masukan | Hasil |
| --- | --- | --- |
| `createPayment` | `idempotencyKey`, `orderReference`, `amountRupiah` positif, `method`, `expiresAt` UTC; `currency` opsional dan hanya `IDR` | `providerReference`, `orderReference`, nominal, `currency`, metode, status awal `MENUNGGU`, `expiresAt`, penanda simulasi. |
| `getStatus` | `providerReference` | Rincian transaksi dengan status provider saat ini. Referensi tidak dikenal menghasilkan `NOT_FOUND`. |
| `requestRefund` | `idempotencyKey`, `providerReference`, `amountRupiah` positif, `reason`; currency bila diberikan wajib IDR | `refundReference`, referensi pembayaran, nominal, currency dan status `DIPROSES`. Penerimaan permintaan bukan bukti transfer berhasil. |
| `verifyWebhook` | Body asli dan header signature | Event terverifikasi yang berisi `eventId`, `eventType`, `occurredAt`, referensi provider/order, nominal, currency dan status. Tidak mengubah data. |

Metode gateway yang diterima kontrak: `QRIS`, `E_WALLET`, `TRANSFER_BANK`, `VIRTUAL_ACCOUNT`. COD tidak dikirim sebagai transaksi gateway. Deadline berasal dari pemanggil berdasarkan kebijakan pesanan; adapter tidak menentukan TTL bisnis baru. Pembuatan transaksi baru dengan deadline lampau ditolak.

Status provider yang dinormalisasi oleh mock: `MENUNGGU`, `BERHASIL`, `GAGAL`, `KEDALUWARSA`, `DIBATALKAN`. Status ini tidak otomatis menetapkan status pesanan atau refund. Mock menolak refund atas pembayaran yang belum berhasil dan nominal yang melebihi sisa nominal; pemeriksaan kebijakan/persetujuan aplikasi harus tetap dilakukan sebelum memanggil vendor nyata.

Hasil pengulangan `createPayment` adalah receipt asli yang sama. Untuk mengetahui perubahan setelah receipt diterbitkan, panggil `getStatus`; jangan menyimpulkan status terkini dari respons creation yang diputar ulang.

## Kurir

| Operasi | Masukan | Hasil |
| --- | --- | --- |
| `quote` | `originArea`, `destinationArea`, `weightGrams` positif, `handlingType` | Daftar quote berisi `quoteReference`, `serviceCode`, `serviceType`, `feeRupiah`, `currency`, `validUntil` dan penanda simulasi. |
| `createShipment` | `idempotencyKey`, `quoteReference`, `orderReference`, `recipientReference` | Referensi pengiriman/tracking, layanan, biaya, status awal `BELUM_DISERAHKAN` dan penanda simulasi. |
| `track` | `providerReference` | Rincian pengiriman dengan status provider saat ini. |
| `verifyWebhook` | Body asli dan header signature | Event terverifikasi berisi identitas event, waktu, referensi dan status; tidak menjalankan transisi pesanan. |

`services` diberikan secara eksplisit melalui fixture saat membuat mock: kode layanan, jenis `INSTAN`/`SAME_DAY`/`REGULER`, integer ongkir dan waktu kedaluwarsa. Tanpa fixture, hasil quote kosong. Fixture kedaluwarsa tidak ditawarkan kembali. Barang `MUDAH_LAYU` tidak memperoleh opsi `REGULER`.

Kode area, tarif dan waktu di tes adalah data sintetis. Mock tidak membuktikan area pengiriman nyata, kuota slot atau SLA. Validasi alamat, isi keranjang campuran, berat/dimensi, tanggal/slot dan aturan pemesanan dilakukan layanan checkout sebelum meminta/menyetujui kuotasi vendor. `recipientReference` adalah referensi data, bukan pengganti pemetaan alamat yang dibutuhkan adapter vendor kelak.

Status pengiriman mengikuti konsep terpisah dalam baseline: `BELUM_DISERAHKAN`, `DALAM_PENGIRIMAN`, `TERKENDALA`, `TERKIRIM`, `DIKEMBALIKAN`.

## Idempotensi dan pemulihan kegagalan

| Kondisi / kode | Retry | Tindakan pemanggil |
| --- | --- | --- |
| `TIMEOUT` | Ya, hasil awal mungkin sudah dibuat provider | Gunakan kembali kunci dan payload yang sama. Cek status/referensi sebelum membuat transaksi/pengiriman lain. |
| `UNAVAILABLE` | Ya, dengan jeda terbatas | Pertahankan input; tawarkan coba lagi. Jangan menampilkan status berhasil. |
| `RATE_LIMITED` | Ya, sesudah jeda | Baca `retryAfterSeconds`; jangan mengulang tanpa batas. Nilai 30 detik pada mock adalah skenario sintetis, bukan parameter operasional vendor. |
| `IDEMPOTENCY_CONFLICT` | Tidak untuk payload berbeda dengan kunci lama | Periksa request semula; gunakan kunci baru hanya untuk operasi baru yang memang dimaksudkan. |
| `INVALID_REQUEST` | Setelah input diperbaiki | Perbaiki field yang disebut; jangan mencetak payload/kredensial ke pesan publik. |
| `NOT_FOUND` | Tidak otomatis | Muat ulang referensi dari sumber aplikasi yang benar; pada mock, pastikan masih memakai instance yang sama. |
| `QUOTE_UNAVAILABLE` / `QUOTE_EXPIRED` | Minta quote baru | Pertahankan konteks belanja dan minta persetujuan ulang bila ongkir berubah. Tidak menciptakan pengiriman memakai quote usang. |
| `REFUND_REJECTED` | Tidak otomatis | Periksa status/nominal tersisa dan kebijakan aplikasi; jangan menandai dana telah kembali. |
| `INVALID_SIGNATURE` / `INVALID_WEBHOOK` / `STALE_WEBHOOK` | Tidak diproses sebagai perubahan bisnis | Tolak event, catat metadata aman dan tindak lanjuti melalui pemantauan sesuai baseline. |

`IntegrationFailure` berisi `errorCode`, `retryable`, `retryAfterSeconds` dan pesan. Exception ini bukan otomatis pemetaan status HTTP; controller aplikasi kelak memetakannya ke format error bersama serta konteks alur.

Kunci idempotensi dibedakan per operasi. Urutan key objek tidak memengaruhi kesetaraan payload. Simulasi dapat gagal sebelum operasi atau setelah provider menyimpan hasil tetapi respons hilang; pengulangan setelah kondisi kedua mengembalikan hasil asli. Adapter tidak melakukan retry tersembunyi yang berpotensi membuat operasi ganda.

## Webhook dan kontrol pengembangan

Mock memakai **protokol tes sendiri**, HMAC-SHA256 atas body mentah dengan header `X-Mock-Signature`. Secret tes minimal 32 karakter; toleransi timestamp wajib diberikan pemanggil. Contoh 300 detik pada fixture bukan penetapan parameter produksi. Parser membatasi ukuran body 64 KiB sebagai batas teknis tes.

Signature diperiksa sebelum parse; timestamp usang maupun terlalu jauh di masa depan ditolak. Nama header tidak peka kapitalisasi. Verifikasi yang lolos tetap tidak mengubah status. Layanan M4 harus melakukan pemeriksaan API provider, nominal/currency/referensi, deduplikasi event dalam database, transisi terotorisasi dan commit sebelum mengirim acknowledgment sukses, mengikuti A.6. Signature vendor nyata harus memakai dokumentasi resmi vendor terpilih.

Kontrol mock: `simulateStatus(reference, status)` dan `failNext(operation, code, afterCommit)`. Keduanya hanya ada pada kelas mock. Fixture kurir dan jam webhook/quote dapat diinjeksi untuk menguji kondisi kedaluwarsa tanpa menunggu waktu sungguhan.

Pemeriksaan: `php tests/integration/provider-contracts.php`. Laporan lokal: `storage/reports/foundation/provider-contracts.json`.
