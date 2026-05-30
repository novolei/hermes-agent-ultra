// Ported verbatim from uclaw ui/src/components/files-rail/FilesRailTabs.tsx
import * as React from 'react'
import { useAtom } from 'jotai'
import { filesRailTabAtom, type FilesRailTab } from '@/features/chat-agent/atoms/files-rail-atoms'
import { cn } from '@/shared/lib/cn'

const TABS: Array<{ id: FilesRailTab; label: string }> = [
  { id: 'workspace', label: '工作区文件' },
  { id: 'changes', label: '文件改动' },
]

export function FilesRailTabs(): React.ReactElement {
  const [active, setActive] = useAtom(filesRailTabAtom)
  return (
    <div role="tablist" className="flex items-center gap-3 px-3 h-[32px] border-b border-border">
      {TABS.map((t) => {
        const selected = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => setActive(t.id)}
            className={cn(
              'h-[32px] text-[12px] font-medium border-b-2 px-0.5 transition-colors',
              selected
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
