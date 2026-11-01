-- Plusieurs bols dans une même commande (un prénom, un numéro).
alter table pm_orders add column if not exists bowls jsonb not null default '[]'::jsonb;

create or replace function pm_order_create_multi(p_token text, p_kiosk int, p_name text, p_bowls jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_num int; v_cook text; b jsonb := p_bowls->0;
begin
  perform pm_auth(p_token);
  if jsonb_typeof(p_bowls) <> 'array' or jsonb_array_length(p_bowls) < 1 then raise exception 'empty_order'; end if;
  update pm_settings set next_num = next_num + 1 where id = 1 returning next_num - 1, active_cook into v_num, v_cook;
  insert into pm_orders (num, kiosk, name, base, legumes, proteine, qty, tips, extras, bowls)
  values (v_num, coalesce(p_kiosk, 1), p_name, b->>'base',
          coalesce(array(select jsonb_array_elements_text(b->'legumes')), '{}'),
          b->>'proteine', coalesce((b->>'qty')::int, 2),
          coalesce(array(select jsonb_array_elements_text(b->'tips')), '{}'),
          coalesce(array(select jsonb_array_elements_text(b->'extras')), '{}'),
          p_bowls);
  return jsonb_build_object('num', v_num, 'cook', v_cook);
end $$;

revoke execute on function pm_order_create_multi(text,int,text,jsonb) from public, authenticated;
grant execute on function pm_order_create_multi(text,int,text,jsonb) to anon;
