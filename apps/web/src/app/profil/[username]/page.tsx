import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Chip, EmptyState } from '@/components/ui'
import { UserAvatar } from '@/components/UserAvatar'
import { ProfileHeaderActions } from '@/components/ProfileHeaderActions'
import { ProfileLinkList } from '@/components/ProfileLinkList'
import { PostCard } from '@/components/PostCard'
import {
  getEndorsements,
  getMusicianProfile,
  getProfileLinks,
  getUserByUsername,
  getUserListings,
  getUserPosts,
  getUserVideos,
} from '@/lib/data'
import { EXPERIENCE_LABELS, LISTING_TYPE_LABELS, SITE_URL, formatDate, sumReactions } from '@/lib/site'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const user = await getUserByUsername(username)

  if (!user) return { title: 'Profil bulunamadı', robots: { index: false } }

  const profile = await getMusicianProfile(user.id)
  const name = user.full_name ?? user.username
  const instruments = profile?.instruments?.slice(0, 3).join(', ')

  const title = `${name}${instruments ? ` — ${instruments}` : ''}${user.city ? ` · ${user.city}` : ''}`
  const description =
    user.bio?.slice(0, 160) ??
    `${name}, StageIn üzerinde ${user.city ?? 'Türkiye'} bölgesinde${instruments ? ` ${instruments} çalıyor` : ' müzik yapıyor'}. Videolarını izle, doğrudan iletişime geç.`

  return {
    title,
    description,
    alternates: { canonical: `/profil/${user.username}` },
    openGraph: {
      title: `${title} | StageIn`,
      description,
      type: 'profile',
      url: `/profil/${user.username}`,
      images: user.avatar_url ? [{ url: user.avatar_url }] : undefined,
    },
  }
}

export default async function ProfilPage({ params }: PageProps) {
  const { username } = await params
  const user = await getUserByUsername(username)

  if (!user) notFound()

  const [profile, videos, listings, endorsements, links, posts] = await Promise.all([
    getMusicianProfile(user.id),
    getUserVideos(user.id),
    getUserListings(user.id),
    getEndorsements(user.id),
    getProfileLinks(user.id),
    getUserPosts(user.id),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: user.full_name ?? user.username,
      alternateName: user.username,
      description: user.bio ?? undefined,
      image: user.avatar_url ?? undefined,
      url: `${SITE_URL}/profil/${user.username}`,
      address: user.city ? { '@type': 'PostalAddress', addressLocality: user.city, addressCountry: 'TR' } : undefined,
    },
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="flex flex-col gap-6 border-b border-border pb-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar name={user.full_name} username={user.username} url={user.avatar_url} size={96} />
          <div>
            <h1 className="text-4xl font-black tracking-tight">{user.full_name ?? user.username}</h1>
            <p className="mt-1 text-base text-text-secondary">@{user.username}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user.city ? <Chip tone="primary">{user.city}</Chip> : null}
              {profile?.experience_level ? <Chip>{EXPERIENCE_LABELS[profile.experience_level]}</Chip> : null}
              {profile?.is_open_to_gig ? <Chip tone="accent">İşe açık</Chip> : null}
            </div>
          </div>
        </div>

        <ProfileHeaderActions username={user.username} />
      </header>

      <ProfileLinkList links={links} />

      {user.bio ? <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">{user.bio}</p> : null}

      {profile && (profile.instruments.length > 0 || profile.genres.length > 0) ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted">Enstrümanlar</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.instruments.length ? (
                profile.instruments.map((i) => <Chip key={i}>{i}</Chip>)
              ) : (
                <span className="text-sm text-text-secondary">Belirtilmedi</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted">Tarzlar</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.genres.length ? (
                profile.genres.map((g) => <Chip key={g}>{g}</Chip>)
              ) : (
                <span className="text-sm text-text-secondary">Belirtilmedi</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">Videolar</h2>
        {videos.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Henüz video yok" description="Bu müzisyen henüz performans videosu paylaşmamış." />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map((video) => (
              <div key={video.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="aspect-[9/16] w-full bg-surface">
                  {video.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">Önizleme yok</div>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-xs text-muted">
                  <span>{video.view_count} izlenme</span>
                  <span>{sumReactions(video.reactions)} reaksiyon</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">Gönderiler</h2>
        {posts.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Henüz gönderi yok" description="Bu müzisyen henüz duvarda paylaşım yapmamış." />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {listings.length ? (
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">Açık ilanlar</h2>
          <div className="mt-6 flex flex-col gap-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/ilanlar/${listing.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-primary"
              >
                <span>
                  <span className="block font-bold">{listing.title}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {LISTING_TYPE_LABELS[listing.type] ?? listing.type}
                    {listing.city ? ` · ${listing.city}` : ''}
                  </span>
                </span>
                <span className="text-sm text-text-secondary">Detay</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {endorsements.length ? (
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">Referanslar</h2>
          <div className="mt-6 flex flex-col gap-3">
            {endorsements.map((e) => (
              <div key={e.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={e.from_user?.full_name}
                    username={e.from_user?.username}
                    url={e.from_user?.avatar_url}
                    size={32}
                  />
                  <span className="text-sm font-semibold">
                    {e.from_user?.full_name ?? e.from_user?.username ?? 'Müzisyen'}
                  </span>
                  <span className="ml-auto text-xs text-muted">{formatDate(e.created_at)}</span>
                </div>
                {e.note ? <p className="mt-3 text-sm leading-relaxed text-text-secondary">{e.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
