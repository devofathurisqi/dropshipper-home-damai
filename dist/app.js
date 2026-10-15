import { products } from './products.js';
import config from './config.js';
import { detailCartMarkup, initCart } from './cart-ui.js';
import { rupiah, filterProducts, isArchived, enquiryMessage, whatsappLink, readFavorites } from './catalogue.js';

const $ = (selector, root = document) => root.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>', diagonal: '<path d="M5 19 19 5M5 5h14v14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>', menu: '<path d="M4 8h16M4 16h16"/>',
  plus: '<path d="M5 12h14M12 5v14"/>', check: '<path d="m5 12 4 4L19 6"/>',
  chat: '<path d="M21 11.5a9 9 0 0 1-9.5 9L3 22l1.5-7.5A9 9 0 1 1 21 11.5Z"/><path d="M8 8c0 4 2 6 6 7l2-2-3-1-1 1-2-3 1-1-2-2Z"/>',
  spark: '<path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M7 10.5h7M10.5 7v7"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
const image = (file, alt, classes = '', eager = false) => `<img src="assets/images/${escape(file)}" alt="${escape(alt)}" class="${classes}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>`;
const logo = () => '<span class="brand-logo"><img src="assets/home-damai-original.jpeg" alt="Home Damai, estd 2026" width="1600" height="1600"></span>';
const generalContact = whatsappLink(config.whatsapp, 'Halo Home Damai, saya ingin bertanya tentang koleksi hijab dan mukena.');
const categories = ['Semua', ...new Set(products.map(p=>p.category))];
let favorites;
try { favorites = readFavorites(localStorage, config.storageKey, products); } catch { favorites = []; }
let state = { query: '', category: 'Semua', sort: 'curated', budget: 'all', expanded: false };
let selectedProduct = null, selectedVariant = null, currentImage = null;
let toastTimer;
const counts = category => products.filter(p=>p.category===category).length;
const find = id => products.find(p=>p.id===id);
const featuredIds = ['viscose-gradasi','modal-viscose','hayla-khiban','printed-viscose'];
const orderedProducts = [...featuredIds.map(find), ...products.filter(p=>!featuredIds.includes(p.id))];
const cover = p => p.id==='viscose-gradasi' ? 'gradasi-burnt-maho.webp' : p.id==='printed-viscose' ? 'ppv-e3.webp' : p.images[0];

function card(p) {
  const count = p.variants.filter(v=>!isArchived(v) && v.variantType!=='consultation').length;
  return `<article class="product-card" data-product="${p.id}">
    <div class="product-photo">
      <a href="#produk/${p.id}" class="photo-link" aria-label="Lihat ${escape(p.name)}">${image(cover(p),p.name,p.contain?'contain':'')}<span class="photo-cta">Kenali lebih dekat ${icon('diagonal')}</span></a>
      ${p.availability==='coming-soon'?'<span class="badge">Segera hadir</span>':featuredIds.indexOf(p.id)===0?'<span class="badge">The signature edit</span>':''}
      <button class="favorite-button icon-button ${favorites.includes(p.id)?'saved':''}" data-save="${p.id}" aria-label="Simpan ${escape(p.name)}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button>
    </div>
    <div class="product-meta"><span>${escape(p.category)}</span><span>${count ? count+' pilihan' : 'Pilihan via admin'}</span></div>
    <a class="product-name" href="#produk/${p.id}">${escape(p.name)}</a>
    <div class="product-bottom"><span>${rupiah(p.price)}</span><a href="#produk/${p.id}" aria-label="Detail ${escape(p.name)}">${icon('arrow')}</a></div>
  </article>`;
}

