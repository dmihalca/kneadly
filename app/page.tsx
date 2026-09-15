import { SiteHeader } from '@/components/site-header'
import DoughCalculator from '@/components/dough-calculator'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <div className="flex flex-1 flex-col min-w-0">
      <SiteHeader />
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <DoughCalculator />
      </div>
    </div>
  )
}
