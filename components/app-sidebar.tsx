'use client'

import * as React from 'react'
import { LayoutDashboard, Pizza, Wheat } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams()
  const currentStyle = searchParams.get('style')

  const presets = [
    {
      title: 'Neapolitan',
      url: '/dashboard?style=neapolitan',
      icon: Pizza,
      isActive: currentStyle === 'neapolitan',
    },
    {
      title: 'New York',
      url: '/dashboard?style=new-york',
      icon: Pizza,
      isActive: currentStyle === 'new-york',
    },
    {
      title: 'Roman',
      url: '/dashboard?style=roman',
      icon: Pizza,
      isActive: currentStyle === 'roman',
    },
    {
      title: 'Detroit',
      url: '/dashboard?style=detroit',
      icon: Pizza,
      isActive: currentStyle === 'detroit',
    },
  ]

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[slot=sidebar-menu-button]:p-1.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wheat className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-base font-semibold">Kneadly</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Dashboard Link */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={!currentStyle}
                className="h-9 px-2 text-sm font-medium"
              >
                <a href="/dashboard" className="flex items-center gap-3">
                  <LayoutDashboard className="size-4 shrink-0" />
                  <span>Active Doughs</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Dough Styles Group with Label */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
            Dough Styles
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {presets.map(item => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  className="h-9 px-2 text-sm font-medium"
                >
                  <a href={item.url} className="flex items-center gap-3">
                    <item.icon className="size-4 shrink-0 stroke-[1.75]" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
