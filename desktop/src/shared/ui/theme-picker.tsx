import * as React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'
import {
  themeModeAtom,
  themeStyleAtom,
  updateThemeMode,
  updateThemeStyle,
  type ThemeMode,
  type ThemeStyle,
} from '@/features/chat-agent/atoms/theme'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '../lib/cn'

// Plan 3.1 — multi-theme picker. Exposed for Plan 3.3 to mount in the Dock
// and Plan 3.5 to mount in the Settings modal. Lives in shared/ui because it's
// reusable across multiple consumer surfaces.

const NAMED_STYLES: Array<{ value: ThemeStyle; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'ocean-light', label: 'Ocean Light' },
  { value: 'ocean-dark', label: 'Ocean Dark' },
  { value: 'forest-light', label: 'Forest Light' },
  { value: 'forest-dark', label: 'Forest Dark' },
  { value: 'slate-light', label: 'Slate Light' },
  { value: 'slate-dark', label: 'Slate Dark' },
  { value: 'warm-paper', label: 'Warm Paper' },
  { value: 'qingye', label: '青夜 (Qingye)' },
  { value: 'black', label: 'Black' },
  { value: 'the-finals', label: 'The Finals' },
]

const MODES: Array<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
  { value: 'light', label: 'Light', icon: <Sun className="size-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="size-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="size-4" /> },
  { value: 'special', label: 'Themed', icon: <Palette className="size-4" /> },
]

interface ThemePickerProps {
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function ThemePicker({ align = 'end', side = 'top', className }: ThemePickerProps): React.ReactElement {
  const mode = useAtomValue(themeModeAtom)
  const style = useAtomValue(themeStyleAtom)
  const setMode = useSetAtom(themeModeAtom)
  const setStyle = useSetAtom(themeStyleAtom)

  const handleModeChange = (newMode: ThemeMode): void => {
    setMode(newMode)
    void updateThemeMode(newMode)
  }

  const handleStyleChange = (newStyle: ThemeStyle): void => {
    setStyle(newStyle)
    void updateThemeStyle(newStyle)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme picker" className={className}>
          <Palette className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} side={side} className="w-64 p-3">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Mode</div>
            <div className="grid grid-cols-4 gap-1">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => { handleModeChange(m.value) }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md p-2 text-xs transition-colors',
                    mode === m.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                  )}
                  aria-pressed={mode === m.value}
                  aria-label={m.label}
                >
                  {m.icon}
                  <span className="leading-none">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {mode === 'special' && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">Style</div>
              <div className="max-h-48 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-1">
                  {NAMED_STYLES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { handleStyleChange(s.value) }}
                      className={cn(
                        'rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                        style === s.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                      )}
                      aria-pressed={style === s.value}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
