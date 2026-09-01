import { LinkButton } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center">
      <p className="text-7xl font-black tracking-tight text-primary">404</p>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Bu sahne boş</h1>
      <p className="mt-4 text-lg text-text-secondary">
        Aradığın sayfa kaldırılmış ya da hiç var olmamış olabilir. İlanlara göz atmayı dene.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/ilanlar">İlanlar</LinkButton>
        <LinkButton href="/" variant="outline">
          Ana sayfa
        </LinkButton>
      </div>
    </div>
  )
}
