begin;

alter table public.projects
  add column if not exists hidden boolean not null default false;

alter table public.profiles
  add column if not exists hidden boolean not null default false;

create or replace function public.handle_profile_ban_hidden_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.is_banned = true and old.is_banned = false) then
    update public.profiles
      set hidden = true
    where id = new.id;

    update public.projects
      set hidden = true
    where author_id = new.id;
  end if;

  if (new.is_banned = false and old.is_banned = true) then
    update public.profiles
      set hidden = false
    where id = new.id;

    update public.projects
      set hidden = false
    where author_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profile_ban_hidden_sync on public.profiles;
create trigger trg_profile_ban_hidden_sync
after update of is_banned
on public.profiles
for each row
execute function public.handle_profile_ban_hidden_sync();

commit;


