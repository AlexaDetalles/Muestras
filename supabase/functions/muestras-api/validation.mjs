const states=['Nueva','En conversación','Cotizada','Cerrada'];
const clean=(v,n)=>String(v??'').trim().slice(0,n);
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function minDate(days){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Tegucigalpa',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const g=k=>Number(p.find(x=>x.type===k).value);return new Date(Date.UTC(g('year'),g('month')-1,g('day')+days)).toISOString().slice(0,10);}
export function normalizeProduct(p){const price=p.price==null||p.price===''?null:Number(p.price),days=Number(p.days),shot=Number(p.shot);if(!clean(p.id,80)||!clean(p.name,70)||!clean(p.category,40)||!clean(p.description,240))fail('Completá nombre, categoría y descripción.');if(price!==null&&(!Number.isFinite(price)||price<0||price>1000000))fail('Precio no válido.');if(!Number.isInteger(days)||days<0||days>90||!Number.isInteger(shot)||shot<0||shot>3)fail('Revisá anticipación y fotografía.');return {id:clean(p.id,80),name:clean(p.name,70),category:clean(p.category,40),description:clean(p.description,240),price,previousPrice:null,days,shot,active:p.active!==false};}
export function validateInquiry(body,products,base){
 const p=products.find(x=>x.name===body.product&&x.active);if(!p)fail('Esta opción ya no está disponible. Volvé a elegir.');
 const date=clean(body.date,10),quantity=Number(body.quantity),budget=body.budget===''||body.budget==null?null:Number(body.budget);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date<minDate(p.days))fail('Revisá la fecha y la anticipación de esta opción.');
 if(!Number.isInteger(quantity)||quantity<1||quantity>250)fail('La cantidad debe estar entre 1 y 250.');
 if(budget!==null&&(!Number.isFinite(budget)||budget<0||budget>1000000))fail('Presupuesto no válido.');
 const place=clean(body.place,80);if(p.category==='Eventos'&&!place)fail('Indicá el lugar o la zona del evento.');
 if(body.website)fail('No se pudo procesar la consulta.');
 const key=clean(body.idempotencyKey,80);if(!/^[\w-]{8,80}$/.test(key))fail('Reiniciá la consulta e intentá de nuevo.');
 const name=clean(body.name,60)||'Visitante',contact=clean(body.contact,100),notes=clean(body.notes,1000),occasion=clean(body.occasion,60),delivery=['Por confirmar','Prefiero recoger','Quisiera consultar envío'].includes(body.delivery)?body.delivery:'Por confirmar';
 const lines=[`Hola, ${base.name}. Quisiera consultar:`,`Opción: ${p.name}`,`Fecha deseada: ${date}`,`Cantidad / personas: ${quantity}`];
 if(place)lines.push(`Lugar / zona: ${place}`);if(budget!==null)lines.push(`Presupuesto orientativo: L ${budget}`);lines.push(`Entrega: ${delivery}`);if(occasion)lines.push(`Ocasión: ${occasion}`);if(Array.isArray(body.extras)){const extras=body.extras.filter(x=>['Dedicatoria','Flores','Detalle dulce'].includes(x)).slice(0,3);if(extras.length)lines.push(`Complementos: ${extras.join(', ')}`);}if(notes)lines.push(`Comentario: ${notes}`);if(contact)lines.push(`Contacto para responder: ${contact}`);lines.push('','Precio, disponibilidad y condiciones pendientes de confirmar.');
 return {name,contact,product:p.name,date,summary:lines.join('\n'),clientKey:key};
}
