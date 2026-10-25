import {createClient} from '@supabase/supabase-js';
const config=JSON.parse(document.querySelector('#cloud-config').textContent);
export const client=createClient(config.url,config.key,{auth:{storage:sessionStorage,storageKey:'kb-session-'+config.shop,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
export async function apiResponse(path,init={}){
 try{
  const base='/Muestras/'+config.shop;if(path.startsWith(base+'/'))path=path.slice(base.length);
  const body=init.body?JSON.parse(init.body):{};
  if(path==='/api/auth/sign-in/email'){
   const {data,error}=await client.auth.signInWithPassword({email:body.email,password:body.password});if(error)throw Error('Correo o contraseña incorrectos.');
   const me=await apiResponse('/api/me');const state=await me.json();if(!state.authorized){await client.auth.signOut({scope:'local'});return response({error:'Tu cuenta no tiene acceso a esta tienda.'},403);}return response({ok:true});
  }
  if(path==='/api/auth/sign-out'){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;return response({ok:true});}
  if(path==='/api/auth/change-password'){
   const current=await client.auth.getUser();if(!current.data.user)throw Error('Volvé a iniciar sesión.');
   const check=await client.auth.signInWithPassword({email:current.data.user.email,password:body.currentPassword});if(check.error)throw Error('La contraseña actual no coincide.');
   const updated=await client.auth.updateUser({password:body.newPassword});if(updated.error)throw updated.error;
   const signedOut=await client.auth.signOut({scope:'others'});if(signedOut.error)throw signedOut.error;return response({ok:true});
  }
  if(path==='/api/auth/reset-password'){
   const verified=await client.auth.verifyOtp({token_hash:body.token,type:'recovery'});if(verified.error)throw Error('El enlace de recuperación no es válido o venció.');
   const update=await client.auth.updateUser({password:body.newPassword});if(update.error)throw update.error;await client.auth.signOut({scope:'local'});return response({ok:true});
  }
  const session=await client.auth.getSession();const headers={'Content-Type':'application/json',apikey:config.key,...(session.data.session?{Authorization:'Bearer '+session.data.session.access_token}:{})};
  return await fetch(config.url+'/functions/v1/muestras-api/'+config.shop+path,{...init,headers});
 }catch(e){return response({error:e.message||'No se pudo conectar. Intentá de nuevo.'},400);}
}
