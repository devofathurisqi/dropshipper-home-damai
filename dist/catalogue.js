export const rupiah = value => Number.isFinite(value) ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value) : 'Tanyakan harga';
export const isArchived = variant => /sold|archive/i.test(variant?.availability || '');
export function filterProducts(products, { query = '', category = 'Semua', sort = 'curated', budget = 'all' } = {}) {
  const needle = query.trim().toLocaleLowerCase('id');
  const result = products.filter(p => (category === 'Semua' || p.category === category) &&
    (!needle || [p.name, p.material, p.category, ...p.variants.map(v => v.name)].join(' ').toLocaleLowerCase('id').includes(needle)) &&
    (budget === 'all' || (p.price !== null && (budget === 'under50' ? p.price < 50000 : budget === '50to100' ? p.price >= 50000 && p.price <= 100000 : p.price > 100000))));
  if(sort === 'low') result.sort((a,b)=>(a.price ?? Infinity)-(b.price ?? Infinity));
  if(sort === 'high') result.sort((a,b)=>(b.price ?? -Infinity)-(a.price ?? -Infinity));
  if(sort === 'name') result.sort((a,b)=>a.name.localeCompare(b.name,'id'));
  return result;
}
export function enquiryMessage(product, variant) {
  if (!product || product.availability === 'coming-soon' || isArchived(variant)) return null;
  return `Halo Home Damai, saya tertarik dengan ${product.name}.${variant ? `\nPilihan: ${variant.name}` : ''}\nHarga katalog: ${rupiah(product.price)}${product.price !== null ? ' / pcs' : ''}.\nBoleh dibantu cek ketersediaan${product.price === null ? ' dan harga' : ''}? Terima kasih.`;
}
export function whatsappLink(number, message) {
  return /^\d{10,15}$/.test(number || '') && message ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
export function readFavorites(storage, key, products) {
  try { const saved = JSON.parse(storage.getItem(key) || '[]'); return Array.isArray(saved) ? [...new Set(saved.filter(id=>products.some(p=>p.id===id)))] : []; } catch { return []; }
}
