-- Esquema propuesto para "Huella" (paseo verificado) cuando pase de
-- prototipo (localStorage, ver lib/paseos/store.ts) a backend real con
-- Supabase. NO se aplica automáticamente — es referencia para cuando el
-- equipo decida conectar auth real de dueños/paseadores.
--
-- Fotos: se recomienda guardarlas en Supabase Storage (bucket "paseos") y
-- almacenar aquí solo la ruta/URL, no el binario.

create table if not exists dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  breed text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists walk_bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  walker_id uuid references auth.users (id) on delete set null,
  dog_id uuid not null references dogs (id) on delete cascade,
  scheduled_at timestamptz not null,
  expected_minutes int not null,
  price_clp int,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_curso', 'completado', 'cancelado')),
  created_at timestamptz not null default now()
);

create table if not exists walk_sessions (
  booking_id uuid primary key references walk_bookings (id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  start_photo_url text,
  end_photo_url text,
  route jsonb not null default '[]', -- [{lat, lng, t, accuracy}, ...]
  distance_m numeric,
  verification_score int,
  verification_status text check (verification_status in ('verificado', 'revisar', 'no_verificado')),
  verification_flags jsonb -- [{level, message}, ...]
);

alter table dogs enable row level security;
alter table walk_bookings enable row level security;
alter table walk_sessions enable row level security;

create policy "owners manage their dogs" on dogs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner or walker can see booking" on walk_bookings
  for select using (auth.uid() = owner_id or auth.uid() = walker_id);
create policy "owner manages own bookings" on walk_bookings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "walker updates assigned booking" on walk_bookings
  for update using (auth.uid() = walker_id);

create policy "owner or walker can see session" on walk_sessions
  for select using (
    exists (
      select 1 from walk_bookings b
      where b.id = walk_sessions.booking_id
        and (b.owner_id = auth.uid() or b.walker_id = auth.uid())
    )
  );
create policy "walker writes session" on walk_sessions
  for all using (
    exists (
      select 1 from walk_bookings b
      where b.id = walk_sessions.booking_id and b.walker_id = auth.uid()
    )
  );
