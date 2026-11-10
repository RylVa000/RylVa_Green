# Polish mockup Dashboard Admin

Alur: Impeccable polish dan built-in image_gen (edit). Target: `admin-dashboard-desktop.png`. Acuan: DESIGN.md, PRODUCT.md, dan docs/specifications/spesifikasi-proyek-v2.6.md. Lingkup berupa gambar desktop statis; pemeriksaan interaksi, keyboard, responsivitas, dan aksesibilitas implementasi memerlukan UI yang berfungsi.

```text
Use case: ui-mockup refinement.
Input image: EDIT TARGET, existing RylVa Green desktop Admin dashboard. This is a constrained polish pass, not a redesign. Preserve the exact existing botanical identity, deep-green sidebar, cream main canvas, desktop composition, all navigation, every panel, every data value, every DEMO identifier, all task categories, and the product content. Keep a single flat desktop screenshot at the same aspect ratio with every edge and footer visible.

Implement only these refinements:
1. Improve readability and consistency: use Poppins throughout, weights 400/500/600/700. All panel headings, table primary text, task titles, amounts and meaningful secondary descriptions must use primary-dark #0F2A1D on pale surfaces. Smaller important captions (slot times, owners, remaining time, sample notices, SKU details and action labels) should be visibly larger and darker than the original, with ample line height. Use muted #718096 only for nonessential text that remains readable. Do not let any label overflow or collide.
2. Precisely align the four summary panels: equal internal padding, their headings on the same baseline, their large numbers 12 / 8 / 3 / 4 on the same baseline at the same size, the descriptor on a separate line below each number, and action links on a common bottom baseline. Preserve the first dark-green summary card with white text and the other three pale cards. Preserve the actual headings and numbers, with the same meanings.
3. Align table columns, row heights and action buttons rigorously. Provide comfortable space around "COD · Menunggu". Keep "Status pesanan" and "Pembayaran" as separate columns. Every row DEMO-001 / DEMO-002 / DEMO-003 remains "Siap Diproses", with payment "Berhasil" / "COD · Menunggu" / "Berhasil" respectively. Keep all table content and slot times, with no substituted or invented data.
4. Refine "Perlu ditindaklanjuti": keep its enclosing panel, the same four existing tasks and exact owners, remaining times and actions, but replace the four little nested rounded boxes with four clean flat rows separated by fine sage rules. Align all task icons, text columns, and equal-height action buttons. Keep comfortable breathing room, no new task or claim.
5. Use consistent flat fills, removing the faint gradients on the sidebar and first summary card: sidebar #0F2A1D, first summary card #375534, background #FBF7F4, light panels #F8F9FA. Fine separators #AEC3B0, restrained 12px outer panel corners. Use only one subtle border for light panels, no decorative shadow. Sidebar active marker is a precise 1px line plus active background and active text, keeping the selected "Dashboard". Preserve the original wordmark and botanical icon.
6. All section headings should have consistent Poppins semibold weight, size and primary-dark color. The page title stays prominent, with slightly more relaxed letter spacing. Keep the hierarchy quiet, practical and botanical. Preserve current overall panel positions and proportions.

Exact text and content that MUST remain:
"Dashboard Admin", "Pantau pesanan dan tindak lanjut operasional.", "MOCKUP · DATA ILUSTRASI", "Seluruh angka, produk, dan pesanan di layar ini hanya contoh, bukan data toko sebenarnya."
All sidebar menu entries, "Hari ini · WIB", "Admin Demo", role "Admin".
Summary values 12 / 8 / 3 / 4, sample-count descriptors and existing action labels.
All DEMO-001 through DEMO-006 references and their matching content.
Payment-review notice "Penyelesaian rekonsiliasi oleh SuperAdmin."
Stocks: Monstera DEMO-M01 2 pot, Sirih gading DEMO-S01 3 pot, Pot terakota DEMO-P01 4 unit, Media tanam DEMO-T01 1 sak. Keep the threshold 5 unit.
Footer "Pratinjau desain • Data ilustrasi".
Status and payment must remain distinct, and the COD payment remains "Menunggu".

Allowed palette ONLY: #0F2A1D, #375534, #6B9071, #AEC3B0, #FBF7F4, #F8F9FA, #718096, #CDCFCC, white #FFFFFF. No red, amber, yellow, purple or blue accents. Use dark-green warning icons and explicit status labels. No new financial metrics, graphs, customer data, menu functions, photography, marketing claims, decorative plants or UI controls. No device frame, no surrounding presentation. Produce one crisp high-resolution polished desktop mockup.
```
