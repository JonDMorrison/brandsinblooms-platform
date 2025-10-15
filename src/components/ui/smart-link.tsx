/**
 * SmartLink component
 * Automatically uses Next.js Link for internal navigation and <a> tag for external links
 * Normalizes URLs and adds appropriate attributes for external links
 */

import React from 'react'
import Link from 'next/link'
import { isExternalUrl, normalizeUrl } from '@/src/lib/utils/links'

interface SmartLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  'aria-label'?: string
  title?: string
}

export function SmartLink({
  href,
  children,
  className = '',
  style,
  onClick,
  'aria-label': ariaLabel,
  title
}: SmartLinkProps) {
  // Normalize the URL (add https:// to www.example.com, etc.)
  const normalizedHref = normalizeUrl(href)

  // Check if the normalized URL is external
  const isExternal = isExternalUrl(normalizedHref)

  // For external links, use regular <a> tag with target="_blank"
  if (isExternal) {
    return (
      <a
        href={normalizedHref}
        className={className}
        style={style}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        title={title}
      >
        {children}
      </a>
    )
  }

  // For internal links, use Next.js Link for client-side navigation
  return (
    <Link
      href={normalizedHref}
      className={className}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </Link>
  )
}
