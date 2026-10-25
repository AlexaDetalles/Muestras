import {businesses} from './catalog-data.mjs';
export {businesses};
const business=Object.keys(businesses)[0],base=businesses[business],listeners=new Set();
let cache={products:base.products,settings:{intro:base.description,faqs:base.faqs},requests:[],visits:[],me:{isOwner:false},members:[]},adminMode=false,busy=false;
const channel='BroadcastChannel' in globalThis?new BroadcastChannel('krombyte-'+business):null;
export const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,14)}`;
export const money=v=>v===null?'Por cotizar':new Intl.NumberFormat('es-HN',{style:'currency',currency:'HNL',maximumFractionDigits:2}).format(v);
export const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const statuses=['Nueva','En conversación','Cotizada','Cerrada'];
function check(id){if(id!==business)throw Error('Este panel pertenece a otro negocio.');}
function notify(){listeners.forEach(fn=>fn());}
export async function api(path,body){const response=await fetch(path,{credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},...(body?{method:'POST',body:JSON.stringify(body)}:{})});let data;try{data=await response.json();}catch{throw Error('El servidor no está disponible. Intentá de nuevo.');}if(!response.ok)throw Error(data.error||'No se pudo completar la operación.');return data;}
export async function hydrate(admin=adminMode){adminMode=adminMode||admin;if(busy)return;busy=true;try{const data=await api(adminMode?'/api/admin/state':'/api/state');cache={...cache,...data};notify();}finally{busy=false;}}
async function changed(){await hydrate();channel?.postMessage({changed:true});}
channel?.addEventListener('message',()=>hydrate().catch(()=>{}));
if(typeof document!=='undefined'){setInterval(()=>{if(document.visibilityState==='visible')hydrate().catch(()=>{});},15000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')hydrate().catch(()=>{});});}
export const catalog=id=>(check(id),cache.products);
export const settings=id=>(check(id),cache.settings);
export const requests=id=>(check(id),cache.requests);
export const visits=id=>(check(id),cache.visits);
export const access=()=>({me:cache.me,members:cache.members,roles:cache.roles||[],permissionLabels:cache.permissionLabels||{}});
export async function saveProduct(id,p){check(id);const data=await api('/api/products',p);await changed();return data;}
export async function saveSettings(id,s){check(id);await api('/api/settings',s);await changed();}
export async function createRequest(id,data){check(id);const receipt=await api('/api/consultations',data);channel?.postMessage({changed:true});return receipt;}
export async function updateRequest(id,rid,patch){check(id);await api('/api/consultations/'+encodeURIComponent(rid),patch);await changed();}
export function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
export async function visit(id){check(id);try{const key='krombyte-session-'+id;let session=sessionStorage.getItem(key);if(!session){session=uid();sessionStorage.setItem(key,session);}await api('/api/visit',{id:session});}catch{}}
export async function invite(){return api('/api/invites',{});}
export async function revoke(id){await api('/api/members/revoke',{id});await changed();}
