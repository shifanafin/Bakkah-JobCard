export default function AttendanceLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 animate-pulse">
      <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-800 px-6 py-4">
        <div className="h-5 w-28 rounded-md bg-gray-200 dark:bg-white/[0.08]" />
        <div className="h-3 w-44 rounded-md bg-gray-100 dark:bg-white/[0.05] mt-2" />
      </div>
      <div className="p-4 space-y-5 max-w-6xl lg:p-6">
        <div className="h-9 w-40 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800 p-5 space-y-2">
              <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-7 w-12 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/[0.05]" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-3.5 border-b border-gray-50 dark:border-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/[0.08]" />
                <div className="h-4 w-28 rounded bg-gray-100 dark:bg-white/[0.06]" />
              </div>
              <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-16 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-16 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-12 rounded bg-gray-100 dark:bg-white/[0.05]" />
              <div className="h-4 w-8 rounded bg-gray-100 dark:bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
