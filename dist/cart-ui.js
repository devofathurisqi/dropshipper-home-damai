import { products } from './products.js';
import config from './config.js';
import { rupiah, whatsappLink } from './catalogue.js';
import { readCart, addItem, cartLines, totals, quantity } from './cart.js';
import { orderMessage } from './cart.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const closeButton = label => `<button class="icon-button order-close" data-close aria-label="${label}">✕</button>`;
const bag = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>';

export function detailCartMarkup(product) {
  if (product.availability === 'coming-soon') return '';
  return `<div class="detail-order"><label for="detail-quantity">Jumlah</label><div class="detail-order-controls"><div class="quantity-control"><button type="button" data-detail-step="-1" aria-label="Kurangi jumlah">−</button><input id="detail-quantity" type="number" min="1" max="99" step="1" value="1" inputmode="numeric"><button type="button" data-detail-step="1" aria-label="Tambah jumlah">+</button></div><button class="button button-dark" data-order-action="add">${bag} Tambah ke keranjang</button></div><p id="add-feedback" role="status"></p><button class="text-button" data-order-action="cart">Lihat keranjang →</button></div>`;
}

export function initCart({ getSelection, notify }) {
  let cart;
  try { cart = readCart(localStorage, config.cartStorageKey, products); } catch { cart = []; }
  let customer = {};
  $('.header-actions').insertAdjacentHTML('beforeend', `<button class="icon-button cart-trigger" data-order-action="cart" aria-label="Buka keranjang">${bag}<span class="cart-count" hidden></span></button>`);

  function updateBadge() {
    const count = totals(cart, products).count;
    $('.cart-count').textContent = count;
    $('.cart-count').hidden = !count;
  }
  function persist() {
    try { localStorage.setItem(config.cartStorageKey, JSON.stringify(cart)); }
    catch { notify('Keranjang hanya tersimpan selama halaman ini terbuka.'); }
    updateBadge();
  }
  function summary() {
    const sum = totals(cart, products);
    const label = sum.pending ? 'Subtotal sementara' : 'Subtotal produk';
    return `<div class="order-totals"><div><span>${label} · ${sum.count} pcs</span><strong>${sum.pending === sum.count ? 'Konfirmasi harga' : rupiah(sum.known)}</strong></div>${sum.pending ? `<p>${sum.pending} pcs belum memiliki harga. Harganya akan dikonfirmasi admin dan belum termasuk subtotal.</p>` : ''}<div><span>Ongkos kirim</span><span>Dikonfirmasi admin</span></div><p>Stok, harga akhir, dan pembayaran dikonfirmasi melalui WhatsApp.</p></div>`;
  }
  function renderCart(focusId) {
    const lines = cartLines(cart, products);
    $('#cart-dialog').innerHTML = `<div class="order-heading"><div><p class="eyebrow">YOUR PERSONAL SELECTION</p><h2 id="cart-title">Keranjang <em>kamu.</em></h2></div>${closeButton('Tutup keranjang')}</div>${lines.length ? `<div class="cart-lines">${lines.map((line, i) => `<article class="cart-line"><img src="assets/images/${escape(line.variant.image || line.product.images[0])}" alt="${escape(line.product.name)}"><div class="cart-line-copy"><h3>${escape(line.product.name)}</h3><p>${escape(line.variant.name)}</p><span>${rupiah(line.product.price)}${line.total !== null ? ' / pcs' : ''}</span><div class="cart-line-controls"><div class="quantity-control"><button id="cart-minus-${i}" data-cart-step="${i}" data-delta="-1" ${line.qty === 1 ? 'disabled' : ''} aria-label="Kurangi ${escape(line.product.name)} ${escape(line.variant.name)}">−</button><input id="cart-qty-${i}" data-cart-qty="${i}" type="number" min="1" max="99" step="1" value="${line.qty}" inputmode="numeric" aria-label="Jumlah ${escape(line.product.name)} ${escape(line.variant.name)}"><button id="cart-plus-${i}" data-cart-step="${i}" data-delta="1" ${line.qty === 99 ? 'disabled' : ''} aria-label="Tambah ${escape(line.product.name)} ${escape(line.variant.name)}">+</button></div><button id="cart-remove-${i}" class="remove-line" data-cart-remove="${i}" aria-label="Hapus ${escape(line.product.name)} ${escape(line.variant.name)}">Hapus</button></div></div><strong class="cart-line-total">${line.total === null ? 'Konfirmasi harga' : rupiah(line.total)}</strong></article>`).join('')}</div><div class="cart-bottom">${summary()}<button class="button button-dark" data-order-action="checkout">Lanjut ke checkout <span>→</span></button><button class="text-button" data-close>Lanjutkan memilih</button></div>` : `<div class="empty-state">${bag}<h3>Masih ada ruang untuk pilihanmu.</h3><p>Pilih warna atau seri pada detail produk,<br>lalu tambahkan ke keranjang.</p><button class="button button-dark" data-close>Jelajahi koleksi →</button></div>`}`;
    if (focusId) {
      const focus = document.getElementById(focusId);
      (focus && !focus.disabled ? focus : $('#cart-dialog .order-close')).focus({ preventScroll:true });
    }
  }
  function showCart() {
    for (const id of ['product-dialog','favorites-dialog','checkout-dialog']) if ($('#'+id).open) $('#'+id).close();
    renderCart();
    if (!$('#cart-dialog').open) $('#cart-dialog').showModal();
  }
  function field(name, label, { optional = false, multiline = false, autocomplete = '', type = 'text', pattern = '', maxlength = 150 } = {}) {
    const attributes = `id="order-${name}" name="${name}" ${optional ? '' : 'required'} autocomplete="${autocomplete}" maxlength="${maxlength}"`;
    return `<label class="checkout-field ${multiline ? 'wide' : ''}" for="order-${name}"><span>${label}${optional ? ' (opsional)' : ''}</span>${multiline ? `<textarea ${attributes} rows="3">${escape(customer[name])}</textarea>` : `<input ${attributes} type="${type}" ${pattern ? `pattern="${pattern}"` : ''} value="${escape(customer[name])}">`}</label>`;
  }
  function openCheckout() {
    if (!cart.length) return showCart();
    $('#cart-dialog').close();
    $('#checkout-dialog').innerHTML = `<div class="order-heading"><div><p class="eyebrow">ONE STEP CLOSER</p><h2 id="checkout-title">Lengkapi <em>pesananmu.</em></h2></div>${closeButton('Tutup checkout')}</div><div class="checkout-layout"><form id="checkout-form"><h3>Data penerima</h3><p class="checkout-intro">Isi tujuan pengiriman agar kami bisa membantu menghitung ongkir.</p><div class="checkout-fields">${field('name','Nama lengkap',{autocomplete:'name'})}${field('phone','Nomor WhatsApp',{autocomplete:'tel',type:'tel',pattern:'(0|[+]62|62)[0-9]{8,13}',maxlength:16})}${field('address','Alamat lengkap',{multiline:true,autocomplete:'street-address',maxlength:500})}${field('city','Kota / Kabupaten',{autocomplete:'address-level2'})}${field('postcode','Kode pos',{optional:true,autocomplete:'postal-code',pattern:'[0-9]{5}',maxlength:5})}<label class="checkout-field wide"><span>Kurir pilihan</span><select name="shipping">${['Diskusikan dengan admin','JNE','J&T Express','SiCepat'].map(s => `<option ${customer.shipping === s ? 'selected' : ''}>${escape(s)}</option>`).join('')}</select></label>${field('notes','Catatan pesanan',{optional:true,multiline:true,maxlength:500})}</div><p class="checkout-disclosure">Data yang kamu isi dan rincian pesanan akan diteruskan ke WhatsApp. Periksa pesannya sebelum menekan kirim.</p><button class="button button-dark checkout-submit" type="submit">Lanjutkan ke WhatsApp ↗</button><button class="text-button" type="button" data-order-action="cart">← Kembali ke keranjang</button><div id="whatsapp-fallback" role="status" hidden></div></form><aside class="checkout-summary"><p class="eyebrow">PILIHANMU</p><h3>Ringkasan pesanan</h3>${cartLines(cart,products).map(line => `<div class="checkout-line"><div><strong>${escape(line.product.name)}</strong><span>${escape(line.variant.name)} · ${line.qty} pcs</span></div><b>${line.total === null ? 'Konfirmasi harga' : rupiah(line.total)}</b></div>`).join('')}${summary()}<details class="message-preview"><summary>Lihat format pesan WhatsApp</summary><pre id="order-message-preview"></pre></details></aside></div>`;
    $('#checkout-dialog').showModal();
    updatePreview();
  }
  function updatePreview() {
    if (!$('#checkout-dialog').open) return;
    try { $('#order-message-preview').textContent = orderMessage(cart,products,customer); }
    catch { $('#order-message-preview').textContent = 'Lengkapi nama, nomor WhatsApp, dan alamat untuk melihat pesan pesananmu.'; }
    $('#whatsapp-fallback').hidden = true;
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.hasAttribute('data-detail-step')) {
      const input = $('#detail-quantity'); input.value = quantity(Number(input.value) + Number(target.dataset.detailStep));
    }
    if (target.hasAttribute('data-cart-step')) {
      const line = cart[Number(target.dataset.cartStep)];
      if (line) { line.qty = quantity(line.qty + Number(target.dataset.delta)); persist(); renderCart(target.id); }
    }
    if (target.hasAttribute('data-cart-remove')) {
      cart.splice(Number(target.dataset.cartRemove),1); persist(); renderCart('cart-remove-'+Math.max(0,Number(target.dataset.cartRemove)-1)); notify('Produk dihapus dari keranjang.');
    }
    const action = target.dataset.orderAction;
    if (action === 'cart') showCart();
    if (action === 'checkout') openCheckout();
    if (action === 'add') {
      const { product, variant } = getSelection();
      const input = $('#detail-quantity');
      if (!input.reportValidity()) return;
      try {
        cart = addItem(cart,product?.id,variant?.id,Number(input.value),products);
        persist();
        $('#add-feedback').textContent = `${input.value} pcs ${product.name} · ${variant.name} ditambahkan.`;
        notify('Ditambahkan ke keranjang.');
      } catch (error) { $('#add-feedback').textContent = error.message; }
    }
  });
  document.addEventListener('change', event => {
    const input = event.target;
    if (input.hasAttribute('data-cart-qty')) {
      const line = cart[Number(input.dataset.cartQty)];
      if (line) { line.qty = quantity(input.value); persist(); renderCart(input.id); }
    }
  });
  document.addEventListener('input', event => {
    if (event.target.closest('#checkout-form') && event.target.name) {
      if (event.target.name === 'phone') event.target.value = event.target.value.replace(/[\s().-]/g,'');
      customer[event.target.name] = event.target.value;
      updatePreview();
    }
  });
  document.addEventListener('submit', event => {
    if (event.target.id !== 'checkout-form') return;
    event.preventDefault();
    customer = Object.fromEntries(new FormData(event.target));
    try {
      const url = whatsappLink(config.whatsapp,orderMessage(cart,products,customer));
      const fallback = $('#whatsapp-fallback');
      fallback.innerHTML = `<strong>Pesanan siap dibuka di WhatsApp.</strong><p>Pesan belum terkirim sampai kamu menekan kirim di WhatsApp. Keranjang tetap tersimpan.</p><a href="${escape(url)}" target="_blank" rel="noopener">Buka WhatsApp ↗</a>`;
      fallback.hidden = false;
      window.open(url,'_blank','noopener,noreferrer');
    } catch (error) { notify(error.message); }
  });
  window.addEventListener('storage', event => {
    if (event.key !== config.cartStorageKey && event.key !== null) return;
    try { cart = readCart(localStorage,config.cartStorageKey,products); } catch { cart = []; }
    updateBadge();
    if ($('#cart-dialog').open) renderCart();
    if ($('#checkout-dialog').open) { $('#checkout-dialog').close(); showCart(); notify('Keranjang berubah di tab lain. Periksa kembali pesananmu.'); }
  });
  updateBadge();
}
