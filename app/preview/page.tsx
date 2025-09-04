import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import PreviewContent from './preview-content'

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const siteId = params.siteId as string
  
  if (!siteId) {
    redirect('/dashboard/design')
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <PreviewContent siteId={siteId} />
    </Suspense>
  )
}