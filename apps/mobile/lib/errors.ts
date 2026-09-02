const AUTH_MESSAGES: Record<string, string> = {
  'invalid login credentials': 'E-posta veya şifre hatalı',
  'email not confirmed': 'E-postanı henüz doğrulamadın. Gelen kutundaki bağlantıya tıkla.',
  'user already registered': 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.',
  'password should be at least 6 characters': 'Şifre en az 6 karakter olmalı',
  'unable to validate email address: invalid format': 'E-posta adresi geçersiz',
  'email rate limit exceeded': 'Çok fazla deneme yapıldı, biraz bekle',
  'signups not allowed for this instance': 'Kayıtlar şu an kapalı',
  'network request failed': 'Bağlantı kurulamadı. İnterneti kontrol et.',
}

/** Supabase İngilizce hata mesajlarını kullanıcıya gösterilecek Türkçeye çevirir */
export function authErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  const known = AUTH_MESSAGES[error.message.trim().toLowerCase()]
  return known ?? error.message ?? fallback
}
