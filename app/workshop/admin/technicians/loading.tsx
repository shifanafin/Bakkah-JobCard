export default function TechniciansLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 animate-pulse">
      <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-800 px-6 py-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-28 rounded-md bg-gray-200 dark:bg-white/[0.08]" />
          <div className="h-3 w-44 rounded-md bg-gray-100 dark:bg-white/[0.05]" />
        </div>
      </div>
      <div className="p-4 space-y-5 max-w-5xl lg:p-6">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/[0.06]" />
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
            <div className="h-9 w-36 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 overflow-hidden">
          <div className="border-b border-gray-100 dark:border-white/[0.06] px-4 py-3 flex gap-8">
            {['w-24', 'w-20', 'w-28', 'w-20', 'w-16', 'w-20', 'w-16'].map((w, i) => (
              <div key={i} className={`h-3 ${w} rounded bg-gray-100 dark:bg-white/[0.05]`} />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 py-3.5 border-b border-gray-50 dark:border-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/[0.08]" />
                <div className="space-y-1">
                  <div className="h-4 w-28 rounded bg-gray-100 dark:bg-white/[0.06]" />
                  <div className="h-3 w-20 rounded bg-gray-50 dark:bg-white/[0.03]" />
                </div>
              </div>
              <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-28 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-5 w-8 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-5 w-16 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-20 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="ml-auto h-7 w-7 rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
