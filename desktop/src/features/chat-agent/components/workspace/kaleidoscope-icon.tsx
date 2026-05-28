/**
 * kaleidoscope-icon — Kaleidoscope entry icon (leftmost in WorkspaceSwitcherBar).
 *
 * Plan 3.2 — ported from uclaw views/Kaleidoscope/KaleidoscopeIcon.tsx.
 * Retargets:
 *   @/lib/utils → @/shared/lib/cn
 *
 * lucide Aperture glyph, slightly larger than workspace icons (size-8), fixed
 * text-primary accent color — it's a "portal" entry that should stand out from
 * the grey workspace icon row. Paired with the return button at the bottom of
 * KaleidoscopeRail — same size and treatment.
 * Default: no background (inactive state); hover reveals bg-primary/10 + motion
 * spins the aperture slowly (kaleidoscope-turning metaphor), exits smoothly.
 * On hover entry, a small burst of confetti explodes from the icon center (once
 * per hover entry). Click switches to kaleidoscope surface, unmounting the
 * icon, so confetti is on hover not click.
 * Festive transient decoration, fixed celebratory color palette (not theme UI
 * chrome), auto-cleaned after 750ms. No persistent animation. No new deps
 * (motion already in stack).
 */
import * as React from 'react'
import { Aperture } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'

export interface KaleidoscopeIconProps {
  /** Whether currently on the kaleidoscope surface (affects active visual state). */
  active?: boolean
  onClick?: () => void
}

/**
 * Confetti pieces for hover burst — each has fixed direction / color / rotation
 * to avoid recalculating on every render. Festive transient decoration, using
 * a fixed celebratory color palette instead of theme tokens (confetti should
 * be colorful). dx/dy scatter radius ~20px, staying near icon, not clipped by
 * parent container.
 */
const CONFETTI = [
  { dx: -16, dy: -12, rot: -120, color: '#f59e0b' },
  { dx: 15, dy: -15, rot: 150, color: '#ec4899' },
  { dx: -4, dy: -19, rot: 70, color: '#06b6d4' },
  { dx: 12, dy: -6, rot: -190, color: '#8b5cf6' },
  { dx: -14, dy: 7, rot: 95, color: '#22c55e' },
  { dx: 18, dy: 4, rot: -85, color: '#f59e0b' },
  { dx: 3, dy: 16, rot: 165, color: '#ec4899' },
  { dx: -11, dy: 17, rot: -135, color: '#06b6d4' },
  { dx: 10, dy: 19, rot: 120, color: '#8b5cf6' },
] as const

export function KaleidoscopeIcon({
  active = false,
  onClick,
}: KaleidoscopeIconProps): React.ReactElement {
  const [hovered, setHovered] = React.useState(false)
  const [burst, setBurst] = React.useState<number | null>(null)
  const burstSeq = React.useRef(0)

  const handleEnter = React.useCallback(() => {
    setHovered(true)
    const id = ++burstSeq.current
    setBurst(id)
    // Clean up confetti DOM after 750ms (after the 0.6s scatter animation).
    // Guard cur === id prevents a fast-repeated-hover old timeout from
    // clearing a new burst.
    window.setTimeout(() => setBurst((cur) => (cur === id ? null : cur)), 750)
  }, [])

  return (
    <button
      type="button"
      aria-label="打开万花筒"
      aria-current={active ? 'true' : undefined}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'titlebar-no-drag relative inline-flex items-center justify-center',
        'size-8 rounded-md transition-colors shrink-0 text-primary',
        active ? 'bg-primary/20' : 'hover:bg-primary/10',
      )}
    >
      <motion.span
        className="inline-flex"
        animate={{ rotate: hovered ? 360 : 0 }}
        transition={
          hovered
            ? { repeat: Infinity, duration: 2.6, ease: 'linear' }
            : { duration: 0.4, ease: 'easeOut' }
        }
      >
        <Aperture className="size-[18px]" aria-hidden />
      </motion.span>

      {/* Confetti burst on hover enter — burst key change causes the whole
          cluster to remount and replay the animation */}
      {burst !== null && (
        <span
          key={burst}
          aria-hidden
          data-testid="kaleidoscope-confetti"
          className="pointer-events-none absolute inset-0"
        >
          {CONFETTI.map((c, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 size-1.5 -ml-[3px] -mt-[3px] rounded-[1px]"
              style={{ backgroundColor: c.color }}
              initial={{ x: 0, y: 0, scale: 0.5, opacity: 1, rotate: 0 }}
              animate={{ x: c.dx, y: c.dy, scale: 1, opacity: 0, rotate: c.rot }}
              transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            />
          ))}
        </span>
      )}
    </button>
  )
}
