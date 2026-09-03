import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        }
      }
    }
  )

  // Test videosu ekle
  const { data, error } = await supabase.from('videos').insert([{
    user_id: '1488cacb-c8b5-4ef1-8978-31bac7a6bf0b',
    storage_path: 'videos/test-video.mp4',
    hls_url: 'https://example.com/test.m3u8',
    thumbnail_url: 'https://xrzliknsuhumrxrsnmtk.supabase.co/storage/v1/object/public/videos/test-thumb.jpg',
    duration: 30,
    city: 'Istanbul',
    instruments: ['guitar', 'vocals'],
    genres: ['rock'],
    like_count: 5,
    view_count: 42,
  }]).select()

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({ success: true, data })
}
