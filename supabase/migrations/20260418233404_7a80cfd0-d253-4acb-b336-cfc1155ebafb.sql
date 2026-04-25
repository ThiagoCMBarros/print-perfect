INSERT INTO public.integration_settings (category, key, value, is_sensitive)
VALUES ('branding', 'logo_url_dark', '""'::jsonb, false)
ON CONFLICT DO NOTHING;