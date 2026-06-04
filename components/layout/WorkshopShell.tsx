'use client'

import { createContext, useContext, useState } from 'react'

interface ShellCtx { sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void }
const ShellContext = createContext<ShellCtx>({ sidebarOpen: false, setSidebarOpen: () => {} })
export const useShell = () => useContext(ShellContext)

export function WorkshopShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <ShellContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-surface-900">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {children}
      </div>
    </ShellContext.Provider>
  )
}
