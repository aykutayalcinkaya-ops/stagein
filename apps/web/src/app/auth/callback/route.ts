import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/** OAuth dönüşünde `code`'u oturuma çevirir. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/kesfet'

  if (code && isSupabaseConfigured) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/giris?error=auth`)
}
