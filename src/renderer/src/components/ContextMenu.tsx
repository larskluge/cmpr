import { useEffect, useRef } from 'react'

interface MenuItem {
  label: string
  onClick: () => void
  destructive?: boolean
}

interface Props {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    // Defer so the opening right-click doesn't immediately close
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleOutside)
      document.addEventListener('contextmenu', handleOutside)
    })
    document.addEventListener('keydown', handleKey)
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('contextmenu', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 9999
  }

  return (
    <div ref={ref} style={style} className="bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[180px]">
      {items.map((item, i) => (
        <div
          key={i}
          onMouseDown={(e) => {
            e.stopPropagation()
            item.onClick()
            onClose()
          }}
          className={`px-3 py-1.5 text-xs cursor-default select-none ${
            item.destructive
              ? 'text-red-600 hover:bg-red-50'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          {item.label}
        </div>
      ))}
    </div>
  )
}
