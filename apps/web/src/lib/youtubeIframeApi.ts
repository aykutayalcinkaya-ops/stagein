declare global {
  interface Window {
    YT?: { Player: new (...args: unknown[]) => unknown }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<NonNullable<Window['YT']>> | null = null

/** YouTube IFrame Player API script'ini bir kez yükler; sonraki çağrılar aynı promise'i paylaşır. */
export function loadYoutubeIframeApi(): Promise<NonNullable<Window['YT']>> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window yok'))
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(window.YT!)
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }
  })

  return apiPromise
}
