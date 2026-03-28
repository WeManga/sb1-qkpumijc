import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Test de connexion rapide (à supprimer après vérification)
supabase.from('invitations').select('count').then(({ data, error }) => {
  if (error) console.error("❌ Erreur de connexion Supabase:", error.message);
  else console.log("✅ Connexion Supabase réussie !");
});