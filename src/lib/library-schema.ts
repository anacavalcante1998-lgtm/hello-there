/**
 * SQL inicial da biblioteca. Copie e execute no SQL Editor do projeto Supabase.
 * Este arquivo fica em src/lib porque o repositório não aceita migrations fora de src/.
 * Não contém service_role nem qualquer credencial.
 */
export const LIBRARY_SCHEMA_SQL = String.raw`
create extension if not exists pgcrypto;

do $$ begin
  create type public.library_role as enum ('admin', 'reader');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.book_status as enum ('draft', 'published');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.library_role not null default 'reader',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon_name text,
  image_path text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  description text,
  status public.book_status not null default 'draft',
  allow_download boolean not null default false,
  is_featured boolean not null default false,
  cover_path text,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_categories (
  book_id uuid not null references public.books(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (book_id, category_id)
);

create table if not exists public.book_files (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  bucket_id text not null default 'library-pdfs' check (bucket_id = 'library-pdfs'),
  object_path text not null unique,
  original_filename text not null,
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum text,
  is_current boolean not null default true,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists book_files_one_current_per_book
  on public.book_files(book_id) where is_current;
create index if not exists categories_parent_sort_idx
  on public.categories(parent_id, sort_order);
create index if not exists book_categories_category_sort_idx
  on public.book_categories(category_id, sort_order);
create index if not exists books_published_recent_idx
  on public.books(published_at desc) where status = 'published';
create index if not exists books_featured_idx
  on public.books(is_featured, published_at desc) where status = 'published';
create index if not exists books_title_search_idx on public.books using btree (lower(title));
create index if not exists books_author_search_idx on public.books using btree (lower(author));

create or replace function public.set_library_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_library_updated_at();
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_library_updated_at();
drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at before update on public.books
for each row execute function public.set_library_updated_at();

create or replace function public.handle_new_library_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_library_profile on auth.users;
create trigger on_auth_user_created_library_profile
after insert on auth.users
for each row execute function public.handle_new_library_user();

create or replace function public.is_library_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'admin'::public.library_role
  );
$$;

grant execute on function public.is_library_admin() to anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.categories, public.books, public.book_categories, public.book_files to anon, authenticated;
grant insert, update, delete on public.categories, public.books, public.book_categories, public.book_files to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.book_categories enable row level security;
alter table public.book_files enable row level security;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_library_admin());

drop policy if exists categories_read_active on public.categories;
create policy categories_read_active on public.categories
for select to anon, authenticated
using (is_active or public.is_library_admin());
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
for all to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

drop policy if exists books_read_published on public.books;
create policy books_read_published on public.books
for select to anon, authenticated
using (status = 'published' or public.is_library_admin());
drop policy if exists books_admin_write on public.books;
create policy books_admin_write on public.books
for all to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

drop policy if exists book_categories_read_visible_books on public.book_categories;
create policy book_categories_read_visible_books on public.book_categories
for select to anon, authenticated
using (
  exists (
    select 1 from public.books as b
    where b.id = book_id
      and (b.status = 'published' or public.is_library_admin())
  )
);
drop policy if exists book_categories_admin_write on public.book_categories;
create policy book_categories_admin_write on public.book_categories
for all to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

drop policy if exists book_files_read_visible_books on public.book_files;
create policy book_files_read_visible_books on public.book_files
for select to anon, authenticated
using (
  exists (
    select 1 from public.books as b
    where b.id = book_id
      and (b.status = 'published' or public.is_library_admin())
  )
  and (is_current or public.is_library_admin())
);
drop policy if exists book_files_admin_write on public.book_files;
create policy book_files_admin_write on public.book_files
for all to authenticated
using (public.is_library_admin())
with check (public.is_library_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('library-pdfs', 'library-pdfs', false, 104857600, array['application/pdf']),
  ('library-covers', 'library-covers', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists library_pdfs_read_published on storage.objects;
create policy library_pdfs_read_published on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'library-pdfs'
  and exists (
    select 1
    from public.book_files as f
    join public.books as b on b.id = f.book_id
    where f.bucket_id = storage.objects.bucket_id
      and f.object_path = storage.objects.name
      and f.is_current
      and (b.status = 'published' or public.is_library_admin())
  )
);
drop policy if exists library_pdfs_admin_insert on storage.objects;
create policy library_pdfs_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'library-pdfs' and public.is_library_admin());
drop policy if exists library_pdfs_admin_update on storage.objects;
create policy library_pdfs_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'library-pdfs' and public.is_library_admin())
with check (bucket_id = 'library-pdfs' and public.is_library_admin());
drop policy if exists library_pdfs_admin_delete on storage.objects;
create policy library_pdfs_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'library-pdfs' and public.is_library_admin());

drop policy if exists library_covers_read_published on storage.objects;
create policy library_covers_read_published on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'library-covers'
  and exists (
    select 1 from public.books as b
    where b.cover_path = storage.objects.name
      and (b.status = 'published' or public.is_library_admin())
  )
);
drop policy if exists library_covers_admin_insert on storage.objects;
create policy library_covers_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'library-covers' and public.is_library_admin());
drop policy if exists library_covers_admin_update on storage.objects;
create policy library_covers_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'library-covers' and public.is_library_admin())
with check (bucket_id = 'library-covers' and public.is_library_admin());
drop policy if exists library_covers_admin_delete on storage.objects;
create policy library_covers_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'library-covers' and public.is_library_admin());
`;
