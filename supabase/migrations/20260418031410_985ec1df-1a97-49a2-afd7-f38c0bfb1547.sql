insert into storage.buckets (id, name, public) values ('quote-references', 'quote-references', true) on conflict (id) do nothing;

create policy "Public can read quote references"
on storage.objects for select
using (bucket_id = 'quote-references');

create policy "Anyone can upload quote references"
on storage.objects for insert
with check (bucket_id = 'quote-references');