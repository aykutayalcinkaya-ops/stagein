'use client'

import type { ProfileLink } from '@stagein/shared'

export function ProfileLinkList({ links }: { links: ProfileLink[] }) {
  if (links.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold tracking-tight">Linkler</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:border-primary hover:text-white"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
