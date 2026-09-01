import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthForm } from '@/components/AuthForm'

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'StageIn hesabınla giriş yap veya yeni hesap oluştur.',
  robots: { index: false },
}

export default function GirisPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-20 lg:flex-row lg:items-start lg:gap-20">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Sahneye
          <br />
          geri dön.
        </h1>
        <p className="mt-5 text-lg text-text-secondary">
          Hesabın varsa giriş yap. Yoksa üç alanla hesap aç — profilinin gerisini uygulamada tamamlarsın.
        </p>

        <ul className="mt-8 flex flex-col gap-3 text-sm text-text-secondary">
          <li className="border-l-2 border-primary pl-4">Videolarını yükle, şehrinde keşfedil</li>
          <li className="border-l-2 border-border pl-4">İlan ver, başvuruları doğrudan al</li>
          <li className="border-l-2 border-border pl-4">Mesajlaş, sesli not gönder</li>
        </ul>
      </div>

      <div className="flex w-full justify-center lg:justify-end">
        <Suspense fallback={<div className="h-96 w-full max-w-md rounded-xl border border-border bg-card" />}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  )
}
