import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import type { BrandLogoProps } from './types'

export function BrandLogo({ 
  brandingType, 
  logoUrl, 
  brandText, 
  logoSize, 
  className = "",
  textClassName = "font-bold text-xl" 
}: BrandLogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 hover:opacity-80 transition-opacity", className)}>
      {(brandingType === 'logo' || brandingType === 'both') && logoUrl && (
        <img 
          src={logoUrl} 
          alt="Logo" 
          className="object-contain"
          style={{ height: `${logoSize}px` }}
        />
      )}
      {(brandingType === 'text' || brandingType === 'both') && (
        <span 
          className={`${textClassName} theme-brand-text`}
          style={{ 
            color: 'var(--theme-primary)',
            fontFamily: 'var(--theme-font-heading) !important'
          }}
        >
          {brandText}
        </span>
      )}
    </Link>
  )
}