// Image lightbox component — renders an image in a modal overlay
import * as React from 'react'
import { cn } from '../lib/cn'

interface ImageLightboxProps {
  src: string
  alt: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ImageLightbox({
  src,
  alt,
  open = true,
  onOpenChange,
}: ImageLightboxProps): React.ReactElement | null {
  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm',
      )}
      onClick={() => onOpenChange?.(false)}
    >
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
