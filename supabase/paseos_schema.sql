-- Esquema real de "Huella" (paseo verificado), aplicado al proyecto Supabase
-- de sportrank-web (namespace propio — no toca events/favorites/etc.).
--
-- Modelo de confianza: sin cuentas/registro. Cada dispositivo obtiene un
-- auth.uid() estable vía sign-in anónimo de Supabase (ver lib/paseos/auth.ts).
-- El dueño crea el paseo (queda como owner_id) y comparte el link; el
-- paseador que lo abre y confirma la foto de inicio lo "reclama" como
-- walker_id. Antes de reclamarlo, la lectura pasa por una función
-- SECURITY DEFINER de una sola fila por id exacto — nunca por un listado
-- abierto — así que no se pueden enumerar paseos ajenos.
--
-- Requiere habilitar "Allow anonymous sign-ins" en el proyecto
-- (Authentication → Sign In / Providers) para que signInAnonymously()
-- funcione desde el cliente.

create table walk_bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  walker_id uuid,
  dog_name text not null,
  dog_breed text,
  walker_name text not null,
  scheduled_at timestamptz not null,
  expected_minutes int not null,
  price_clp int,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_curso', 'completado', 'cancelado')),
  started_at timestamptz,
  ended_at timestamptz,
  start_photo_url text,
  end_photo_url text,
  route jsonb not null default '[]'::jsonb, -- [{lat, lng, t, accuracy}, ...]
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

alter table walk_bookings enable row level security;

create policy "insert own booking" on walk_bookings
  for insert
  with check (auth.uid() = owner_id);

create policy "owner or walker select" on walk_bookings
  for select
  using (auth.uid() = owner_id or auth.uid() = walker_id);

create policy "owner or walker update" on walk_bookings
  for update
  using (auth.uid() = owner_id or auth.uid() = walker_id)
  with check (auth.uid() = owner_id or auth.uid() = walker_id);

-- owner_id nunca cambia; walker_id solo se puede fijar una vez (desde null).
-- Defensa en profundidad a nivel de base de datos, además del flujo normal.
create or replace function protect_booking_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'owner_id es inmutable';
  end if;
  if old.walker_id is not null and new.walker_id <> old.walker_id then
    raise exception 'walker_id ya fue asignado a este paseo';
  end if;
  return new;
end;
$$;

create trigger protect_booking_identity_trg
  before update on walk_bookings
  for each row execute function protect_booking_identity();

-- Lectura de una fila específica por id, para quien todavía no es owner
-- ni walker (el paseador abriendo el link compartido por primera vez).
create or replace function get_shared_booking(p_id uuid)
returns setof walk_bookings
language sql
security definer
set search_path = public
as $$
  select * from walk_bookings where id = p_id;
$$;

-- Reclamar un paseo: atómico, y solo si sigue pendiente y sin paseador
-- asignado — no permite "hijackear" un paseo ya tomado por otro dispositivo.
create or replace function claim_booking(p_id uuid, p_start_photo_url text)
returns setof walk_bookings
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update walk_bookings
  set walker_id = auth.uid(),
      status = 'en_curso',
      started_at = now(),
      start_photo_url = p_start_photo_url
  where id = p_id
    and walker_id is null
    and status = 'pendiente'
  returning *;
end;
$$;

grant execute on function get_shared_booking(uuid) to anon, authenticated;
grant execute on function claim_booking(uuid, text) to anon, authenticated;

-- Fotos de inicio/término. Bucket público de solo-lectura vía URL directa
-- (no requiere policy de SELECT en storage.objects, que solo habilitaría
-- listar el bucket completo vía la API — evitado a propósito).
insert into storage.buckets (id, name, public) values ('paseos', 'paseos', true);

create policy "paseos authenticated insert" on storage.objects
  for insert with check (bucket_id = 'paseos' and auth.role() = 'authenticated');
