import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xrzliknsuhumrxrsnmtk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxpa25zdWh1bXJ4cnNubXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzEwODcsImV4cCI6MjEwMzg0NzA4N30.VggaQUxx6MLZu27YRPZXw_rcbfaLeo6MdkD40e_4JjM'
)

const { data, error } = await supabase.from('users').select('id, username').limit(5)

if (error) {
  console.error('Hata:', error)
  process.exit(1)
} else {
  console.log('Kullanıcılar:', JSON.stringify(data, null, 2))
  if (data.length > 0) {
    console.log('Test için kullan:', data[0].id)
  }
  process.exit(0)
}
