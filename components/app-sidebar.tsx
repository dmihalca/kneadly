'use client'

import * as React from 'react'
import { LayoutDashboard, Pizza, Settings, HelpCircle, Search, Wheat } from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  user: {
    name: 'Danut',
    email: 'danut@kneadly.app',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '#',
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      title: 'Neapolitan',
      url: '#',
      icon: <Pizza className="size-4" />,
    },
    {
      title: 'New York',
      url: '#',
      icon: <Pizza className="size-4" />,
    },
    {
      title: 'Roman',
      url: '#',
      icon: <Pizza className="size-4" />,
    },
    {
      title: 'Detroit',
      url: '#',
      icon: <Pizza className="size-4" />,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '#',
      icon: <Settings className="size-4" />,
    },
    {
      title: 'Get Help',
      url: '#',
      icon: <HelpCircle className="size-4" />,
    },
    {
      title: 'Search',
      url: '#',
      icon: <Search className="size-4" />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wheat className="size-4" />
                </div>
                <span className="text-base font-semibold">Kneadly</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
