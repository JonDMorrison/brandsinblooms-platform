import { Skeleton } from '@/src/components/ui/skeleton'

export default function PageEditorLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white  px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-6 w-px" />
            <div>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-6 w-px" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-6 w-px" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50  p-6">
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100  p-6">
          <div className="flex justify-center">
            <Skeleton className="h-96 w-full max-w-4xl rounded-lg" />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-gray-50  px-6 py-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  )
}