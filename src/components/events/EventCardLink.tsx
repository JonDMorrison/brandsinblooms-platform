'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ReactNode } from 'react'

interface EventCardLinkProps {
  slug: string
  children: ReactNode
  className?: string
  /** Optional: Blog post context for "Continue reading" navigation */
  referrerContent?: {
    title: string
    slug: string
  }
}

/**
 * Client-side wrapper for event card links that preserves search params
 * (view and month) when navigating to event detail pages.
 *
 * When referrerContent is provided, adds blog post context to URL params
 * for dynamic "Continue reading {title}" navigation on event detail page.
 */
export function EventCardLink({ slug, children, className, referrerContent }: EventCardLinkProps) {
  const searchParams = useSearchParams()

  // Build URL with search params and optional blog referrer context
  const params = new URLSearchParams(searchParams.toString())

  if (referrerContent) {
    params.set('from', referrerContent.slug)
    params.set('fromTitle', referrerContent.title)
  }

  const href = params.toString()
    ? `/events/${slug}?${params.toString()}`
    : `/events/${slug}`

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
