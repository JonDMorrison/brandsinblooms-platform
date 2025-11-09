'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { EventWithRelations } from '@/src/lib/queries/domains/events'
import { Calendar, MapPin, Clock, Download, ArrowLeft, FileText } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card'
import { format } from 'date-fns'

interface EventDetailPageProps {
  event: EventWithRelations
  siteId: string
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 * @param url - The YouTube URL to parse
 * @returns The video ID if found, null otherwise
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // Format: https://www.youtube.com/watch?v={id}
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v')
    }

    // Format: https://youtu.be/{id}
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0]
    }

    // Format: https://www.youtube.com/embed/{id}
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/')[2]
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get file extension icon based on file name
 */
function getFileIcon(_fileName: string): typeof FileText {
  // For now, return FileText for all types
  // In the future, you could add file-type-specific icons like FileImage, FileSpreadsheet, etc.
  // const ext = fileName.split('.').pop()?.toLowerCase()
  return FileText
}

/**
 * Format file size from bytes to human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EventDetailPage({ event, siteId }: EventDetailPageProps) {
  const searchParams = useSearchParams()

  // Preserve search params from the events list page (view and month)
  const backUrl = searchParams.toString()
    ? `/events?${searchParams.toString()}`
    : '/events'

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <div className="brand-container py-12">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href={backUrl}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>

          {/* Event Header - Full Width */}
          <header className="mb-8">
            {/* Title */}
            <h1
              className="text-4xl font-bold mb-4"
              style={{
                fontFamily: 'var(--theme-font-heading)',
                color: 'var(--theme-text)'
              }}
            >
              {event.title}
            </h1>

            {/* Subtitle */}
            {event.subtitle && (
              <p
                className="text-xl text-gray-600 mb-4"
                style={{ fontFamily: 'var(--theme-font-body)' }}
              >
                {event.subtitle}
              </p>
            )}
          </header>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Main Content */}
            <div className="lg:col-span-2">

              {/* Featured Media */}
              {event.media && event.media.length > 0 && (
                <div className="mb-8">
                  <div className="aspect-[16/9] relative rounded-lg overflow-hidden bg-gray-100">
                    {event.media[0].media_type === 'video' ? (
                      (() => {
                        const videoId = extractYouTubeVideoId(event.media[0].media_url)

                        if (videoId) {
                          // Render YouTube iframe
                          return (
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                              title={event.media[0].alt_text || event.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              referrerPolicy="strict-origin-when-cross-origin"
                              className="w-full h-full absolute inset-0"
                              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                            />
                          )
                        }

                        // Fallback: If not a YouTube URL, show error message
                        return (
                          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div className="max-w-md space-y-4">
                              <div className="text-4xl">🎥</div>
                              <h3
                                className="text-xl font-semibold"
                                style={{ fontFamily: 'var(--theme-font-heading)' }}
                              >
                                Invalid Video URL
                              </h3>
                              <p
                                className="text-gray-600"
                                style={{ fontFamily: 'var(--theme-font-body)' }}
                              >
                                Please provide a valid YouTube video URL.
                              </p>
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      /* Render image */
                      <Image
                        src={event.media[0].media_url}
                        alt={event.media[0].alt_text || event.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  {event.media[0].caption && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      {event.media[0].caption}
                    </p>
                  )}
                </div>
              )}

              {/* Event Description */}
              {event.description && (
                <div
                  className="prose prose-lg max-w-none mb-8"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-text)'
                  }}
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              )}

              {/* Additional Images Gallery */}
              {event.media && event.media.length > 1 && (
                <div className="mb-8">
                  <h2
                    className="text-2xl font-bold mb-4"
                    style={{ fontFamily: 'var(--theme-font-heading)' }}
                  >
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.media.slice(1).map((media, idx) => (
                      <div key={media.id} className="aspect-square relative rounded-lg overflow-hidden">
                        <Image
                          src={media.media_url}
                          alt={media.alt_text || `${event.title} image ${idx + 2}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sidebar with Upcoming Dates and Downloads */}
            <div className="lg:col-span-1">
              <div className="flex flex-col gap-6 sticky top-24">
                {/* Location - Display above Upcoming Dates */}
                {event.location && (
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span
                      className="text-gray-700"
                      style={{ fontFamily: 'var(--theme-font-body)' }}
                    >
                      {event.location}
                    </span>
                  </div>
                )}

                {/* Upcoming Dates Card */}
                <Card className="flex flex-col">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <span style={{ fontFamily: 'var(--theme-font-heading)' }}>
                        Upcoming Dates
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    {event.occurrences && event.occurrences.length > 0 ? (
                      event.occurrences.map((occurrence) => (
                        <div key={occurrence.id} className="space-y-2">
                          <div
                            className="font-semibold"
                            style={{ fontFamily: 'var(--theme-font-body)' }}
                          >
                            {format(new Date(occurrence.start_datetime), 'PPP')}
                          </div>

                          {!occurrence.is_all_day && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span style={{ fontFamily: 'var(--theme-font-body)' }}>
                                {format(new Date(occurrence.start_datetime), 'p')}
                                {occurrence.end_datetime && ` - ${format(new Date(occurrence.end_datetime), 'p')}`}
                              </span>
                            </div>
                          )}

                          {occurrence.is_all_day && (
                            <Badge variant="outline" className="text-xs">All Day</Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      /* Fallback to event base datetime if no occurrences */
                      <div className="space-y-2">
                        <div
                          className="font-semibold"
                          style={{ fontFamily: 'var(--theme-font-body)' }}
                        >
                          {format(new Date(event.start_datetime), 'PPP')}
                        </div>

                        {!event.is_all_day && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span style={{ fontFamily: 'var(--theme-font-body)' }}>
                              {format(new Date(event.start_datetime), 'p')}
                              {event.end_datetime && ` - ${format(new Date(event.end_datetime), 'p')}`}
                            </span>
                          </div>
                        )}

                        {event.is_all_day && (
                          <Badge variant="outline">All Day Event</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Downloads Section */}
                {event.attachments && event.attachments.length > 0 && (
                  <Card className="flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Download className="h-5 w-5 text-gray-500" />
                        <span style={{ fontFamily: 'var(--theme-font-heading)' }}>
                          Downloads
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1">
                      <div className="divide-y divide-gray-200">
                        {event.attachments.map((attachment) => {
                          const FileIcon = getFileIcon(attachment.file_name)
                          return (
                            <a
                              key={attachment.id}
                              href={attachment.file_url}
                              download
                              className="flex items-center gap-3 py-3 group hover:bg-gray-50/50 -mx-6 px-6 transition-colors first:pt-0 last:pb-0"
                            >
                              <FileIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div
                                  className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors"
                                  style={{ fontFamily: 'var(--theme-font-body)' }}
                                >
                                  {attachment.file_name}
                                </div>
                                {attachment.file_size_bytes && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {formatFileSize(attachment.file_size_bytes)}
                                  </div>
                                )}
                              </div>
                              <Download className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </a>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteRenderer>
  )
}
