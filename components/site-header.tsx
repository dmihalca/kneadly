'use client'

import { useSearchParams } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

const STYLE_NAMES: Record<string, string> = {
  'Dough Styles': 'Dough Styles',
}

export function SiteHeader() {
  const searchParams = useSearchParams()
  const currentStyle = searchParams.get('style')

  const title = currentStyle ? STYLE_NAMES[currentStyle] || 'Dough Styles' : 'Active Doughs'

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">{/* Action items / buttons */}</div>
      </div>
    </header>
  )
}
