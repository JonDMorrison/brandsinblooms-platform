import Link from 'next/link'
import Image from 'next/image'
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
    <Link href="/home" className={cn("flex items-center gap-2 hover:opacity-80 transition-opacity", className)}>
      {(brandingType === 'logo' || brandingType === 'both') && logoUrl && (
        <Image 
          src={logoUrl} 
          alt="Logo" 
          width={logoSize}
          height={logoSize}
          className="object-contain"
          style={{ height: `${logoSize}px`, width: 'auto' }}
          priority={true}
          unoptimized={true}
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