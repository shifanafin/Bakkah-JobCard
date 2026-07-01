export default function MyJobsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 animate-pulse">
      <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-800 px-6 py-4">
        <div className="h-5 w-20 rounded-md bg-gray-200 dark:bg-white/[0.08]" />
        <div className="h-3 w-36 rounded-md bg-gray-100 dark:bg-white/[0.05] mt-2" />
      </div>
      <div className="p-4 space-y-3 max-w-4xl md:max-w-full lg:p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100 dark:bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/[0.08]" />
                  <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-white/[0.06]" />
                </div>
                <div className="h-4 w-48 rounded bg-gray-100 dark:bg-white/[0.06]" />
                <div className="h-3 w-40 rounded bg-gray-50 dark:bg-white/[0.04]" />
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="h-8 w-24 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
                <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
