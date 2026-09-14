import { SiteHeader } from '@/components/site-header'
import DoughCalculator from '@/components/dough-calculator'

export default function Page() {
  return (
    <div className="flex flex-1 flex-col min-w-0">
      <SiteHeader />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <DoughCalculator />
        </div>
      </div>
    </div>
  )
}
