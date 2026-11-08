-- =========================================================
-- Cupón para mayores de 50 + top de películas más vendidas
-- =========================================================

-- Igual que antes, solo cambia la parte de cupones (ver comentario más abajo)
create or replace function public.quote_purchase(p_screening integer, p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_sc screenings%rowtype;
  v_edad_min int;
  v_nacimiento date;
  v_normal numeric;
  v_vip numeric;
  v_cant int;
  v_cant_vip int;
  v_subtotal numeric;
  v_desc numeric := 0;
  v_pct int := 0;
  v_coupon int;
  v_tipo text;
begin
  if length(coalesce(p_token, '')) < 16 then raise exception 'Token inválido'; end if;

  select * into v_sc from screenings where id = p_screening;
  if not found or v_sc.starts_at <= now() then
    raise exception 'La función ya no está disponible';
  end if;

  if v_uid is not null then
    select fecha_nacimiento into v_nacimiento from profiles where id = v_uid;
  end if;

  -- Restricción de edad
  select edad_minima into v_edad_min from movies where id = v_sc.movie_id;
  if v_edad_min > 0 then
    if v_uid is null then
      raise exception 'Esta película es para mayores de % años. Iniciá sesión para verificar tu edad.', v_edad_min;
    end if;
    if extract(year from age(current_date, v_nacimiento)) < v_edad_min then
      raise exception 'Tenés que tener al menos % años para comprar entradas de esta película.', v_edad_min;
    end if;
  end if;

  select valor into v_normal from settings where clave = 'precio_entrada';
  select valor into v_vip from settings where clave = 'precio_vip';

  select count(*),
         count(*) filter (where s.tipo = 'vip'),
         coalesce(sum(case s.tipo when 'vip' then v_vip else v_normal end), 0)
    into v_cant, v_cant_vip, v_subtotal
  from seat_holds h join seats s on s.id = h.seat_id
  where h.screening_id = p_screening and h.holder = md5(p_token) and h.expires_at > now();

  if v_cant = 0 then
    raise exception 'No tenés butacas reservadas (o la reserva venció). Volvé a elegirlas.';
  end if;

  -- Cupones (solo usuarios registrados):
  --   primera_compra -> si nunca compró
  --   mayores_50     -> si tiene 50 años o más
  -- Si le corresponden los dos se aplica el de mayor porcentaje, no se suman.
  if v_uid is not null then
    select id, porcentaje, tipo into v_coupon, v_pct, v_tipo
    from coupons
    where activo
      and (
        (tipo = 'primera_compra' and not exists (select 1 from orders where user_id = v_uid))
        or (tipo = 'mayores_50' and extract(year from age(current_date, v_nacimiento)) >= 50)
      )
    order by porcentaje desc
    limit 1;

    if v_coupon is not null then
      v_desc := round(v_subtotal * v_pct / 100.0, 2);
    else
      v_pct := 0;
    end if;
  end if;

  return jsonb_build_object(
    'subtotal', v_subtotal,
    'descuento', v_desc,
    'total', v_subtotal - v_desc,
    'porcentaje', v_pct,
    'coupon_id', v_coupon,
    'cupon_tipo', v_tipo,
    'cantidad', v_cant,
    'cantidad_vip', v_cant_vip
  );
end $$;


-- ---------- Películas más vendidas ----------
-- security definer porque tickets solo deja ver las entradas propias
create or replace function public.top_peliculas(p_cant int default 3)
returns table (movie_id int, vendidas bigint)
language sql stable security definer set search_path = public as $$
  select sc.movie_id, count(*) as vendidas
  from tickets t
  join screenings sc on sc.id = t.screening_id
  join movies m on m.id = sc.movie_id
  where t.estado = 'activa' and m.activa
  group by sc.movie_id
  order by vendidas desc
  limit p_cant;
$$;

grant execute on function public.top_peliculas(int) to anon, authenticated;
