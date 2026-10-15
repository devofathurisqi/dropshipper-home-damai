import { products as source } from '../../../vuyama-catalog/dist/products.js';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const sourceAssets = fileURLToPath(new URL('../../../vuyama-catalog/dist/assets/images/', import.meta.url));
const fields = ['id', 'name', 'category', 'material', 'price', 'description', 'images', 'size', 'contain', 'availability', 'photoStatus', 'priceNote', 'variantNote', 'priceSource'];
const products = source.filter(p => p.category !== 'Paket Usaha').map(p => ({
  ...Object.fromEntries(fields.filter(k => k in p).map(k => [k, p[k]])),
  variants: p.variants.map(v => Object.fromEntries(['id','name','image','imageIsExact','variantType','availability','note','images'].filter(k=>k in v).map(k=>[k,v[k]]))),
  referenceImages: (p.referenceImages || []).map(i=>typeof i==='string'?i:i.image).filter(Boolean)
}));
const assets = new Set(['gradasi-cream.webp','gradasi-burnt-maho.webp','gradasi-cosmic-mauve.webp','ppv-e3.webp','modal.webp','hayla.webp','segenggam-polos.webp']);
for (const p of products) {
  for (const f of [...p.images, ...p.referenceImages]) assets.add(f);
  for (const v of p.variants) { if(v.image) assets.add(v.image); for(const f of v.images||[]) if(typeof f==='string') assets.add(f); }
}
await mkdir(path.join(root, 'dist/assets/images'), {recursive:true});
for (const name of assets) await copyFile(path.join(sourceAssets,name),path.join(root,'dist/assets/images',name));
await writeFile(path.join(root,'dist/products.js'), '// Retail catalogue imported from the locally audited Vuyama source. No wholesale packages or prices.\nexport const products = '+JSON.stringify(products,null,2)+';\n');
console.log(`Imported ${products.length} retail products, ${assets.size} local images.`);
