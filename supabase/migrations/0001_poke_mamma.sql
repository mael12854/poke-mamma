-- Poké Mamma : tables + fonctions. Tout passe par des fonctions qui
-- vérifient un jeton serveur (PM_API_TOKEN) ; les tables ne sont pas
-- lisibles directement avec la clé publique.

create table pm_secret (id int primary key default 1 check (id = 1), token text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''));
insert into pm_secret default values;

create table pm_settings (id int primary key default 1 check (id = 1), next_num int not null default 1, active_cook text not null default 'Maël');
insert into pm_settings default values;

create table pm_openings (
  id bigserial primary key,
  day date not null,
  time text not null check (time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  seats int not null check (seats >= 0),
  created_at timestamptz not null default now()
);

create table pm_requests (
  id bigserial primary key,
  opening_id bigint references pm_openings(id) on delete set null,
  name text not null check (char_length(name) between 1 and 60),
  people int not null check (people between 1 and 30),
  status text not null default 'pending' check (status in ('pending','accepted','refused')),
  note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table pm_orders (
  id bigserial primary key,
  num int not null,
  kiosk int not null default 1,
  name text not null,
  base text,
  legumes text[] not null default '{}',
  proteine text,
  qty int not null default 2,
  tips text[] not null default '{}',
  extras text[] not null default '{}',
  status text not null default 'new' check (status in ('new','cooking','ready','served')),
  cook text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table pm_secret enable row level security;
alter table pm_settings enable row level security;
alter table pm_openings enable row level security;
alter table pm_requests enable row level security;
alter table pm_orders enable row level security;
revoke all on pm_secret, pm_settings, pm_openings, pm_requests, pm_orders from anon, authenticated;

create function pm_auth(p_token text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_token is null or not exists (select 1 from pm_secret where token = p_token) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
end $$;

create function pm_booked(p_opening bigint) returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(people), 0)::int from pm_requests where opening_id = p_opening and status = 'accepted';
$$;

create function pm_state(p_token text) returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  perform pm_auth(p_token);
  select jsonb_build_object(
    'settings', (select to_jsonb(s) - 'id' from pm_settings s),
    'openings', coalesce((select jsonb_agg(to_jsonb(o) || jsonb_build_object('booked', pm_booked(o.id)) order by o.day, o.time) from pm_openings o), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at desc) from pm_requests q), '[]'::jsonb),
    'orders', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from pm_orders x
                where x.status <> 'served'
                   or (x.created_at at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date), '[]'::jsonb)
  ) into r;
  return r;
end $$;

create function pm_order_create(p_token text, p_kiosk int, p_order jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_num int; v_cook text;
begin
  perform pm_auth(p_token);
  update pm_settings set next_num = next_num + 1 where id = 1 returning next_num - 1, active_cook into v_num, v_cook;
  insert into pm_orders (num, kiosk, name, base, legumes, proteine, qty, tips, extras)
  values (v_num, coalesce(p_kiosk, 1), p_order->>'name', p_order->>'base',
          coalesce(array(select jsonb_array_elements_text(p_order->'legumes')), '{}'),
          p_order->>'proteine', coalesce((p_order->>'qty')::int, 2),
          coalesce(array(select jsonb_array_elements_text(p_order->'tips')), '{}'),
          coalesce(array(select jsonb_array_elements_text(p_order->'extras')), '{}'));
  return jsonb_build_object('num', v_num, 'cook', v_cook);
end $$;

create function pm_order_advance(p_token text, p_id bigint, p_cook text) returns void language plpgsql security definer set search_path = public as $$
begin
  perform pm_auth(p_token);
  update pm_orders set
    status = case status when 'new' then 'cooking' when 'cooking' then 'ready' when 'ready' then 'served' else status end,
    cook = case when status = 'new' then p_cook else cook end,
    updated_at = now()
  where id = p_id;
end $$;

create function pm_set_cook(p_token text, p_cook text) returns void language plpgsql security definer set search_path = public as $$
begin
  perform pm_auth(p_token);
  update pm_settings set active_cook = p_cook where id = 1;
end $$;

create function pm_reset_counter(p_token text) returns void language plpgsql security definer set search_path = public as $$
begin
  perform pm_auth(p_token);
  update pm_settings set next_num = 1 where id = 1;
end $$;

create function pm_request_create(p_token text, p_opening bigint, p_name text, p_people int) returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  perform pm_auth(p_token);
  if not exists (select 1 from pm_openings where id = p_opening) then
    raise exception 'opening_not_found';
  end if;
  insert into pm_requests (opening_id, name, people) values (p_opening, p_name, p_people) returning id into v_id;
  return v_id;
end $$;

create function pm_request_decide(p_token text, p_id bigint, p_status text, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare v_req pm_requests; v_seats int;
begin
  perform pm_auth(p_token);
  select * into v_req from pm_requests where id = p_id for update;
  if not found then raise exception 'request_not_found'; end if;
  if p_status = 'accepted' and v_req.status <> 'accepted' then
    select seats into v_seats from pm_openings where id = v_req.opening_id for update;
    if v_seats is null then raise exception 'opening_not_found'; end if;
    if v_seats - pm_booked(v_req.opening_id) < v_req.people then raise exception 'not_enough_seats'; end if;
  end if;
  update pm_requests set
    status = p_status,
    note = case when p_status = 'pending' then null else nullif(trim(coalesce(p_note, '')), '') end,
    decided_at = case when p_status = 'pending' then null else now() end
  where id = p_id;
end $$;

create function pm_opening_save(p_token text, p_id bigint, p_day date, p_time text, p_seats int) returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  perform pm_auth(p_token);
  if p_id is null then
    insert into pm_openings (day, time, seats) values (p_day, p_time, p_seats) returning id into v_id;
  else
    perform 1 from pm_openings where id = p_id for update;
    if p_seats < pm_booked(p_id) then raise exception 'seats_below_booked'; end if;
    update pm_openings set day = p_day, time = p_time, seats = p_seats where id = p_id returning id into v_id;
  end if;
  return v_id;
end $$;

create function pm_opening_delete(p_token text, p_id bigint) returns void language plpgsql security definer set search_path = public as $$
begin
  perform pm_auth(p_token);
  delete from pm_openings where id = p_id;
end $$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function pm_state(text), pm_order_create(text,int,jsonb), pm_order_advance(text,bigint,text),
  pm_set_cook(text,text), pm_reset_counter(text), pm_request_create(text,bigint,text,int),
  pm_request_decide(text,bigint,text,text), pm_opening_save(text,bigint,date,text,int), pm_opening_delete(text,bigint)
  to anon;
