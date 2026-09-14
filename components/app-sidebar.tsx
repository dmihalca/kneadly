'use client'

import * as React from 'react'
import { LayoutDashboard, Pizza, Wheat } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { NavMain } from '@/components/nav-main'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams()
  const currentStyle = searchParams.get('style')

  const data = {
    navMain: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: <LayoutDashboard className="size-4" />,
        isActive: !currentStyle,
      },
      {
        title: 'Neapolitan',
        url: '/dashboard?style=neapolitan',
        icon: <Pizza className="size-4" />,
        isActive: currentStyle === 'neapolitan',
      },
      {
        title: 'New York',
        url: '/dashboard?style=new-york',
        icon: <Pizza className="size-4" />,
        isActive: currentStyle === 'new-york',
      },
      {
        title: 'Roman',
        url: '/dashboard?style=roman',
        icon: <Pizza className="size-4" />,
        isActive: currentStyle === 'roman',
      },
      {
        title: 'Detroit',
        url: '/dashboard?style=detroit',
        icon: <Pizza className="size-4" />,
        isActive: currentStyle === 'detroit',
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wheat className="size-4" />
                </div>
                <span className="text-base font-semibold">Dough Styles</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