$('#app').innerHTML = `
  <div class="announcement"><span>Ruang kecil, untuk rasa nyaman yang besar.</span><span>KOLEKSI VUYAMA, PILIHAN HOME DAMAI ${icon('spark')}</span></div>
  <header class="site-header">
    <nav class="desktop-nav" aria-label="Navigasi utama"><a href="#koleksi">Koleksi ${icon('plus')}</a><a href="#cerita">Cerita kami</a><a href="#panduan">Panduan</a></nav>
    <button class="icon-button menu-toggle" aria-label="Buka menu" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}</button>
    <a href="#beranda" class="brand" aria-label="Home Damai — Beranda">${logo()}</a>
    <div class="header-actions"><button class="icon-button" data-action="search" aria-label="Cari koleksi">${icon('search')}</button><button class="icon-button favorite-nav" data-action="favorites" aria-label="Buka favorit">${icon('heart')}<span class="favorite-count">${favorites.length}</span></button><a class="contact-link" href="${generalContact}" target="_blank" rel="noopener">Mari ngobrol ${icon('diagonal')}</a></div>
  </header>
  <nav id="mobile-nav" class="mobile-nav" aria-label="Navigasi ponsel" hidden><a href="#koleksi">Jelajahi koleksi ${icon('arrow')}</a><a href="#cerita">Cerita Home Damai ${icon('arrow')}</a><a href="#panduan">Panduan memilih ${icon('arrow')}</a><a href="${generalContact}" target="_blank" rel="noopener">WhatsApp Home Damai ${icon('diagonal')}</a></nav>
  <main id="main-content">
    <section class="hero" id="beranda" aria-labelledby="hero-title">
      <div class="hero-copy"><div class="eyebrow"><span class="tiny-star">✳</span> A LITTLE COMFORT, EVERY DAY</div>
        <h1 id="hero-title">Nyaman<br>menjadi<br><em>diri sendiri.</em></h1>
        <p>Tak perlu berlebihan untuk terasa istimewa.<br>Temukan hijab yang menemani harimu,<br>dengan cara yang paling kamu.</p>
        <a href="#koleksi" class="button button-dark">Temukan pilihanmu <span>${icon('diagonal')}</span></a>
        <div class="hero-footnote"><span class="small-line"></span> Hijab, mukena, dan rasa nyaman.</div>
      </div>
      <div class="hero-visual">${image('gradasi-cream.webp','Koleksi Viscose Gradasi warna Creamy Nude dari Vuyama','hero-image',true)}
        <div class="hero-photo-label"><span>THE EVERYDAY COLLECTION</span><span>01 / 03</span></div>
        <div class="hero-stamp"><span>FEEL GOOD</span>${icon('spark')}<span>BE YOU</span></div>
        <a class="hero-product" href="#produk/viscose-gradasi"><div><small>KENALI YANG KAMU LIHAT</small><strong>Viscose Gradasi <span>— ${rupiah(find('viscose-gradasi').price)}</span></strong></div><span class="round-arrow">${icon('diagonal')}</span></a>
        <div class="hero-controls" aria-label="Pilihan foto koleksi"><button class="active" data-slide="0" aria-label="Lihat foto Creamy Nude" aria-pressed="true"></button><button data-slide="1" aria-label="Lihat foto Burnt Maho" aria-pressed="false"></button><button data-slide="2" aria-label="Lihat foto Cosmic Mauve" aria-pressed="false"></button></div>
      </div>
    </section>
    <div class="values-strip"><span>${icon('spark')} Pilihan untuk setiap hari</span><span>${icon('spark')} Koleksi dari Vuyama</span><span>${icon('spark')} Harga eceran, apa adanya</span><span>${icon('spark')} Temukan warna ceritamu</span></div>
    <section class="category-section section-shell" aria-labelledby="category-heading"><div class="mini-section-heading"><h2 id="category-heading">Setiap hari, punya pilihannya.</h2><span>MULAI DARI YANG KAMU SUKA</span></div><div class="category-grid">${[['Pashmina','01'],['Instan','02'],['Segi Empat','03'],['Mukena','04']].map(([c,n])=>`<a href="#koleksi" data-category-link="${c}" class="category-link"><span class="category-number">${n}</span><span>${c==='Instan'?'Hijab Instan':c}<small>${counts(c)} koleksi</small></span>${icon('diagonal')}</a>`).join('')}</div></section>
    <section class="catalog section-shell" id="koleksi" aria-labelledby="catalog-heading">
      <div class="section-heading"><div><p class="eyebrow">THE HOME DAMAI EDIT</p><h2 id="catalog-heading">Pilihan yang terasa <em>kamu.</em></h2></div><p>Warna yang kamu suka.<br>Detail yang bikin jatuh hati.</p></div>
      <div class="catalog-toolbar"><div class="category-tabs" role="group" aria-label="Kategori koleksi">${categories.map(c=>`<button data-category="${c}" class="${c==='Semua'?'active':''}" aria-pressed="${c==='Semua'}">${c==='Instan'?'Hijab Instan':c}</button>`).join('')}</div><button class="search-toggle icon-button" data-action="search" aria-label="Cari di katalog">${icon('search')}</button></div>
      <div class="catalog-controls"><label class="search-field">${icon('search')}<input id="catalog-search" type="search" placeholder="Cari hijab, bahan, atau warna…" aria-label="Cari produk, bahan, atau warna"><button class="icon-button" data-action="clear-search" aria-label="Hapus pencarian" hidden>${icon('close')}</button></label><div class="select-controls"><label><span class="sr-only">Filter harga</span><select id="budget"><option value="all">Semua harga</option><option value="under50">Di bawah Rp50.000</option><option value="50to100">Rp50.000–100.000</option><option value="over100">Di atas Rp100.000</option></select></label><label><span class="sr-only">Urutkan koleksi</span><select id="sort"><option value="curated">Pilihan Home Damai</option><option value="low">Harga terendah</option><option value="high">Harga tertinggi</option><option value="name">Nama A–Z</option></select></label></div></div>
      <div class="results-row"><p id="results-count" aria-live="polite"></p><button class="text-button" data-action="reset" hidden>Reset filter ${icon('close')}</button></div>
      <div id="product-grid" class="product-grid"></div><div class="catalog-more"><button class="button button-outline" data-action="more">Lihat seluruh koleksi ${icon('arrow')}</button></div>
      <p class="price-note">Harga eceran mengacu pada katalog Vuyama ${config.priceEdition}. Ketersediaan warna dan harga akhir dikonfirmasi melalui Home Damai.</p>
    </section>
    <section class="editorial section-shell" aria-labelledby="editorial-title"><div class="editorial-intro"><p class="eyebrow">SMALL MOMENTS, BEAUTIFUL DETAILS</p><h2 id="editorial-title">Untuk hari biasa.<br>Untuk rasa <em>luar biasa.</em></h2></div><div class="editorial-grid"><a href="#produk/printed-viscose" class="editorial-photo">${image('ppv-e3.webp','Pashmina Printed Viscose dengan motif lembut')}<div class="editorial-caption"><div><span>01 — A TOUCH OF PATTERN</span><h3>Sedikit motif.<br>Banyak cerita.</h3></div><span class="round-arrow">${icon('diagonal')}</span></div></a><a href="#produk/mukena-segenggam-polos" class="editorial-mukena"><div><span class="eyebrow">02 — A MOMENT OF PEACE</span><h3>Sejenak hening.<br>Sepenuh <em>damai.</em></h3><p>Temukan koleksi mukena untuk<br>menemani waktu paling personal.</p><span class="underlined-link">Jelajahi Mukena ${icon('diagonal')}</span></div>${image('segenggam-polos.webp','Mukena Segenggam Polos dari Vuyama')}</a></div></section>
    <section class="story" id="cerita" aria-labelledby="story-title"><div class="story-mark"><span class="eyebrow">A PLACE TO FEEL LIKE YOU</span>${logo()}<span>EST. 2026 &nbsp; / &nbsp; MADE FOR YOUR EVERYDAY</span></div><div class="story-copy"><p class="eyebrow">KENALAN DENGAN HOME DAMAI</p><h2 id="story-title">Bukan sekadar dipakai.<br>Tapi terasa <em>seperti rumah.</em></h2><p>Kami percaya, hal-hal sederhana bisa membuat hari terasa lebih baik. Warna yang pas, pilihan yang personal, dan ruang untuk menjadi diri sendiri.</p><p>Home Damai adalah rumah pilihan hijab dan mukena dari Vuyama. Kami hadir sebagai dropshipper, mendekatkan koleksi Vuyama kepadamu dengan informasi produk yang jelas dan harga eceran yang sama.</p><a href="${generalContact}" class="underlined-link" target="_blank" rel="noopener">Senang bisa kenalan denganmu ${icon('diagonal')}</a></div></section>
    <section class="guide section-shell" id="panduan" aria-labelledby="guide-title"><div><p class="eyebrow">LET’S MAKE IT SIMPLE</p><h2 id="guide-title">Memilih jadi<br>lebih <em>mudah.</em></h2><p>Kenali dulu. Suka kemudian.<br>Kami bantu menemukan pilihanmu.</p><a href="${generalContact}" class="button button-dark" target="_blank" rel="noopener">Tanya Home Damai ${icon('chat')}</a></div><div class="faq"><details open><summary><span>01</span> Bagaimana cara memilih dan memesan? ${icon('plus')}</summary><p>Pilih produk, warna atau seri, dan jumlahnya, lalu klik “Tambah ke keranjang”. Buka keranjang untuk memeriksa pilihanmu, lanjutkan ke checkout, dan isi data pengiriman. Klik “Lanjutkan ke WhatsApp” untuk membuka pesan berisi rincian pesanan otomatis. Periksa pesannya, lalu kirim ke Home Damai untuk konfirmasi stok, ongkir, dan pembayaran.</p></details><details><summary><span>02</span> Apakah harganya sama dengan Vuyama? ${icon('plus')}</summary><p>Ya, harga yang tercantum mengikuti harga eceran pada katalog Vuyama ${config.priceEdition}. Untuk koleksi tanpa harga tercantum, silakan tanyakan kepada kami. Harga akhir dan ongkir dikonfirmasi sebelum pemesanan.</p></details><details><summary><span>03</span> Apakah semua warna selalu tersedia? ${icon('plus')}</summary><p>Foto dan pilihan warna adalah referensi koleksi, bukan stok langsung. Ketersediaan setiap warna atau seri perlu dikonfirmasi. Tampilan warna juga dapat sedikit berbeda karena layar dan pencahayaan.</p></details><details><summary><span>04</span> Masih bingung memilih bahan atau warna? ${icon('plus')}</summary><p>Simpan produk yang kamu suka dengan tombol hati, lalu lihat kembali di Favorit. Ceritakan kebutuhan dan warna yang kamu cari melalui WhatsApp agar kami bisa membantu mencocokkan pilihan.</p></details></div></section>
    <section class="closing"><span class="tiny-star">✳</span><p>Pelan-pelan saja.<br>Temukan yang paling <em>kamu.</em></p><a href="#koleksi" class="round-arrow" aria-label="Kembali jelajahi koleksi">${icon('diagonal')}</a></section>
  </main>
  <footer class="site-footer"><div class="footer-top"><a href="#beranda" class="footer-brand" aria-label="Home Damai — kembali ke beranda">${logo()}</a><p>Rumah untuk pilihanmu.<br>Nyaman, dengan caramu sendiri.</p><div><span class="eyebrow">JELAJAHI</span><a href="#koleksi">Koleksi</a><a href="#cerita">Cerita kami</a><a href="#panduan">Panduan</a></div><div><span class="eyebrow">MARI TERHUBUNG</span><a href="${generalContact}" target="_blank" rel="noopener">WhatsApp ${icon('diagonal')}</a><span>${config.whatsappDisplay}</span></div></div><div class="footer-bottom"><span>© 2026 Home Damai.</span><span>Koleksi Vuyama · Dikurasi oleh Home Damai</span><a href="#beranda">Kembali ke atas ↑</a></div></footer>`;

