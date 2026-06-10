import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { WorkshopShell } from '@/components/layout/WorkshopShell'
import { PostHogUserIdentifier } from '@/components/PostHogProvider'

export default async function WorkshopLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/login')

  return (
    <>
      <PostHogUserIdentifier />
      <WorkshopShell>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </WorkshopShell>
    </>
  )
}
