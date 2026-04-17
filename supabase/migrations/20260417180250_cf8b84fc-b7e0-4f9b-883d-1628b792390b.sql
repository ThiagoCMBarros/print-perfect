INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'thiago.carelli@vespera.com.br'
ON CONFLICT DO NOTHING;