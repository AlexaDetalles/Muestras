// Requires a disposable fixture, never uses a real business owner account.
import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {createClient} from '@supabase/supabase-js';
const c=JSON.parse(await readFile('cloud.json','utf8')),f=JSON.parse(await readFile('.migration/fixture.json','utf8'));let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const client=createClient(c.url,c.key,{auth:{persistSession:false,autoRefreshToken:false}});let jwt='';
async function api(path,body,shop='qa-fixture',token=jwt){const r=await fetch(c.url+'/functions/v1/muestras-api/'+shop+path,{method:body?'POST':'GET',headers:{apikey:c.key,Origin:'https://alexadetalles.github.io','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
eq((await api('/api/admin/state',null,'qa-fixture','')).status,401);
eq((await api('/api/setup-owner',{token:'incorrecto',name:'QA',email:f.email,password:f.password})).status,403);
eq((await api('/api/setup-owner',{token:f.token,name:'QA',email:f.email,password:f.password})).status,200);
const login=await client.auth.signInWithPassword({email:f.email,password:f.password});assert(!login.error,login.error?.message);jwt=login.data.session.access_token;f.userId=login.data.user.id;await writeFile('.migration/fixture.json',JSON.stringify(f),{mode:0o600});
eq((await api('/api/me')).data.isOwner,true);eq((await api('/api/admin/state')).status,200);
eq((await api('/api/admin/state',null,'ivagos')).status,403);
const product=f.seed.products[0];eq((await api('/api/products',{...product,price:500})).status,200);eq((await api('/api/products',{...product,price:400})).data.previousPrice,500);
const inquiry={product:product.name,date:'2026-12-01',quantity:1,name:'Prueba técnica QA',contact:'',notes:'Registro técnico, no es un pedido.',idempotencyKey:crypto.randomUUID(),delivery:'Por confirmar',occasion:'QA'};
const saved=await api('/api/consultations',inquiry,'qa-fixture','');eq(saved.status,201);eq((await api('/api/consultations',inquiry,'qa-fixture','')).data.id,saved.data.id);
const receipt=await api('/api/receipt/'+saved.data.id,null,'qa-fixture','');eq(receipt.status,200);eq(Object.hasOwn(receipt.data,'contact'),false);eq((await api('/api/receipt/'+saved.data.id,null,'ivagos','')).status,404);
eq((await api('/api/consultations/'+saved.data.id,{status:'Cotizada',note:'QA completada'})).status,200);
const restricted=await fetch(c.url+'/rest/v1/kb_members?select=*',{headers:{apikey:c.key,Authorization:'Bearer '+jwt}});eq(restricted.ok,false);
eq((await api('/api/team/roles',{name:'Solo catálogo',permissions:['catalog.manage']})).status,200);
const team=(await api('/api/team/state')).data;eq(team.roles.some(r=>r.name==='Solo catálogo'),true);
const recovery=await api('/api/team/reset',{id:f.userId});eq(recovery.status,200);assert(recovery.data.url.startsWith('https://alexadetalles.github.io/Muestras/qa-fixture/admin/#recuperar='));checks++;
await client.auth.signOut({scope:'global'});eq((await api('/api/admin/state')).status,401);
console.log(checks+' comprobaciones reales de autenticación, consultas, precios, revocación y aislamiento correctas.');
