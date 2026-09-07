import { Suspense } from 'react'
import { AuthForm } from '@/components/AuthForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </div>
  )
}
