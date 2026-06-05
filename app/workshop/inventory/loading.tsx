export default function InventoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 animate-pulse">
      <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-800 px-6 py-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-24 rounded-md bg-gray-200 dark:bg-white/[0.08]" />
          <div className="h-3 w-36 rounded-md bg-gray-100 dark:bg-white/[0.05]" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-brand/30" />
      </div>
      <div className="p-4 space-y-5 max-w-7xl lg:p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 p-5 space-y-2">
              <div className="h-7 w-20 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/[0.05]" />
            </div>
          ))}
        </div>
        {/* Filters */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 p-5 space-y-3">
          <div className="flex gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
            ))}
          </div>
          <div className="flex gap-3">
            <div className="h-10 flex-1 rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
            <div className="h-10 w-28 rounded-lg bg-brand/30" />
          </div>
        </div>
        {/* Table */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 overflow-hidden">
          <div className="border-b border-gray-100 dark:border-white/[0.06] px-4 py-3 flex gap-6">
            {['w-28', 'w-20', 'w-24', 'w-12', 'w-20', 'w-20', 'w-24', 'w-16'].map((w, i) => (
              <div key={i} className={`h-3 ${w} rounded bg-gray-100 dark:bg-white/[0.05]`} />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-4 border-b border-gray-50 dark:border-white/[0.03]">
              <div className="space-y-1">
                <div className="h-4 w-32 rounded bg-gray-100 dark:bg-white/[0.05]" />
                <div className="h-3 w-20 rounded bg-gray-50 dark:bg-white/[0.03]" />
              </div>
              <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-6 w-24 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-12 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="ml-auto h-4 w-16 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-16 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-20 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
                <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
