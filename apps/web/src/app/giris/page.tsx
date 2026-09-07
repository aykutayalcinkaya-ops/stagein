import { Suspense } from 'react'
import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-display text-2xl uppercase tracking-wide"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Stage<span className="text-primary">In</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_48px_-24px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-8">
          <Suspense fallback={null}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
