import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && chave);

if (!supabaseConfigurado) {
  console.warn(
    '[Vau] Faltam EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo app/.env (veja o .env.example).'
  );
}

// O app não tem login: o morador usa a chave pública (anon) e as regras de RLS do banco.
export const supabase = createClient(url || 'https://exemplo.supabase.co', chave || 'sem-chave', {
  auth: { persistSession: false, autoRefreshToken: false },
});
