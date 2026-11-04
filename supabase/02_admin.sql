-- =========================================================
-- Log de actividad + validación de entradas
-- Correr en el SQL Editor de Supabase (después del esquema inicial)
-- =========================================================

-- Igual que is_admin() pero para los que pueden validar QR
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('empleado', 'admin'));
$$;


-- ---------- Log de actividad ----------
create table if not exists activity_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete set null,
  usuario text,
  accion text not null,
  detalle text,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;

drop policy if exists "admin lee el log" on activity_log;
create policy "admin lee el log" on activity_log for select using (is_admin());

create or replace function public.registrar(p_accion text, p_detalle text) returns void
language sql security definer set search_path = public as $$
  insert into activity_log (user_id, usuario, accion, detalle)
  values (
    auth.uid(),
    (select nombre || ' ' || apellido || ' (' || email || ')' from profiles where id = auth.uid()),
    p_accion,
    p_detalle
  );
$$;

-- nadie la puede llamar desde la app, solo los triggers y funciones de acá abajo
revoke execute on function public.registrar(text, text) from public, anon, authenticated;

create or replace function public.fecha_ar(p timestamptz) returns text
language sql stable as $$
  select to_char(p at time zone 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI');
$$;


-- Películas
create or replace function public.log_movies() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform registrar('Creó película', new.titulo);
  elsif new.activa is distinct from old.activa then
    perform registrar(case when new.activa then 'Activó película' else 'Desactivó película' end, new.titulo);
  else
    perform registrar('Modificó película', new.titulo);
  end if;
  return new;
end $$;

drop trigger if exists trg_log_movies on movies;
create trigger trg_log_movies after insert or update on movies
  for each row execute function log_movies();


-- Funciones (screenings): generate_screenings inserta de a una, así que queda una línea por función
create or replace function public.log_screenings() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  f screenings%rowtype := coalesce(new, old);
  v_texto text;
begin
  select m.titulo || ' · ' || fecha_ar(f.starts_at) || ' · ' || r.nombre into v_texto
  from movies m, rooms r
  where m.id = f.movie_id and r.id = f.room_id;

  perform registrar(case when tg_op = 'INSERT' then 'Creó función' else 'Eliminó función' end, v_texto);
  return null;
end $$;

drop trigger if exists trg_log_screenings on screenings;
create trigger trg_log_screenings after insert or delete on screenings
  for each row execute function log_screenings();


-- Precios
create or replace function public.log_settings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.valor is distinct from old.valor then
    perform registrar('Modificó precio', new.clave || ': ' || old.valor || ' → ' || new.valor);
  end if;
  return new;
end $$;

drop trigger if exists trg_log_settings on settings;
create trigger trg_log_settings after update on settings
  for each row execute function log_settings();


-- Cupones
create or replace function public.log_coupons() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform registrar('Creó cupón', new.tipo || ' ' || new.porcentaje || '%');
  else
    perform registrar('Modificó cupón',
      new.tipo || ': ' || old.porcentaje || '% → ' || new.porcentaje || '%'
      || case when new.activo then '' else ' (desactivado)' end);
  end if;
  return new;
end $$;

drop trigger if exists trg_log_coupons on coupons;
create trigger trg_log_coupons after insert or update on coupons
  for each row execute function log_coupons();


-- ---------- Validación de entradas (empleados) ----------
alter table tickets add column if not exists validado_por uuid references auth.users;

-- Acepta el token completo (lo que lee el QR) o los primeros 8 caracteres (carga manual)
create or replace function public.validar_entrada(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_codigo text := lower(trim(p_codigo));
  v_cant int;
  v_ticket tickets%rowtype;
  v_inicio timestamptz;
  v_info jsonb;
begin
  if not is_staff() then
    raise exception 'No tenés permiso para validar entradas';
  end if;
  if v_codigo !~ '^[0-9a-f-]{8,36}$' then
    raise exception 'Código inválido';
  end if;

  select count(*) into v_cant from tickets where qr_token::text like v_codigo || '%';
  if v_cant = 0 then
    raise exception 'No existe ninguna entrada con ese código';
  elsif v_cant > 1 then
    raise exception 'Hay más de una entrada con ese código, ingresalo completo';
  end if;

  -- for update: si dos empleados escanean la misma entrada a la vez, el segundo espera
  select * into v_ticket from tickets where qr_token::text like v_codigo || '%' for update;

  if v_ticket.estado = 'cancelada' then
    raise exception 'Esta entrada fue cancelada';
  end if;
  if v_ticket.validado_at is not null then
    raise exception 'Esta entrada ya fue usada (%)', fecha_ar(v_ticket.validado_at);
  end if;

  -- Solo se puede usar el día de la función. Se chequea ANTES de marcarla,
  -- si no una entrada para otro día quedaría quemada.
  select starts_at into v_inicio from screenings where id = v_ticket.screening_id;
  if (v_inicio at time zone 'America/Argentina/Buenos_Aires')::date
     <> (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'Esta entrada es para otro día: %', fecha_ar(v_inicio);
  end if;

  update tickets set validado_at = now(), validado_por = auth.uid() where id = v_ticket.id;

  select jsonb_build_object(
    'titulo', m.titulo,
    'sala', r.nombre,
    'starts_at', sc.starts_at,
    'edad_minima', m.edad_minima,
    'tipo', s.tipo
  ) into v_info
  from screenings sc
  join movies m on m.id = sc.movie_id
  join rooms r on r.id = sc.room_id
  join seats s on s.id = v_ticket.seat_id
  where sc.id = v_ticket.screening_id;

  perform registrar('Validó entrada', '#' || v_ticket.id || ' · ' || (v_info ->> 'titulo') || ' · ' || (v_info ->> 'sala'));
  return v_info;
end $$;

grant execute on function public.validar_entrada(text) to authenticated;
