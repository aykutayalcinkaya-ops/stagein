import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './env'

const PROTECTED_PREFIXES = ['/kesfet', '/mesajlar', '/profil/ayarlar']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/giris'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/giris') {
    const url = request.nextUrl.clone()
    url.pathname = '/kesfet'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
