create table if not exists crm."DeliveryCoverageZone" (
  id text primary key,
  provider text not null default 'mercadolibre_flex',
  "providerZoneId" text not null unique,
  name text not null,
  "normalizedName" text not null unique,
  "weekCutoffHour" integer,
  "isActive" boolean not null default true,
  "sourceUpdatedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "DeliveryCoverageZone_isActive_normalizedName_idx"
  on crm."DeliveryCoverageZone" ("isActive", "normalizedName");

insert into crm."DeliveryCoverageZone" (id, "providerZoneId", name, "normalizedName", "weekCutoffHour") values
  ('coverage_vicente_lopez', 'Vicente_Lopez', 'Vicente López', 'vicente lopez', 12),
  ('coverage_lanus', 'Lanus', 'Lanús', 'lanus', 12),
  ('coverage_la_matanza_1', 'La_Matanza_1', 'La Matanza 1', 'la matanza 1', 12),
  ('coverage_la_matanza_2', 'La_Matanza_2', 'La Matanza 2', 'la matanza 2', 12),
  ('coverage_almirante_brown', 'Almirante_Brown', 'Almirante Brown', 'almirante brown', 12),
  ('coverage_avellaneda', 'Avellaneda', 'Avellaneda', 'avellaneda', 12),
  ('coverage_berazategui', 'Berazategui', 'Berazategui', 'berazategui', 12),
  ('coverage_tres_de_febrero', 'Tres_De_Febrero', 'Tres de Febrero', 'tres de febrero', 12),
  ('coverage_caba', 'CABA', 'CABA', 'caba', 16),
  ('coverage_lomas_de_zamora', 'Lomas_de_Zamora', 'Lomas de Zamora', 'lomas de zamora', 12),
  ('coverage_esteban_echeverria', 'Esteban_Echeverria', 'Esteban Echeverría', 'esteban echeverria', 12),
  ('coverage_malvinas_argentinas', 'Malvinas_Argentinas', 'Malvinas Argentinas', 'malvinas argentinas', 12),
  ('coverage_merlo', 'Merlo', 'Merlo', 'merlo', 12),
  ('coverage_ezeiza', 'Ezeiza', 'Ezeiza', 'ezeiza', 12),
  ('coverage_moreno', 'Moreno', 'Moreno', 'moreno', 12),
  ('coverage_florencio_varela', 'Florencio_Varela', 'Florencio Varela', 'florencio varela', 12),
  ('coverage_quilmes', 'Quilmes', 'Quilmes', 'quilmes', 12),
  ('coverage_hurlingham', 'Hurlingham', 'Hurlingham', 'hurlingham', 12),
  ('coverage_ituzaingo', 'Ituzaingo', 'Ituzaingó', 'ituzaingo', 12),
  ('coverage_san_fernando', 'San_Fernando', 'San Fernando', 'san fernando', 12),
  ('coverage_san_isidro', 'San_Isidro', 'San Isidro', 'san isidro', 12),
  ('coverage_jose_c_paz', 'Jose_C_Paz', 'José C. Paz', 'jose c paz', 12),
  ('coverage_san_martin', 'San_Martin', 'San Martín', 'san martin', 12),
  ('coverage_moron', 'Moron', 'Morón', 'moron', 12),
  ('coverage_san_miguel', 'San_Miguel', 'San Miguel', 'san miguel', 12),
  ('coverage_tigre', 'Tigre', 'Tigre', 'tigre', 12)
on conflict ("providerZoneId") do update set name = excluded.name, "normalizedName" = excluded."normalizedName", "weekCutoffHour" = excluded."weekCutoffHour", "isActive" = true, "sourceUpdatedAt" = now(), "updatedAt" = now();
