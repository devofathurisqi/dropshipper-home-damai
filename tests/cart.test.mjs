import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../dist/products.js';
import config from '../dist/config.js';
import { whatsappLink } from '../dist/catalogue.js';
import { cleanCart, readCart, addItem, cartLines, totals, orderMessage } from '../dist/cart.js';

const p = products.find(p => p.id === 'viscose-gradasi');
const cream = p.variants.find(v => v.name === 'Creamy Nude');
const other = p.variants.find(v => v.id !== cream.id);
const customer = { name:'Pelanggan Uji', phone:'081234567890', address:'Alamat pengujian', city:'Kota Pengujian', shipping:'J&T Express', notes:'Tolong cek warna.' };

test('cart merges identical choices, separates colors, and uses retail unit prices', () => {
  let cart = addItem([],p.id,cream.id,2,products);
  cart = addItem(cart,p.id,cream.id,1,products);
  cart = addItem(cart,p.id,other.id,1,products);
  assert.equal(cart.length,2);
  assert.deepEqual(cart.map(l=>l.qty),[3,1]);
  assert.equal(cartLines(cart,products)[0].total,297000);
  assert.deepEqual(totals(cart,products),{count:4,known:396000,pending:0});
  cart[0].qty = 1;
  assert.equal(totals(cart,products).known,198000);
  cart.splice(1,1);
  assert.equal(totals(cart,products).known,99000);
});

test('cart requires a valid choice, rejects unavailable choices and enforces quantity limits', () => {
  assert.throws(()=>addItem([],p.id,null,1,products));
  assert.throws(()=>addItem([],p.id,cream.id,0,products));
  assert.throws(()=>addItem([],p.id,cream.id,1.5,products));
  assert.throws(()=>addItem([{productId:p.id,variantId:cream.id,qty:99}],p.id,cream.id,1,products));
  const future = products.find(p=>p.availability==='coming-soon');
  assert.throws(()=>addItem([],future.id,future.variants[0].id,1,products));
  const archivedProduct = products.find(p=>p.variants.some(v=>/sold|archive/i.test(v.availability||'')));
  const archive = archivedProduct.variants.find(v=>/sold|archive/i.test(v.availability||''));
  assert.throws(()=>addItem([],archivedProduct.id,archive.id,1,products));
});

test('stored cart is cleaned without trusting stored names, prices or invalid identifiers', () => {
  const stored = [{productId:p.id,variantId:cream.id,qty:2,price:1,name:'Bad data'},null,{productId:'missing',variantId:cream.id,qty:1},{productId:p.id,variantId:'missing',qty:1},{productId:p.id,variantId:cream.id,qty:-5}];
  const result = readCart({getItem:()=>JSON.stringify(stored)},'cart',products);
  assert.deepEqual(result,[{productId:p.id,variantId:cream.id,qty:2}]);
  assert.equal(cartLines(result,products)[0].total,198000);
  assert.deepEqual(readCart({getItem:()=>'{broken'},'cart',products),[]);
  assert.deepEqual(readCart({getItem:()=>{throw Error('denied');}},'cart',products),[]);
  assert.deepEqual(cleanCart({},products),[]);
  assert.equal(cleanCart([{productId:p.id,variantId:cream.id,qty:999}],products)[0].qty,99);
});

test('unpriced products are counted separately and never presented as free', () => {
  const unpriced = products.find(p=>p.price===null && p.availability!=='coming-soon');
  const variant = unpriced.variants.find(v=>!/sold|archive/i.test(v.availability||''));
  let cart = addItem([],unpriced.id,variant.id,2,products);
  assert.deepEqual(totals(cart,products),{count:2,known:0,pending:2});
  assert.match(orderMessage(cart,products,customer),/Menunggu konfirmasi harga/);
  cart = addItem(cart,p.id,cream.id,1,products);
  assert.deepEqual(totals(cart,products),{count:3,known:99000,pending:2});
  const message = orderMessage(cart,products,customer);
  assert.match(message,/2 pcs masih menunggu konfirmasi harga/);
  assert.doesNotMatch(message,/Rp\s*0\b/);
});

test('checkout generates a complete WhatsApp order for Home Damai with correct totals', () => {
  const cart = addItem([],p.id,cream.id,2,products);
  const message = orderMessage(cart,products,customer);
  const link = new URL(whatsappLink(config.whatsapp,message));
  assert.equal(link.pathname,'/6285198361315');
  assert.equal(link.searchParams.get('text'),message);
  for (const part of ['Viscose Gradasi','Creamy Nude','Jumlah: 2 pcs','198.000','Pelanggan Uji','081234567890','Alamat pengujian','Kota Pengujian','J&T Express','Tolong cek warna.','Ongkir: dikonfirmasi admin']) assert.ok(message.includes(part),part);
  assert.match(message,/stok, harga akhir, ongkir, dan cara pembayaran/);
  assert.equal(cart.length,1,'preparing checkout does not clear cart');
});

test('empty carts and incomplete recipient data cannot prepare an order', () => {
  assert.throws(()=>orderMessage([],products,customer));
  const cart = addItem([],p.id,cream.id,1,products);
  for (const key of ['name','phone','address','city']) assert.throws(()=>orderMessage(cart,products,{...customer,[key]:''}));
  assert.throws(()=>orderMessage(cart,products,{...customer,phone:'invalid'}));
});
