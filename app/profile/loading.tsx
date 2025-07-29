import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24 mb-8" />
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            <div>
              <Skeleton className="h-4 w-16 inline-block mr-2" />
              <Skeleton className="h-4 w-48 inline-block" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 inline-block mr-2" />
              <Skeleton className="h-4 w-64 inline-block" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 inline-block mr-2" />
              <Skeleton className="h-4 w-40 inline-block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}