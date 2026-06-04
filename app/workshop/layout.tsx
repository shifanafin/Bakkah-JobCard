import { auth } from '@/app/auth'
import { redirect } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import Sidebar from '@/components/layout/Sidebar'
import { WorkshopShell } from '@/components/layout/WorkshopShell'

export default async function WorkshopLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  return (
    <SessionProvider session={session}>
      <WorkshopShell>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </WorkshopShell>
    </SessionProvider>
  )
}
