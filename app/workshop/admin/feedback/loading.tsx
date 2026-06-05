export default function FeedbackLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 animate-pulse">
      <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-800 px-6 py-4">
        <div className="h-5 w-40 rounded-md bg-gray-200 dark:bg-white/[0.08]" />
        <div className="h-3 w-56 rounded-md bg-gray-100 dark:bg-white/[0.05] mt-2" />
      </div>
      <div className="p-4 space-y-5 max-w-5xl lg:p-6">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800 p-5 space-y-2 text-center">
              <div className="h-7 w-12 rounded bg-gray-100 dark:bg-white/[0.05] mx-auto" />
              <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/[0.05] mx-auto" />
            </div>
          ))}
        </div>
        <div className="h-10 w-64 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800 p-5 space-y-2">
              <div className="flex gap-2">
                <div className="h-4 w-28 rounded bg-gray-100 dark:bg-white/[0.06]" />
                <div className="h-4 w-16 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
              </div>
              <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-full rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
