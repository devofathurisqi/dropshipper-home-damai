# Pemeriksaan Home Damai

Tanggal: 15 Oktober 2026.

- `npm test`: 14 pengujian lulus, mencakup kesamaan seluruh harga eceran dengan sumber, 24 koleksi/317 varian, ketersediaan berkas gambar, filter, pengurutan, favorit, WhatsApp, pembatasan seri arsip/produk segera hadir, penggabungan keranjang per warna, batas jumlah, data penyimpanan rusak, harga belum tersedia, serta validasi penerima dan format pesanan.
- `npm run check`: pemeriksaan sintaks JavaScript lulus.
- Browser: halaman dan detail produk berhasil dimuat; pilihan Creamy Nude menghasilkan tautan ke 6285198361315 dengan produk, warna, dan harga Rp99.000. Tidak mengirim pesan.
- Pencarian tanpa hasil menampilkan keadaan kosong dan tombol reset bekerja.
- Favorit dapat disimpan, dibuka, dan dihapus.
- Menu mobile dapat dibuka dan ditutup.
- Lebar 390 dan 1440 piksel diperiksa; tidak ada overflow horizontal halaman. Tidak ditemukan gambar gagal dimuat pada pemeriksaan browser.
- Peninjauan visual dilakukan pada hero, katalog, editorial, cerita brand, FAQ, footer, serta dialog produk.
- Alur keranjang diperiksa di browser: pilih Creamy Nude, tambah 2 pcs, subtotal Rp198.000; naik menjadi 3 pcs menghasilkan Rp297.000 dan tetap 3 pcs setelah refresh; turun kembali menjadi 2 pcs menghasilkan Rp198.000.
- Form checkout diisi dengan data uji. Pratinjau pesan memuat produk, warna, 2 pcs, harga Rp99.000/pcs, subtotal Rp198.000, nama, nomor WhatsApp, alamat, kota, dan J&T Express. Form memenuhi validasi browser. Tidak mengirim pesan atau membuat pesanan nyata.
- Dialog checkout pada viewport mobile tidak memiliki overflow horizontal (clientWidth dan scrollWidth sama, 343 piksel). Tampilan keranjang mobile dan checkout desktop 1440 × 1000 disimpan dalam `cart-mobile.jpg` dan `checkout-desktop.jpg`.

Batas pemeriksaan: browser desktop dengan simulasi viewport mobile, bukan perangkat fisik. Harga bersumber dari katalog lokal, stok akhir dikonfirmasi melalui WhatsApp.
