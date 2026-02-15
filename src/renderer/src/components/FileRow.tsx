import { useRef, useLayoutEffect, useState, useCallback } from 'react'
import type { ComparisonEntry } from '../../../shared/types'
import { middleTruncate } from '../utils/middle-truncate'

interface Props {
  entry: ComparisonEntry
  selected: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onContextMenu: (e: React.MouseEvent, side: 'left' | 'right') => void
}

const statusStyles: Record<string, string> = {
  identical: 'bg-emerald-50 text-emerald-600',
  different: 'bg-amber-50 text-amber-600',
  'left-only': 'bg-blue-50 text-blue-600',
  'right-only': 'bg-violet-50 text-violet-600',
  moved: 'bg-cyan-50 text-cyan-600',
  ignored: 'bg-neutral-50 text-neutral-400'
}

const statusDot: Record<string, string> = {
  identical: 'bg-emerald-400',
  different: 'bg-amber-400',
  'left-only': 'bg-blue-400',
  'right-only': 'bg-violet-400',
  moved: 'bg-cyan-400',
  ignored: 'bg-neutral-400'
}

const statusLabel: Record<string, string> = {
  identical: 'same',
  different: 'diff',
  'left-only': 'left',
  'right-only': 'right',
  moved: 'moved',
  ignored: 'skip'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function abbrSha(sha: string): string {
  return sha.slice(0, 7)
}

/**
 * Finder-style middle-truncated path.
 * Measures container width and computes "start…end" truncation via canvas.
 */
function TruncatedPath({ path }: { path: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(path)

  const recompute = useCallback(() => {
    const el = ref.current
    if (!el) return
    const containerWidth = el.clientWidth
    const font = getComputedStyle(el).font
    setDisplay(middleTruncate(path, containerWidth, font))
  }, [path])

  useLayoutEffect(() => {
    recompute()
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(recompute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [recompute])

  return (
    <span
      ref={ref}
      className="block text-neutral-600 whitespace-nowrap overflow-hidden"
      title={path}
    >
      {display}
    </span>
  )
}

export function FileRow({ entry, selected, onClick, onDoubleClick, onContextMenu }: Props) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 transition-all duration-200 cursor-pointer select-none ${
        selected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
      }`}
      onClick={onClick}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick() }}
    >
      {/* Left side */}
      <div
        className="flex-1 min-w-0 text-xs font-mono overflow-hidden"
        onContextMenu={(e) => { if (entry.left) { e.preventDefault(); e.stopPropagation(); onContextMenu(e, 'left') } }}
      >
        {entry.left ? (
          <TruncatedPath path={entry.left.relativePath} />
        ) : (
          <span className="text-neutral-300">&mdash;</span>
        )}
      </div>

      {/* Left SHA */}
      <div className="w-14 text-right text-[10px] font-mono text-neutral-300" title={entry.left?.sha256}>
        {entry.left ? abbrSha(entry.left.sha256) : ''}
      </div>

      {/* Left size */}
      <div className="w-14 text-right text-[10px] text-neutral-400">
        {entry.left ? formatSize(entry.left.sizeBytes) : ''}
      </div>

      {/* Status badge */}
      <div className={`w-20 text-center px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${statusStyles[entry.status]}`}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot[entry.status]} mr-1`} />
        {statusLabel[entry.status]}
      </div>

      {/* Right size */}
      <div className="w-14 text-left text-[10px] text-neutral-400">
        {entry.right ? formatSize(entry.right.sizeBytes) : ''}
      </div>

      {/* Right SHA */}
      <div className="w-14 text-left text-[10px] font-mono text-neutral-300" title={entry.right?.sha256}>
        {entry.right ? abbrSha(entry.right.sha256) : ''}
      </div>

      {/* Right side */}
      <div
        className="flex-1 min-w-0 text-xs font-mono overflow-hidden"
        onContextMenu={(e) => { if (entry.right) { e.preventDefault(); e.stopPropagation(); onContextMenu(e, 'right') } }}
      >
        {entry.right ? (
          <TruncatedPath path={entry.right.relativePath} />
        ) : (
          <span className="text-neutral-300">&mdash;</span>
        )}
      </div>
    </div>
  )
}
