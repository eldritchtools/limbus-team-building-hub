-- This runs whenever a new user is created in auth.users
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username)
  values (new.id, null)  -- you can fill username later
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
