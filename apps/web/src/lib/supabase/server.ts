import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

/** Server Component / Route Handler için cookie tabanlı Supabase client. */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Component içinden çağrıldığında set edilemez; middleware oturumu tazeler.
        }
      },
    },
  })
}
