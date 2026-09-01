export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (__DEV__ && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.warn('[StageIn] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY tanimli degil. .env dosyasini olustur.')
}
