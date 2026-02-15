import { useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useStore, getFilteredEntries } from '../store'
import { FileRow } from './FileRow'
import { DiffView } from './DiffView'
import type { ComparisonEntry } from '../../../shared/types'

export function ComparisonTable() {
  const parentRef = useRef<HTMLDivElement>(null)
  const { selectedPaths, toggleSelected, result, activeFilter } = useStore()
  const [diffEntry, setDiffEntry] = useState<ComparisonEntry | null>(null)

  const entries = getFilteredEntries({ result, activeFilter })

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 20
  })

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-neutral-400">
        No files to display
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100 text-[10px] text-neutral-400 font-medium uppercase tracking-wider shrink-0">
          <div className="flex-1">Left</div>
          <div className="w-14 text-right">SHA</div>
          <div className="w-14 text-right">Size</div>
          <div className="w-20 text-center">Status</div>
          <div className="w-14">Size</div>
          <div className="w-14">SHA</div>
          <div className="flex-1 text-right">Right</div>
        </div>

        {/* Virtualized list */}
        <div ref={parentRef} className="overflow-y-auto flex-1 min-h-0">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const entry = entries[virtualItem.index]
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    height: `${virtualItem.size}px`
                  }}
                >
                  <FileRow
                    entry={entry}
                    selected={selectedPaths.has(entry.relativePath)}
                    onToggle={() => toggleSelected(entry.relativePath)}
                    onDoubleClick={() => setDiffEntry(entry)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {diffEntry && (
        <DiffView entry={diffEntry} onClose={() => setDiffEntry(null)} />
      )}
    </>
  )
}
