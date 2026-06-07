export default function Loading() {
  return (
    <div className="max-w-5xl animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-32 mb-6" />
      <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-5 space-y-3"
          >
            <div className="flex justify-between">
              <div className="h-5 bg-gray-200 rounded-full w-20" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 bg-gray-100 rounded-full w-14" />
              <div className="h-5 bg-gray-100 rounded-full w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
