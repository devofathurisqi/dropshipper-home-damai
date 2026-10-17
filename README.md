# Home Damai

Website katalog dropshipper Vuyama dengan identitas Home Damai. Dibuat di folder ini; proyek referensi tidak diubah.

## Menjalankan

Memerlukan Node.js modern (20+). Tidak ada dependensi npm atau proses build.

```powershell
cd C:\project-devo\dropshipper_catalog_vuyama\home_damay_150_1
npm run dev
```

Buka http://127.0.0.1:4330. Hentikan dengan Ctrl+C. Folder `dist` adalah hasil siap hosting statis; jangan membuka `index.html` lewat file:// karena menggunakan ES modules.

## Isi website

- 24 koleksi, 317 entri warna/seri dari katalog lokal Vuyama.
- Harga eceran sesuai sumber; tidak memuat paket usaha atau harga grosir.
- Pencarian produk, bahan, warna; kategori, filter harga, pengurutan, favorit lokal.
- Detail produk dengan galeri, pilihan warna, perbesar foto, dan tautan WhatsApp berisi pilihan pelanggan.
- Keranjang untuk beberapa produk/warna, pengaturan jumlah, hapus item, dan subtotal harga eceran. Pilihan tersimpan di browser setelah refresh.
- Checkout dengan data penerima, alamat, kurir pilihan, catatan, serta pratinjau pesan. Tombol checkout membuka WhatsApp Home Damai dengan seluruh rincian otomatis; pelanggan memeriksa lalu mengirim pesannya di WhatsApp.
- Nomor Home Damai: **085701983872**. Konfigurasi utama di `dist/config.js`. Instagram belum ditampilkan karena belum diberikan.
- Tata letak responsif, dialog native, label aksesibel, dukungan reduced motion.

## Memperbarui katalog

Sumber: `../../vuyama-catalog/dist/products.js`, harga edisi September 2026 dengan audit lokal 15 Oktober 2026. Setelah sumber diperbarui:

```powershell
npm run import
npm test
npm run check
```

Import menyalin data konsumen dan aset yang dibutuhkan. Pastikan `priceEdition` di `dist/config.js` sesuai edisi terbaru. Harga dan stok bukan sinkronisasi langsung. Harga yang belum ada tampil sebagai “Tanyakan harga”, seri arsip/habis dinonaktifkan, dan produk segera hadir tidak memiliki CTA pemesanan.

`tests/catalogue.test.mjs` membandingkan harga terhadap proyek sumber, sehingga pengujian integritas memerlukan folder referensi tersebut. Website hasil `dist` tetap mandiri.

## Berkas utama

- `dist/app.js`: tampilan dan interaksi.
- `dist/styles.css`: desain dan responsivitas.
- `dist/catalogue.js`: filter, harga, favorit, dan pesan WhatsApp.
- `dist/cart.js`: validasi keranjang, perhitungan subtotal, dan format pesan pesanan.
- `dist/cart-ui.js` dan `dist/cart.css`: keranjang serta formulir checkout responsif.
- `dist/products.js`: hasil import katalog.
- `ASSET-SOURCES.md`: asal data dan aset.
- `qa/`: bukti tampilan dan pemeriksaan.

Website disiapkan secara lokal. Domain, hosting publik, stok langsung, dan pembayaran online tidak dikonfigurasi.

Keranjang menyimpan ID produk, ID varian, dan jumlah di localStorage. Data penerima hanya berada dalam memori halaman, tidak disimpan permanen. Harga yang belum tersedia ditandai untuk konfirmasi admin dan tidak dianggap gratis. Ongkir dikonfirmasi admin. Keranjang tidak dikosongkan ketika WhatsApp dibuka, karena membuka pesan belum berarti pesanan sudah dikirim.
