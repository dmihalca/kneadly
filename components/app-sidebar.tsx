'use client'

import { Plus, Wheat } from 'lucide-react'
import { cn } from '@/lib/utils'

type PresetName = 'neapolitan' | 'newYork' | 'roman' | 'detroit'

type AppSidebarProps = {
  activePreset: PresetName
  onPresetChange: (preset: PresetName) => void
  onAddStyle?: () => void
}

const styles: { id: PresetName; label: string }[] = [
  { id: 'neapolitan', label: 'Neapolitan' },
  { id: 'newYork', label: 'New York' },
  { id: 'roman', label: 'Roman' },
  { id: 'detroit', label: 'Detroit' },
]

export function AppSidebar({ activePreset, onPresetChange, onAddStyle }: AppSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:min-h-svh md:flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wheat className="size-4" />
          </div>
          <span className="text-lg">Kneadly</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-6">
        <div className="mb-5 px-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active Doughs
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between px-2 pb-2">
            <p className="text-sm font-medium">Dough Styles</p>
            <button
              type="button"
              onClick={onAddStyle}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Add dough style"
              title="Add dough style"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <nav className="space-y-1" aria-label="Dough styles">
            {styles.map(style => {
              const active = activePreset === style.id

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onPresetChange(style.id)}
                  className={cn(
                    'flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={cn(
                      'mr-3 size-1.5 rounded-full',
                      active ? 'bg-primary' : 'bg-transparent'
                    )}
                  />
                  {style.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}
