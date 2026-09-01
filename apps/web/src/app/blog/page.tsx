import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_POSTS } from '@/content/blog'
import { Chip } from '@/components/ui'
import { formatDate } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Grup kurma, session müzisyenliği, fiyatlandırma ve video çekimi üzerine müzisyenler için pratik rehberler.',
  alternates: { canonical: '/blog' },
  openGraph: { title: 'StageIn Blog', description: 'Müzisyenler için pratik rehberler.', url: '/blog' },
}

export default function BlogPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Blog</h1>
          <p className="mt-4 max-w-2xl text-lg text-text-secondary">
            Sahneye çıkmak, grup kurmak ve müzikten para kazanmak üzerine yazılar.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border border-border bg-card p-6 transition-colors duration-150 hover:border-primary"
            >
              <div className="flex flex-wrap items-center gap-2">
                {post.tags.map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>
              <h2 className="mt-4 text-2xl font-bold leading-snug tracking-tight">{post.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-text-secondary">{post.description}</p>
              <p className="mt-4 text-xs text-muted">
                {formatDate(post.publishedAt)} · {post.readingMinutes} dk okuma
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
