import assert from 'node:assert/strict';import {runInNewContext} from 'node:vm';import {readFile,readdir} from 'node:fs/promises';import {transform} from 'esbuild';
const ids=['esmeraldas','ivagos','quedetalle','tapinta','dglobos'];let checks=0;
for(const id of ids){const root='dist/'+id;async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const file=dir+'/'+e.name;if(e.isDirectory())await walk(file);else if(/\.(html|css|mjs|svg)$/.test(file)){const text=await readFile(file,'utf8');assert(!text.includes('.chatgpt.site'),file);for(const foreign of ids.filter(x=>x!==id))assert(!text.toLowerCase().includes(foreign),file+' mezcla otra empresa');if(file.endsWith('.mjs'))await transform(text,{loader:'js'});checks++;}}}await walk(root);const shop=await readFile(root+'/index.html','utf8');assert(!/href=["'][^"']*\/admin\//.test(shop));const login=await readFile(root+'/admin/index.html','utf8');assert(login.includes('type="password"'));assert(login.includes('cloud-config'));checks+=3;}
console.log(checks+' comprobaciones de archivos, rutas, acceso e independencia correctas.');

// The tour must identify the admin shell even under a GitHub Pages prefix.
for(const id of ids){
 const tutorial=await readFile('stores/'+id+'/assets/tutorial.mjs','utf8');
 const classifier=tutorial.split('\n')[0]+';kind;';
 for(const [pathname,mode,expected] of [['/admin/','admin','admin'],['/Muestras/'+id+'/admin/app/','admin','admin'],['/Muestras/'+id+'/','', 'web']]){
  assert.equal(runInNewContext(classifier,{document:{body:{dataset:{business:id,mode},classList:[id]}},location:{pathname}}),expected,id+' tutorial '+pathname);checks++;
 }
}
console.log('Tutoriales: 15 escenarios de tienda y panel correctos.');

for(const id of ids){
 const html=await readFile('dist/'+id+'/index.html','utf8');
 const app=await readFile('dist/'+id+'/assets/app.mjs','utf8');
 assert.match(html,/assets\/style\.css\?v=/,'Las actualizaciones deben renovar los estilos en caché');
 assert.match(app,/tutorial\.mjs\?v=/,'Las actualizaciones deben renovar también la guía importada');
}
console.log('Caché: estilos y módulos versionados en las cinco tiendas.');
