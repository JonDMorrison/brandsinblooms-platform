'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ReactNode } from 'react'

interface EventCardLinkProps {
  slug: string
  children: ReactNode
  className?: string
}

/**
 * Client-side wrapper for event card links that preserves search params
 * (view and month) when navigating to event detail pages
 */
export function EventCardLink({ slug, children, className }: EventCardLinkProps) {
  const searchParams = useSearchParams()

  // Preserve search params when navigating to event detail
  const href = searchParams.toString()
    ? `/events/${slug}?${searchParams.toString()}`
    : `/events/${slug}`

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
