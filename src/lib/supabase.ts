import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read public credentials from Vite environment with default fallback
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ncozsxmnbomhqusuumxn.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_oTFMnilx9nmSUYrI2V7hJA_iPBZwzyP';

let clientInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '');
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Error al inicializar cliente de Supabase:', err);
      return null;
    }
  }
  return clientInstance;
};

// Direct export for standard usage
export const supabase = getSupabaseClient();
