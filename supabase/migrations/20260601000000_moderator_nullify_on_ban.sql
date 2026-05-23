-- Moderator role nullification when a user is banned
-- If a user becomes banned (profiles.is_banned = true), remove their moderator role.

create or replace function public.handle_profile_ban_moderator_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act on transitions to banned
  if (new.is_banned = true and old.is_banned = false) then
    delete from public.user_roles
    where user_id = new.id
      and role_name = 'moderator'::public.app_role;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_moderator_nullify_on_ban on public.profiles;
create trigger trg_moderator_nullify_on_ban
after update of is_banned on public.profiles
for each row
execute function public.handle_profile_ban_moderator_role();

