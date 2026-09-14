import { SiteHeader } from '@/components/site-header'
import DoughCalculator from '@/components/dough-calculator'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Suspense fallback={<div className="p-6">Loading calculator...</div>}>
            <DoughCalculator />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