function renderProducts() {
  const matches = filterProducts(orderedProducts, state);
  const visible = state.expanded ? matches : matches.slice(0,8);
  $('#product-grid').innerHTML = visible.length ? visible.map(card).join('') : `<div class="empty-state">${icon('search')}<h3>Belum ketemu yang pas?</h3><p>Coba kata kunci lain atau reset filter untuk melihat koleksi lainnya.</p><button class="button button-dark" data-action="reset">Lihat semua koleksi ${icon('arrow')}</button></div>`;
  $('#results-count').textContent = `${visible.length} dari ${matches.length} koleksi${state.query ? ' untuk “'+state.query+'”' : ''}`;
  $('[data-action="more"]').hidden = matches.length <= visible.length;
  const filtered = state.query || state.category!=='Semua' || state.budget!=='all' || state.sort!=='curated';
  $('.results-row [data-action="reset"]').hidden = !filtered;
  $('[data-action="clear-search"]').hidden = !state.query;
  document.querySelectorAll('[data-category]').forEach(b=>{const active=b.dataset.category===state.category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
}
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent=message; $('#toast').classList.add('show'); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000); }
function toggleFavorite(id) {
  favorites = favorites.includes(id) ? favorites.filter(f=>f!==id) : [...favorites,id];
  let persisted = true; try { localStorage.setItem(config.storageKey,JSON.stringify(favorites)); } catch { persisted=false; }
  document.querySelectorAll(`[data-save="${id}"]`).forEach(b=>{b.classList.toggle('saved',favorites.includes(id)); b.setAttribute('aria-pressed',favorites.includes(id));});
  $('.favorite-count').textContent=favorites.length;
  if($('#favorites-dialog').open) renderFavorites();
  toast((favorites.includes(id)?'Ditambahkan ke favorit':'Dihapus dari favorit')+(!persisted?' · hanya untuk sesi ini':''));
}
const closeButton = label => `<button class="close-dialog icon-button" data-close aria-label="${label}">${icon('close')}</button>`;
function renderFavorites() {
  $('#favorites-dialog').innerHTML=`${closeButton('Tutup favorit')}<p class="eyebrow">YOUR PERSONAL EDIT</p><h2 id="favorites-title">Pilihan <em>favoritmu.</em></h2><p class="muted">Simpan dulu, temukan yang paling kamu.</p>${favorites.length?`<div class="favorites-grid">${favorites.map(id=>card(find(id))).join('')}</div>`:`<div class="empty-state">${icon('heart')}<h3>Ruang untuk yang kamu suka.</h3><p>Ketuk ikon hati pada produk untuk menyimpannya di sini.</p><button class="button button-dark" data-close>Mulai jelajahi ${icon('arrow')}</button></div>`}`;
}
function productGallery(p) { return [...new Set([...p.images,...p.referenceImages,...p.variants.filter(v=>v.imageIsExact && !isArchived(v)).map(v=>v.image)].filter(Boolean))]; }
function openProduct(id) {
  const p=find(id); if(!p) { toast('Koleksi tidak ditemukan.'); return; }
  if($('#favorites-dialog').open) $('#favorites-dialog').close();
  selectedProduct=p; selectedVariant=null; currentImage=cover(p);
  const gallery=productGallery(p);
  $('#product-dialog').innerHTML=`${closeButton('Tutup detail produk')}<div class="product-detail"><div class="detail-gallery"><button class="main-photo" data-action="zoom" aria-label="Perbesar foto ${escape(p.name)}">${image(currentImage,p.name,p.contain?'contain':'',true)}<span>${icon('zoom')}</span></button><div class="gallery-thumbs" aria-label="Foto produk">${gallery.map((f,i)=>`<button data-gallery="${i}" aria-label="Foto ${i+1}: ${escape(p.name)}" aria-pressed="${f===currentImage}">${image(f,'')}</button>`).join('')}</div></div><div class="detail-copy"><p class="eyebrow">HOME DAMAI / ${escape(p.category)}</p><h2 id="product-title">${escape(p.name)}</h2><p class="detail-price">${rupiah(p.price)}${p.price!==null?'<small> / pcs</small>':''}</p><p class="detail-description">${escape(p.description)}</p><div class="specs"><div><span>Material</span><strong>${escape(p.material || 'Konfirmasi melalui admin')}</strong></div>${p.size?`<div><span>Ukuran</span><strong>${escape(p.size)}</strong></div>`:''}<div><span>Koleksi</span><strong>Vuyama</strong></div></div><div class="variant-heading"><strong>Pilih warna / seri</strong><span id="selected-variant">Belum dipilih</span></div><div class="variant-list" role="group" aria-label="Pilihan warna dan seri">${p.variants.map(v=>`<button data-variant="${escape(v.id)}" aria-pressed="false" ${isArchived(v)?'disabled':''}>${v.image && v.imageIsExact?image(v.image,''):''}<span>${escape(v.name)}${isArchived(v)?' · Arsip / habis':''}</span></button>`).join('')}</div><p class="variant-note" id="variant-note">Pilih warna atau seri sebelum menambahkan ke keranjang.</p>${detailCartMarkup(p)}<div class="detail-actions">${p.availability==='coming-soon'?'<span class="button unavailable">Segera hadir</span>':`<a class="button button-dark" id="product-enquiry" href="${whatsappLink(config.whatsapp,enquiryMessage(p,null))}" target="_blank" rel="noopener">Tanyakan via WhatsApp ${icon('chat')}</a>`}<button class="icon-button detail-save ${favorites.includes(p.id)?'saved':''}" data-save="${p.id}" aria-label="Simpan ${escape(p.name)}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button></div><p class="stock-note">${icon('check')} ${p.availability==='coming-soon'?'Koleksi ini belum tersedia untuk dipesan.':'Stok, warna, dan ongkir dikonfirmasi melalui WhatsApp.'}</p><details class="detail-info"><summary>Tentang harga & foto ${icon('plus')}</summary><p>Harga eceran mengikuti katalog Vuyama ${config.priceEdition}. Foto merupakan referensi produk; warna di layar bisa berbeda. Foto seri atau kartu warna belum tentu menampilkan satu varian saja. ${p.photoStatus?'Foto produk spesifik belum tersedia. ':''}${escape(p.priceNote || '')}</p></details></div></div>`;
  if(!$('#product-dialog').open) $('#product-dialog').showModal();
  $('#product-dialog').scrollTop=0;
}
function selectVariant(id) {
  const v=selectedProduct.variants.find(v=>v.id===id); if(!v || isArchived(v)) return;
  selectedVariant=v;
  $('#selected-variant').textContent=v.name;
  $('#variant-note').textContent=v.note || (v.imageIsExact ? 'Foto menampilkan pilihan ini. Ketersediaan dikonfirmasi saat konsultasi.' : 'Foto adalah referensi koleksi. Detail pilihan dikonfirmasi melalui admin.');
  document.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.variant===id));
  if(v.image) setProductImage(v.image, v.imageIsExact ? `${selectedProduct.name} — ${v.name}` : `Referensi ${selectedProduct.name}`);
  if($('#product-enquiry')) $('#product-enquiry').href=whatsappLink(config.whatsapp,enquiryMessage(selectedProduct,v));
}
function setProductImage(file,alt) {
  currentImage=file; const img=$('.main-photo img');img.src='assets/images/'+file;img.alt=alt;
  const gallery=productGallery(selectedProduct);document.querySelectorAll('[data-gallery]').forEach(b=>b.setAttribute('aria-pressed',gallery[Number(b.dataset.gallery)]===file));
}
function resetFilters() { state={query:'',category:'Semua',sort:'curated',budget:'all',expanded:false};$('#catalog-search').value='';$('#sort').value='curated';$('#budget').value='all';renderProducts(); }
function handleRoute() {
  if(location.hash.startsWith('#produk/')) { openProduct(decodeURIComponent(location.hash.slice(8))); return; }
  if($('#product-dialog').open) $('#product-dialog').close();
}
document.addEventListener('click', e=>{
  const close=e.target.closest('[data-close]'); if(close){close.closest('dialog').close();return;}
  const save=e.target.closest('[data-save]');if(save){toggleFavorite(save.dataset.save);return;}
  const variant=e.target.closest('[data-variant]');if(variant){selectVariant(variant.dataset.variant);return;}
  const gallery=e.target.closest('[data-gallery]');if(gallery){setProductImage(productGallery(selectedProduct)[Number(gallery.dataset.gallery)],selectedProduct.name);return;}
  const slide=e.target.closest('[data-slide]');if(slide){const i=Number(slide.dataset.slide),files=['gradasi-cream.webp','gradasi-burnt-maho.webp','gradasi-cosmic-mauve.webp'],names=['Creamy Nude','Burnt Maho','Cosmic Mauve'];$('.hero-image').src='assets/images/'+files[i];$('.hero-image').alt='Viscose Gradasi warna '+names[i];$('.hero-photo-label span:last-child').textContent=`0${i+1} / 03`;document.querySelectorAll('[data-slide]').forEach(b=>{b.classList.toggle('active',b===slide);b.setAttribute('aria-pressed',b===slide);});return;}
  const cat=e.target.closest('[data-category]');if(cat){state.category=cat.dataset.category;state.expanded=true;renderProducts();return;}
  const catLink=e.target.closest('[data-category-link]');if(catLink){state.category=catLink.dataset.categoryLink;state.expanded=true;renderProducts();}
  const menu=e.target.closest('.menu-toggle');if(menu){const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',!open);menu.setAttribute('aria-label',open?'Buka menu':'Tutup menu');$('#mobile-nav').hidden=open;return;}
  if(e.target.closest('#mobile-nav a')) {$('#mobile-nav').hidden=true;$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle').setAttribute('aria-label','Buka menu');}
  const productLink=e.target.closest('a[href^="#produk/"]');if(productLink && productLink.hash===location.hash){e.preventDefault();openProduct(productLink.hash.slice(8));}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='search') {location.hash='koleksi';$('#catalog-search').focus({preventScroll:true});$('#koleksi').scrollIntoView({behavior:'smooth'});}
  if(action==='favorites'){renderFavorites();$('#favorites-dialog').showModal();}
  if(action==='reset') resetFilters();
  if(action==='clear-search') {state.query='';$('#catalog-search').value='';renderProducts();$('#catalog-search').focus();}
  if(action==='more'){state.expanded=true;renderProducts();}
  if(action==='zoom') {$('#zoom-dialog').innerHTML=`${closeButton('Tutup foto')}<img src="assets/images/${escape(currentImage)}" alt="${escape(selectedProduct.name)}"><p>${escape(selectedProduct.name)} · Foto referensi koleksi</p>`;$('#zoom-dialog').showModal();}
});
$('#catalog-search').addEventListener('input',e=>{state.query=e.target.value;state.expanded=true;renderProducts();});
$('#sort').addEventListener('change',e=>{state.sort=e.target.value;renderProducts();});
$('#budget').addEventListener('change',e=>{state.budget=e.target.value;state.expanded=true;renderProducts();});
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
});
$('#product-dialog').addEventListener('close',()=>{if(location.hash.startsWith('#produk/')) history.replaceState(null,'',location.pathname+location.search+'#koleksi');});
window.addEventListener('hashchange',handleRoute);
window.addEventListener('storage',e=>{if(e.key===config.storageKey){try{favorites=readFavorites(localStorage,config.storageKey,products);}catch{favorites=[];}renderProducts();$('.favorite-count').textContent=favorites.length;}});
initCart({ getSelection: () => ({ product: selectedProduct, variant: selectedVariant }), notify: toast });
renderProducts(); handleRoute();

