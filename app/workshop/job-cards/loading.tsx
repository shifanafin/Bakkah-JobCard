export default function JobCardsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 animate-pulse">
      <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-800 px-6 py-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-28 rounded-md bg-gray-200 dark:bg-white/[0.08]" />
          <div className="h-3 w-44 rounded-md bg-gray-100 dark:bg-white/[0.05]" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-brand/30" />
      </div>
      <div className="p-4 space-y-5 lg:p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <div className="h-10 w-56 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
            <div className="h-10 w-36 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
            <div className="h-10 w-36 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
            <div className="h-10 w-32 rounded-lg bg-brand/30" />
          </div>
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 py-3 px-5">
              <div className="h-6 w-16 rounded bg-gray-200 dark:bg-white/[0.08] mx-auto" />
              <div className="h-3 w-20 rounded bg-gray-100 dark:bg-white/[0.05] mx-auto mt-1" />
            </div>
          ))}
        </div>
        {/* Status tabs */}
        <div className="h-10 rounded-xl bg-gray-200 dark:bg-white/[0.06]" />
        {/* Table */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 overflow-hidden">
          <div className="border-b border-gray-100 dark:border-white/[0.06] px-4 py-3 flex gap-8">
            {['w-16', 'w-24', 'w-28', 'w-16', 'w-20', 'w-16', 'w-16'].map((w, i) => (
              <div key={i} className={`h-3 ${w} rounded bg-gray-100 dark:bg-white/[0.05]`} />
            ))}
          </div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 py-3.5 border-b border-gray-50 dark:border-white/[0.03]">
              <div className="h-4 w-24 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="space-y-1">
                <div className="h-4 w-20 rounded bg-gray-100 dark:bg-white/[0.05]" />
                <div className="h-3 w-28 rounded bg-gray-50 dark:bg-white/[0.03]" />
              </div>
              <div className="space-y-1">
                <div className="h-4 w-24 rounded bg-gray-100 dark:bg-white/[0.05]" />
                <div className="h-3 w-20 rounded bg-gray-50 dark:bg-white/[0.03]" />
              </div>
              <div className="h-4 w-16 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-20 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
              <div className="ml-auto h-4 w-16 rounded bg-gray-100 dark:bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
