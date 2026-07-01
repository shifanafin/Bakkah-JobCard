import { getServerSession } from '@/lib/server-session'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import { WorkshopShell } from '@/components/layout/WorkshopShell'
import { PostHogUserIdentifier } from '@/components/PostHogProvider'

export default async function WorkshopLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  return (
    <>
      <PostHogUserIdentifier />
      <WorkshopShell>
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))] lg:pb-0">
          {children}
        </main>
      </WorkshopShell>
      <BottomNav />
    </>
  )
}
