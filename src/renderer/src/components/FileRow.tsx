import type { ComparisonEntry } from '../../../shared/types'

interface Props {
  entry: ComparisonEntry
  selected: boolean
  onToggle: () => void
  onDoubleClick: () => void
}

const statusStyles: Record<string, string> = {
  identical: 'bg-emerald-50 text-emerald-600',
  different: 'bg-amber-50 text-amber-600',
  'left-only': 'bg-blue-50 text-blue-600',
  'right-only': 'bg-violet-50 text-violet-600',
  ignored: 'bg-neutral-50 text-neutral-400'
}

const statusDot: Record<string, string> = {
  identical: 'bg-emerald-400',
  different: 'bg-amber-400',
  'left-only': 'bg-blue-400',
  'right-only': 'bg-violet-400',
  ignored: 'bg-neutral-400'
}

const statusLabel: Record<string, string> = {
  identical: 'same',
  different: 'diff',
  'left-only': 'left',
  'right-only': 'right',
  ignored: 'skip'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileRow({ entry, selected, onToggle, onDoubleClick }: Props) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 transition-all duration-200 cursor-pointer select-none ${
        selected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
      }`}
      onClick={onToggle}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick() }}
    >
      {/* Left side */}
      <div className="flex-1 min-w-0 text-xs font-mono truncate">
        {entry.left ? (
          <span className="text-neutral-600">{entry.relativePath}</span>
        ) : (
          <span className="text-neutral-300">&mdash;</span>
        )}
      </div>

      {/* Left size */}
      <div className="w-16 text-right text-[10px] text-neutral-400">
        {entry.left ? formatSize(entry.left.sizeBytes) : ''}
      </div>

      {/* Status badge */}
      <div className={`w-20 text-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[entry.status]}`}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot[entry.status]} mr-1`} />
        {statusLabel[entry.status]}
      </div>

      {/* Right size */}
      <div className="w-16 text-left text-[10px] text-neutral-400">
        {entry.right ? formatSize(entry.right.sizeBytes) : ''}
      </div>

      {/* Right side */}
      <div className="flex-1 min-w-0 text-xs font-mono truncate text-right">
        {entry.right ? (
          <span className="text-neutral-600">{entry.relativePath}</span>
        ) : (
          <span className="text-neutral-300">&mdash;</span>
        )}
      </div>
    </div>
  )
}
