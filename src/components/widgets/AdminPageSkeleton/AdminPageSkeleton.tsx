export default function AdminPageSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="py-4 grid grid-cols-[minmax(0,1300px)] justify-center">
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
