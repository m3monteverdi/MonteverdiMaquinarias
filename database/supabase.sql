-- =============================================
--  MONTEVERDI MAQUINARIAS — Schema Supabase
--  Proyecto: https://zuygdarjqyolybqocvkb.supabase.co
-- =============================================

-- ---- MÁQUINAS ----
create table if not exists maquinas (
  id          text primary key,
  nombre      text not null,
  modelo      text default '',
  tipo        text default '',
  horometro_actual numeric default 0,
  estado      text default 'operativa'
                check (estado in ('operativa','reparacion','baja')),
  created_at  timestamptz default now()
);

-- ---- MAQUINISTAS ----
create table if not exists maquinistas (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null,
  telefono             text,
  categoria_carnet     text,
  vencimiento_carnet   date,
  obra_asignada        text,
  maquinas_habilitadas text[] default '{}',
  created_at           timestamptz default now()
);

-- ---- REPORTES ----
create table if not exists reportes (
  id            uuid primary key default gen_random_uuid(),
  maquina_id    text references maquinas(id) on delete cascade,
  maquinista_id uuid references maquinistas(id) on delete set null,
  tipo          text not null
                  check (tipo in ('falla','service','engrase','neumatico','accesorio')),
  descripcion   text default '',
  horometro     numeric,
  prioridad     text default 'media'
                  check (prioridad in ('alta','media','baja')),
  foto_url      text,
  fecha         date default current_date,
  created_at    timestamptz default now()
);

-- ---- OTs (auto-generadas al crear reporte) ----
create table if not exists ots (
  id             uuid primary key default gen_random_uuid(),
  reporte_id     uuid references reportes(id) on delete cascade,
  numero         text not null unique,
  estado         text default 'abierta'
                   check (estado in ('abierta','cerrada')),
  fecha_apertura date default current_date,
  fecha_cierre   date,
  created_at     timestamptz default now()
);

-- ---- REPARACIONES ----
create table if not exists reparaciones (
  id             uuid primary key default gen_random_uuid(),
  ot_id          uuid references ots(id) on delete cascade,
  taller         text default '',
  trabajos       text default '',
  repuestos      text default '',
  fecha_entrega  date,
  created_at     timestamptz default now()
);

-- ---- PRÓXIMOS SERVICES / ENGRASES ----
create table if not exists servicios_proximos (
  id           uuid primary key default gen_random_uuid(),
  maquina_id   text references maquinas(id) on delete cascade,
  tipo         text not null check (tipo in ('service','engrase')),
  por_hs       boolean default true,
  cada_hs      numeric,
  proximo_hs   numeric,
  proxima_fecha date,
  reporte_id   uuid references reportes(id) on delete set null,
  created_at   timestamptz default now()
);

-- ---- DOCUMENTOS ----
create table if not exists documentos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        text default 'manual'
                check (tipo in ('manual','poliza','otro')),
  archivo_url text,
  created_at  timestamptz default now()
);

-- ---- Deshabilitar RLS (desarrollo inicial) ----
alter table maquinas          disable row level security;
alter table maquinistas       disable row level security;
alter table reportes          disable row level security;
alter table ots               disable row level security;
alter table reparaciones      disable row level security;
alter table servicios_proximos disable row level security;
alter table documentos        disable row level security;

-- =============================================
-- STORAGE BUCKETS — Ejecutar desde el Dashboard
-- de Supabase → Storage → New Bucket
-- =============================================
-- Bucket "documentos": público, para PDFs
-- Bucket "fotos":      público, para fotos de reportes
--
-- Desde SQL Editor:
-- insert into storage.buckets (id, name, public)
--   values ('documentos', 'documentos', true);
-- insert into storage.buckets (id, name, public)
--   values ('fotos', 'fotos', true);
