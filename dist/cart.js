import { isArchived, rupiah } from './catalogue.js';

export const MAX_QUANTITY = 99;
export const quantity = value => Math.min(MAX_QUANTITY, Math.max(1, Math.floor(Number(value) || 1)));

export function cleanCart(value, products) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const line of value) {
    if (!line || !Number.isInteger(line.qty) || line.qty < 1) continue;
    const product = products.find(p => p.id === line.productId);
    const variant = product?.variants.find(v => v.id === line.variantId);
    if (!product || !variant || product.availability === 'coming-soon' || isArchived(variant)) continue;
    const existing = result.find(x => x.productId === product.id && x.variantId === variant.id);
    if (existing) existing.qty = quantity(existing.qty + line.qty);
    else result.push({ productId: product.id, variantId: variant.id, qty: quantity(line.qty) });
  }
  return result;
}

export function readCart(storage, key, products) {
  try { return cleanCart(JSON.parse(storage.getItem(key) || '[]'), products); }
  catch { return []; }
}

export function addItem(cart, productId, variantId, qty, products) {
  const valid = cleanCart([{ productId, variantId, qty }], products);
  if (!valid.length) throw new Error('Pilih warna atau seri yang tersedia terlebih dahulu.');
  const current = cleanCart(cart, products);
  const existing = current.find(x => x.productId === productId && x.variantId === variantId);
  if ((existing?.qty || 0) + qty > MAX_QUANTITY) throw new Error('Maksimal 99 pcs untuk satu pilihan. Hubungi admin untuk jumlah lebih banyak.');
  return cleanCart([...current, ...valid], products);
}

export function cartLines(cart, products) {
  return cleanCart(cart, products).map(line => {
    const product = products.find(p => p.id === line.productId);
    const variant = product.variants.find(v => v.id === line.variantId);
    const total = Number.isFinite(product.price) ? product.price * line.qty : null;
    return { ...line, product, variant, total };
  });
}

export function totals(cart, products) {
  return cartLines(cart, products).reduce((sum, line) => ({
    count: sum.count + line.qty,
    known: sum.known + (line.total ?? 0),
    pending: sum.pending + (line.total === null ? line.qty : 0)
  }), { count: 0, known: 0, pending: 0 });
}

export function orderMessage(cart, products, customer) {
  const lines = cartLines(cart, products);
  if (!lines.length) throw new Error('Keranjangmu masih kosong.');
  const data = Object.fromEntries(['name','phone','address','city','postcode','shipping','notes'].map(k => [k, String(customer[k] || '').trim()]));
  if (!data.name || !data.address || !data.city || !/^(?:0|\+?62)[0-9]{8,13}$/.test(data.phone)) throw new Error('Lengkapi nama, nomor WhatsApp, dan alamat pengiriman.');
  const sum = totals(cart, products);
  const subtotal = sum.pending === sum.count ? 'Menunggu konfirmasi harga' : rupiah(sum.known);
  return [
    'Halo Home Damai, saya ingin memesan:', '', '*RINCIAN PESANAN*',
    ...lines.map((line, i) => `${i + 1}. ${line.product.name}\n   Warna / seri: ${line.variant.name}\n   Jumlah: ${line.qty} pcs\n   Harga satuan: ${line.total === null ? 'Konfirmasi admin' : rupiah(line.product.price)}\n   Subtotal: ${line.total === null ? 'Konfirmasi admin' : rupiah(line.total)}`),
    '', `Jumlah: ${sum.count} pcs`, `${sum.pending ? 'Subtotal produk berharga' : 'Subtotal produk'}: ${subtotal}`,
    ...(sum.pending ? [`${sum.pending} pcs masih menunggu konfirmasi harga (belum termasuk subtotal).`] : []),
    'Ongkir: dikonfirmasi admin', '', '*DATA PENERIMA*', `Nama: ${data.name}`, `WhatsApp: ${data.phone}`,
    `Alamat: ${data.address}`, `Kota / Kabupaten: ${data.city}`, `Kode pos: ${data.postcode || '-'}`,
    `Kurir pilihan: ${data.shipping || 'Diskusikan dengan admin'}`, `Catatan: ${data.notes || '-'}`, '',
    'Mohon konfirmasi stok, harga akhir, ongkir, dan cara pembayaran. Terima kasih.'
  ].join('\n');
}
