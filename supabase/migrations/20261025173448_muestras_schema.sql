create table public.kb_shops(id text primary key, name text not null, seed jsonb not null, settings jsonb, setup_hash text not null, setup_expires timestamptz not null, setup_used boolean not null default false);
create table public.kb_products(shop_id text not null references public.kb_shops(id),id text not null,body jsonb not null,updated_at timestamptz not null default now(),primary key(shop_id,id));
create table public.kb_members(shop_id text not null references public.kb_shops(id),user_id uuid not null references auth.users(id) on delete cascade,email text not null,name text not null,role text not null,disabled boolean not null default false,created_at timestamptz not null default now(),primary key(shop_id,user_id));
create table public.kb_roles(shop_id text not null references public.kb_shops(id),id text not null,name text not null,permissions jsonb not null,primary key(shop_id,id));
create table public.kb_consultations(id uuid primary key default gen_random_uuid(),shop_id text not null references public.kb_shops(id),client_key text not null,name text not null,contact text not null default '',product text not null,date date not null,summary text not null,status text not null default 'Nueva' check(status in ('Nueva','En conversación','Cotizada','Cerrada')),note text not null default '',created_at timestamptz not null default now(),unique(shop_id,client_key));
create index kb_consultations_recent on public.kb_consultations(shop_id,created_at desc);
create table public.kb_visits(shop_id text not null references public.kb_shops(id),id text not null,at timestamptz not null default now(),primary key(shop_id,id));
create index kb_visits_recent on public.kb_visits(shop_id,at desc);
create table public.kb_limits(key text primary key,count integer not null,expires_at timestamptz not null);
alter table public.kb_shops enable row level security;
alter table public.kb_products enable row level security;
alter table public.kb_members enable row level security;
alter table public.kb_roles enable row level security;
alter table public.kb_consultations enable row level security;
alter table public.kb_visits enable row level security;
alter table public.kb_limits enable row level security;
revoke all on public.kb_shops,public.kb_products,public.kb_members,public.kb_roles,public.kb_consultations,public.kb_visits,public.kb_limits from anon,authenticated;
grant all on public.kb_shops,public.kb_products,public.kb_members,public.kb_roles,public.kb_consultations,public.kb_visits,public.kb_limits to service_role;
create function public.kb_rate(p_key text,p_expires timestamptz) returns integer language sql security invoker set search_path='' as $$
 insert into public.kb_limits(key,count,expires_at) values(p_key,1,p_expires) on conflict(key) do update set count=public.kb_limits.count+1 returning count;
$$;
revoke all on function public.kb_rate(text,timestamptz) from public,anon,authenticated;
grant execute on function public.kb_rate(text,timestamptz) to service_role;
create function public.kb_session_active(p_session uuid,p_user uuid) returns boolean language sql security definer set search_path='' as $$
 select (select auth.jwt()->>'role')='service_role' and exists(select 1 from auth.sessions where id=p_session and user_id=p_user);
$$;
revoke all on function public.kb_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.kb_session_active(uuid,uuid) to service_role;
