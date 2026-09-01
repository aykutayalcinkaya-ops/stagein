import * as AppleAuthentication from 'expo-apple-authentication'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@stagein/supabase'

WebBrowser.maybeCompleteAuthSession()

/**
 * @stagein/supabase'deki signInWithGoogle web akışı için yazılmış (yönlendirme yapar).
 * Native'de tarayıcı oturumunu kendimiz açıp dönen token'ları istemciye yazıyoruz.
 */
export async function signInWithGoogleNative() {
  const redirectTo = Linking.createURL('/auth-callback')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  })
  if (error) throw error
  if (!data.url) throw new Error('Google oturum adresi alınamadı')

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== 'success') return null

  const { params, errorCode } = extractParams(result.url)
  if (errorCode) throw new Error(errorCode)

  if (params.access_token && params.refresh_token) {
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    })
    if (sessionError) throw sessionError
    return sessionData.session
  }

  if (params.code) {
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(
      params.code
    )
    if (sessionError) throw sessionError
    return sessionData.session
  }

  throw new Error('Google oturumu tamamlanamadı')
}

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  })
  if (!credential.identityToken) throw new Error('Apple kimlik doğrulaması tamamlanamadı')

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  })
  if (error) throw error
  return data.session
}

function extractParams(url: string) {
  const parsed = Linking.parse(url)
  // Implicit flow token'ları fragment'te döner; RN'de URLSearchParams.entries yok
  const fragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : ''
  const params: Record<string, string> = {}
  for (const pair of fragment.split('&')) {
    if (!pair) continue
    const [key, value = ''] = pair.split('=')
    params[decodeURIComponent(key)] = decodeURIComponent(value)
  }

  for (const [key, value] of Object.entries(parsed.queryParams ?? {})) {
    if (typeof value === 'string') params[key] = value
  }
  return { params, errorCode: params.error_description ?? params.error }
}
