export default function WorkshopLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 animate-pulse">
      <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-800 px-6 py-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded-md bg-gray-200 dark:bg-white/[0.08]" />
          <div className="h-3 w-24 rounded-md bg-gray-100 dark:bg-white/[0.05]" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-white/[0.08]" />
      </div>
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-white/[0.06]" />
          ))}
        </div>
        <div className="h-10 rounded-xl bg-gray-200 dark:bg-white/[0.06]" />
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 overflow-hidden">
          <div className="border-b border-gray-100 dark:border-white/[0.06] px-4 py-3 flex gap-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-3 w-16 rounded bg-gray-100 dark:bg-white/[0.05]" />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-6 px-4 py-3.5 border-b border-gray-50 dark:border-white/[0.03]">
              <div className="h-4 w-24 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-32 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-28 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-16 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-20 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="ml-auto h-5 w-16 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
