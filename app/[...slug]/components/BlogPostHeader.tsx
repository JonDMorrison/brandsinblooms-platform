import Image from 'next/image'
import { User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface BlogPostHeaderProps {
  title: string
  subtitle?: string
  featuredImage?: string
  author?: {
    full_name: string
    avatar_url?: string
  } | null
  publishedAt?: string | null
}

export function BlogPostHeader({
  title,
  subtitle,
  featuredImage,
  author,
  publishedAt
}: BlogPostHeaderProps) {
  // Format the published date if available
  const formattedDate = publishedAt
    ? format(new Date(publishedAt), 'MMMM d, yyyy')
    : null

  return (
    <header className="w-full">
      {featuredImage ? (
        // Hero layout with image
        <div className="relative w-full aspect-[21/9] overflow-hidden">
          <Image
            src={featuredImage}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

          {/* Content overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 py-12 md:py-16">
              <div className="max-w-4xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xl md:text-2xl text-white/90 mb-6">
                    {subtitle}
                  </p>
                )}
                <BlogPostMetadata author={author} formattedDate={formattedDate} textColor="text-white/80" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Standard layout without image
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl md:text-2xl text-muted-foreground mb-6">
                {subtitle}
              </p>
            )}
            <BlogPostMetadata author={author} formattedDate={formattedDate} textColor="text-muted-foreground" />
          </div>
        </div>
      )}
    </header>
  )
}

interface BlogPostMetadataProps {
  author?: {
    full_name: string
    avatar_url?: string
  } | null
  formattedDate: string | null
  textColor: string
}

function BlogPostMetadata({ author, formattedDate, textColor }: BlogPostMetadataProps) {
  // Don't render if no metadata to show
  if (!author && !formattedDate) {
    return null
  }

  return (
    <div className={`flex flex-wrap items-center gap-4 text-sm ${textColor}`}>
      {author && (
        <div className="flex items-center gap-2">
          {author.avatar_url ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={author.avatar_url}
                alt={author.full_name}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <User className="w-4 h-4" />
          )}
          <span>{author.full_name}</span>
        </div>
      )}
      {formattedDate && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <time dateTime={formattedDate}>{formattedDate}</time>
        </div>
      )}
    </div>
  )
}
