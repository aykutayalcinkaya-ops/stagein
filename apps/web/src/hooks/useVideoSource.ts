'use client'

import { useEffect, useState } from 'react'
import type { Video } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export function useVideoSource(video: Video) {
  const [src, setSrc] = useState<string | null>(video.hls_url && video.hls_url.startsWith('/') ? video.hls_url : null)

  useEffect(() => {
    if (video.storage_path?.startsWith('demo/')) {
      setSrc(video.hls_url)
      return
    }

    // HLS'i yalnızca yerel destek varsa (Safari) kullan; diğer tarayıcılarda ham dosyaya düş.
    const el = document.createElement('video')
    const canPlayHls = el.canPlayType('application/vnd.apple.mpegurl') !== ''

    if (video.hls_url && canPlayHls) {
      setSrc(video.hls_url)
      return
    }

    if (!isSupabaseConfigured || !video.storage_path) return
    const { data } = createClient().storage.from('videos').getPublicUrl(video.storage_path)
    setSrc(data.publicUrl)
  }, [video.hls_url, video.storage_path])

  return src
}
