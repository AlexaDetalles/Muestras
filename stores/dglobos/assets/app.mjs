import './tutorial.mjs';
import {initShop} from './connected-shop.mjs';
import {createRequest,money,uid} from './demo-store.mjs';
export function minimumDate(days, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tegucigalpa', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(now);
  const get = key => parts.find(p => p.type === key).value;
  const date = new Date(Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day')) + days));
  return date.toISOString().slice(0,10);
}
export function makeSummary(brand, data) {
  const lines = [`Hola, ${brand}. Quisiera consultar:`, `Opción: ${data.product}`, `Fecha deseada: ${data.date}`, `Cantidad / personas: ${data.quantity}`];
  if(data.contact) lines.push(`Contacto para responder: ${data.contact}`);
  if(data.place?.trim()) lines.push(`Lugar / zona: ${data.place.trim()}`);
  if(data.budget) lines.push(`Presupuesto orientativo: L ${data.budget}`);
  if(data.delivery) lines.push(`Entrega: ${data.delivery}`);
  if(data.occasion) lines.push(`Ocasión: ${data.occasion}`);
  if(data.extras?.length) lines.push(`Complementos de muestra: ${data.extras.join(', ')}`);
  if(data.notes.trim()) lines.push(`Comentario: ${data.notes.trim()}`);
  lines.push('', 'Precio, disponibilidad y condiciones pendientes de confirmar.');
  return lines.join('\n');
}

if (typeof document !== 'undefined') {
  const config = JSON.parse(document.getElementById('page-data').textContent);
  const shop=initShop(config);
  const dialog = document.querySelector('#inquiry');
  const form = dialog.querySelector('form');
  const select = form.elements.product;
  const date = form.elements.date;
  const output = document.querySelector('#summary');
  const dedication=document.querySelector('#gift-name');
  dedication?.addEventListener('input',()=>{document.querySelector('#gift-recipient').textContent=dedication.value.trim()||'alguien especial';});
  let step=0,prepared=null,sent=false;
  const steps=[...document.querySelectorAll('.wizard-step')];
  const announcement=document.querySelector('#wizard-announcement');
  function data(){const fd=new FormData(form);return {product:fd.get('product'),date:fd.get('date'),quantity:fd.get('quantity'),place:fd.get('place'),occasion:fd.get('occasion'),notes:fd.get('notes'),extras:fd.getAll('extras'),budget:fd.get('budget'),delivery:fd.get('delivery'),name:fd.get('customer'),contact:fd.get('contact'),website:fd.get('website')};}
  function showStep(n){step=n;steps.forEach((s,i)=>{s.hidden=i!==n;s.disabled=i!==n;});document.querySelectorAll('.wizard-progress li').forEach((s,i)=>{if(i===n)s.setAttribute('aria-current','step');else s.removeAttribute('aria-current');});document.querySelector('#wizard-back').hidden=n===0;document.querySelector('#wizard-next').hidden=n===2;document.querySelector('#wizard-submit').hidden=n!==2;announcement.textContent=`Paso ${n+1} de 3`;if(n===2){steps.forEach(s=>s.disabled=false);document.querySelector('#wizard-preview').textContent=makeSummary(config.brand,data());steps.forEach((s,i)=>s.disabled=i!==n);}steps[n].querySelector('input,select,textarea')?.focus();}
  function validStep(){return [...steps[step].querySelectorAll('input,select,textarea')].every(e=>e.reportValidity());}
  document.querySelector('#wizard-next').addEventListener('click',()=>{syncDate();if(validStep())showStep(Math.min(2,step+1));});
  document.querySelector('#wizard-back').addEventListener('click',()=>showStep(Math.max(0,step-1)));
  let opener;
  let galleryOpener;
  const gallery=document.querySelector('#picture-dialog');
  function syncDate() {
    const selected = select.selectedOptions[0];
    date.min = minimumDate(Number(selected.dataset.days || config.days));
    const days = Number(selected.dataset.days || config.days);
    const current=shop.products().find(p=>p.name===select.value);
    document.querySelector('#selected-price').textContent=current?.price!=null?`Precio de muestra: ${money(current.price)}. Importe final por confirmar.`:'Precio a confirmar con el negocio.';
    const eventFields=form.querySelector('.event-fields');
    if(eventFields){const isEvent=shop.products().find(p=>p.name===select.value)?.category==='Eventos';eventFields.hidden=!isEvent;form.elements.place.required=isEvent;if(!isEvent)form.elements.place.value='';}
    document.querySelector('#date-help').textContent = days ? `Elegí una fecha con al menos ${days} días de anticipación. El cupo se confirma con el negocio.` : 'Elegí una fecha. El negocio confirmaría disponibilidad y plazo.';
  }
  function openInquiry(product) {
    opener = gallery?.open ? galleryOpener : document.activeElement;
    if(gallery?.open)gallery.close();
    steps.forEach(s=>s.disabled=false);form.reset();prepared=null;sent=false;document.querySelector('#send-demo').disabled=false;document.querySelector('#send-demo').textContent='Enviar consulta';document.querySelector('#demo-delivery-state').textContent='';document.querySelector('#open-inbox').hidden=true;document.querySelector('[data-edit]').hidden=false;
    const recipient = document.querySelector('#gift-name')?.value.trim();
    if(recipient) form.elements.notes.value = `Para ${recipient}. `;
    if (product && [...select.options].some(o=>o.value === product)) select.value = product;
    syncDate();
    document.querySelector('#inquiry-form').hidden = false;
    document.querySelector('#inquiry-result').hidden = true;
    document.querySelector('#copy-state').textContent = '';
    dialog.showModal();showStep(0);
    document.body.classList.add('dialog-open');
  }
  document.addEventListener('click', event=>{
    const request = event.target.closest('[data-inquire]');
    if(request) openInquiry(request.dataset.inquire);
    const tab = event.target.closest('[data-category]');
    if(tab) {
      const cat = tab.dataset.category;
      document.querySelectorAll('[data-category]').forEach(t=>t.setAttribute('aria-pressed', String(t === tab)));
      document.querySelectorAll('[data-product-category]').forEach(p=>p.hidden = p.dataset.available==='false'||(cat !== 'Todos' && p.dataset.productCategory !== cat));
      document.querySelector('#filter-state').textContent = cat === 'Todos' ? 'Todas las opciones de muestra' : `Mostrando ${cat.toLowerCase()}`;
    }
    const shot = event.target.closest('[data-switch-shot]');
    if(shot) {
      document.querySelectorAll('[data-switch-shot]').forEach(t=>t.setAttribute('aria-pressed',String(t === shot)));
      const photo = document.querySelector('#hero-photo');
      photo.dataset.shot = shot.dataset.switchShot;
      photo.querySelector('img').alt = shot.dataset.alt;
    }
    const view=event.target.closest('[data-view-shot]');
    if(view&&gallery){galleryOpener=document.activeElement;gallery.querySelector('.photo').dataset.shot=view.dataset.viewShot;gallery.querySelector('#picture-title').textContent=view.dataset.viewProduct;gallery.querySelector('#picture-inquire').dataset.inquire=view.dataset.viewProduct;gallery.showModal();document.body.classList.add('dialog-open');}
    if(event.target.closest('[data-close]'))event.target.closest('dialog').close();
    if(event.target.closest('[data-edit]')) {
      document.querySelector('#inquiry-form').hidden=false;
      document.querySelector('#inquiry-result').hidden=true;
      showStep(0);
    }
  });
  gallery?.addEventListener('close',()=>{if(!dialog.open)document.body.classList.remove('dialog-open');galleryOpener?.focus();});
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open'); if(opener?.isConnected)opener.focus();else document.querySelector('[data-inquire]')?.focus();});
  dialog.addEventListener('click', e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close();}});
  select.addEventListener('change',syncDate);
  form.addEventListener('submit',event=>{
    event.preventDefault();syncDate();
    if(step<2){if(validStep())showStep(step+1);return;}
    steps.forEach(s=>s.disabled=false);
    if(!form.reportValidity()){const first=steps.findIndex(s=>[...s.querySelectorAll('input,select,textarea')].some(e=>!e.validity.valid));showStep(Math.max(0,first));return;}
    prepared={...data(),idempotencyKey:uid()};output.textContent=makeSummary(config.brand,prepared);
    document.querySelector('#inquiry-form').hidden=true;
    document.querySelector('#inquiry-result').hidden=false;
    document.querySelector('#result-title').focus();
  });
  document.querySelector('#send-demo').addEventListener('click',async()=>{if(sent||!prepared)return;const send=document.querySelector('#send-demo');send.disabled=true;send.textContent='Enviando…';try{const r=await createRequest(config.id,{...prepared,summary:output.textContent});sent=true;document.querySelector('#send-demo').disabled=true;document.querySelector('[data-edit]').hidden=true;document.querySelector('#demo-delivery-state').textContent='Consulta recibida en la bandeja privada de esta muestra. Guardá tu comprobante para consultar su estado.';const link=document.querySelector('#open-inbox');link.href=`/comprobante/?consulta=${r.id}`;link.hidden=false;}catch(e){send.disabled=false;document.querySelector('#demo-delivery-state').textContent=e.message;}finally{send.textContent=sent?'Consulta enviada':'Enviar consulta';}});
  document.querySelector('#copy').addEventListener('click',async()=>{
    const state=document.querySelector('#copy-state');
    try {await navigator.clipboard.writeText(output.textContent);state.textContent='Consulta copiada. No se envió ningún mensaje.';}
    catch {state.textContent='Podés seleccionar y copiar el texto del resumen. No se envió ningún mensaje.';}
  });
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.animate([{opacity:1,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});observer.unobserve(entry.target);}});},{threshold:.08});
    document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));
  }
}
