import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xrzliknsuhumrxrsnmtk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxpa25zdWh1bXJ4cnNubXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzEwODcsImV4cCI6MjEwMzg0NzA4N30.VggaQUxx6MLZu27YRPZXw_rcbfaLeo6MdkD40e_4JjM'
)

// Test videosu ekle
const testVideo = {
  user_id: '1488cacb-c8b5-4ef1-8978-31bac7a6bf0b', // aykuttest user
  storage_path: 'videos/test-video.mp4',
  hls_url: 'https://example.com/test.m3u8',
  thumbnail_url: 'https://xrzliknsuhumrxrsnmtk.supabase.co/storage/v1/object/public/videos/test-thumb.jpg',
  duration: 30,
  city: 'Istanbul',
  instruments: ['guitar', 'vocals'],
  genres: ['rock'],
  like_count: 5,
  view_count: 42,
}

const { data, error } = await supabase.from('videos').insert([testVideo]).select()

if (error) {
  console.error('Hata:', error)
  process.exit(1)
} else {
  console.log('Test videosu eklendi:', data)
  process.exit(0)
}
