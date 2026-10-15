import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { products } from '../dist/products.js';
import { products as source } from '../../../vuyama-catalog/dist/products.js';
import config from '../dist/config.js';
import { filterProducts, rupiah, isArchived, enquiryMessage, whatsappLink, readFavorites } from '../dist/catalogue.js';

test('all 24 consumer products preserve audited retail prices, with no wholesale packages or tiers', () => {
  const expected=source.filter(p=>p.category!=='Paket Usaha');
  assert.equal(products.length,24);
  assert.deepEqual(products.map(p=>[p.id,p.price]),expected.map(p=>[p.id,p.price]));
  assert.ok(products.every(p=>!p.pricingTiers && p.category!=='Paket Usaha'));
  assert.equal(products.reduce((n,p)=>n+p.variants.length,0),317);
});
test('every referenced product and variant image exists locally', async()=>{
  const files=new Set();
  for(const p of products){for(const f of [...p.images,...p.referenceImages]) files.add(f);for(const v of p.variants) if(v.image) files.add(v.image);}
  for(const file of files) await access(new URL('../dist/assets/images/'+file,import.meta.url));
});
test('combined search, category and budget filters match intended products',()=>{
  assert.deepEqual(filterProducts(products,{query:'  GRADASI ',category:'Pashmina',budget:'50to100'}).map(p=>p.id),['viscose-gradasi']);
  assert.ok(filterProducts(products,{query:'Creamy Nude'}).some(p=>p.id==='viscose-gradasi'));
  assert.deepEqual(filterProducts(products,{query:'nonexistent-product'}),[]);
  assert.ok(filterProducts(products,{budget:'under50'}).every(p=>p.price!==null && p.price<50000));
});
test('unknown prices stay last in both price orders and are never formatted as zero',()=>{
  for(const sort of ['low','high']){const list=filterProducts(products,{sort});const index=list.findIndex(p=>p.price===null);assert.ok(list.slice(index).every(p=>p.price===null));}
  assert.equal(rupiah(null),'Tanyakan harga');
});
test('WhatsApp enquiries use Home Damai, selected official variant and retail price',()=>{
  const p=products.find(p=>p.id==='viscose-gradasi'),v=p.variants.find(v=>v.name==='Creamy Nude');
  const url=new URL(whatsappLink(config.whatsapp,enquiryMessage(p,v)));
  assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/6285198361315');
  assert.match(url.searchParams.get('text'),/Creamy Nude/);assert.match(url.searchParams.get('text'),/99\.000/);
  assert.equal(whatsappLink('',enquiryMessage(p,v)),null);
});
test('sold archives and coming soon cannot generate purchase enquiries',()=>{
  const coming=products.find(p=>p.availability==='coming-soon');assert.equal(enquiryMessage(coming,null),null);
  const p=products.find(p=>p.id==='motif-tryspan'),sold=p.variants.find(isArchived);assert.ok(sold);assert.equal(enquiryMessage(p,sold),null);
  const unknown=products.find(p=>p.id==='mukena-rayon-viscose');assert.match(enquiryMessage(unknown,null),/ketersediaan dan harga/);
});
test('favorites tolerate malformed, stale or unavailable storage',()=>{
  const storage=value=>({getItem:()=>value});
  assert.deepEqual(readFavorites(storage('{bad'),'',products),[]);
  assert.deepEqual(readFavorites(storage('{"x":1}'),'',products),[]);
  assert.deepEqual(readFavorites(storage('["modal-viscose","stale","modal-viscose"]'),'',products),['modal-viscose']);
  assert.deepEqual(readFavorites({getItem(){throw Error('denied');}},'',products),[]);
});
test('public copy excludes business recruitment and inherited supplier/demo contacts',async()=>{
  const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(app,/mulai usaha|paket usaha|6285882450652|6287824315008/i);
});
