export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 animate-pulse">
      <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-800 px-6 py-4">
        <div className="h-5 w-32 rounded-md bg-gray-200 dark:bg-white/[0.08]" />
        <div className="h-3 w-48 rounded-md bg-gray-100 dark:bg-white/[0.05] mt-2" />
      </div>
      <div className="p-6 space-y-6">
        {/* Hero banner */}
        <div className="h-36 rounded-2xl bg-gray-200 dark:bg-white/[0.06]" />
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 p-5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-white/[0.06]" />
              <div className="h-7 w-16 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/[0.05]" />
            </div>
          ))}
        </div>
        {/* Status breakdown */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 p-5">
          <div className="h-3 w-36 rounded bg-gray-100 dark:bg-white/[0.05] mb-4" />
          <div className="grid grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-white/[0.05]" />
            ))}
          </div>
        </div>
        {/* Recent jobs */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-surface-800 p-5">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-white/[0.08] mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-white/[0.04]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
