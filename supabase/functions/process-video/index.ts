import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { video_id, storage_path } = await req.json()
  // TODO: FFmpeg HLS dönüşümü burada gerçekleşecek (Faz 2)
  // Şimdilik storage_path'i hls_url olarak kaydet
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  await fetch(`${supabaseUrl}/rest/v1/videos?id=eq.${video_id}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ hls_url: `${supabaseUrl}/storage/v1/object/public/videos/${storage_path}` })
  })
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})
