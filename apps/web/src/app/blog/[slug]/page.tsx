import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BLOG_POSTS, getPost } from '@/content/blog'
import { Chip } from '@/components/ui'
import { SITE_URL, formatDate } from '@/lib/site'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)

  if (!post) return { title: 'Yazı bulunamadı', robots: { index: false } }

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} | StageIn`,
      description: post.description,
      type: 'article',
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
  }
}

export default async function BlogYaziPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPost(slug)

  if (!post) notFound()

  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: 'StageIn', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    keywords: post.tags.join(', '),
  }

  return (
    <div className="bg-surface">
      <article className="mx-auto max-w-2xl px-4 py-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <Link href="/blog" className="text-sm text-muted underline underline-offset-4 hover:text-white">
          Bloga dön
        </Link>

        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{post.title}</h1>

        <p className="mt-5 text-sm text-muted">
          {post.author} · {formatDate(post.publishedAt)} · {post.readingMinutes} dk okuma
        </p>

        <div className="mt-10 flex flex-col gap-6">
          {post.blocks.map((block, index) => {
            if (block.type === 'h2') {
              return (
                <h2 key={index} className="mt-4 text-2xl font-bold tracking-tight">
                  {block.text}
                </h2>
              )
            }
            if (block.type === 'list') {
              return (
                <ul key={index} className="flex flex-col gap-3">
                  {block.items?.map((item) => (
                    <li key={item} className="border-l-2 border-border pl-4 text-lg leading-relaxed text-text-secondary">
                      {item}
                    </li>
                  ))}
                </ul>
              )
            }
            return (
              <p key={index} className="text-lg leading-relaxed text-text-secondary">
                {block.text}
              </p>
            )
          })}
        </div>

        {others.length ? (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="text-xl font-bold tracking-tight">Devamı</h2>
            <div className="mt-5 flex flex-col gap-3">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={`/blog/${other.slug}`}
                  className="rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-primary"
                >
                  <span className="block font-bold">{other.title}</span>
                  <span className="mt-1 block text-sm text-muted">{other.readingMinutes} dk okuma</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  )
}
