import { useRef, useState, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useStore, getFilteredEntries } from '../store'
import { FileRow } from './FileRow'
import { DiffView } from './DiffView'
import { ContextMenu } from './ContextMenu'
import type { ComparisonEntry } from '../../../shared/types'

interface ContextMenuState {
  x: number
  y: number
  entry: ComparisonEntry
  side: 'left' | 'right'
}

export function ComparisonTable() {
  const parentRef = useRef<HTMLDivElement>(null)
  const { selectedPaths, selectOnly, addToSelection, rangeSelect, selectAll, result, activeFilter, clearSelection, setError } = useStore()
  const [diffEntry, setDiffEntry] = useState<ComparisonEntry | null>(null)
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null)

  const entries = getFilteredEntries({ result, activeFilter })

  const handleRowClick = useCallback((path: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      rangeSelect(path)
    } else if (e.metaKey || e.ctrlKey) {
      addToSelection(path)
    } else {
      selectOnly(path)
    }
  }, [selectOnly, addToSelection, rangeSelect])

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: ComparisonEntry, side: 'left' | 'right') => {
    setCtxMenu({ x: e.clientX, y: e.clientY, entry, side })
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        selectAll()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectAll])

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 20
  })

  function getContextMenuItems() {
    if (!ctxMenu || !result) return []
    const { entry, side } = ctxMenu
    const file = side === 'left' ? entry.left : entry.right
    if (!file) return []

    return [
      {
        label: 'Show in Finder',
        onClick: () => window.api.showInFolder(file.absolutePath)
      },
      {
        label: 'Move to Trash',
        destructive: true,
        onClick: async () => {
          try {
            await window.api.trashFile(file.absolutePath)
            clearSelection()
            const newResult = await window.api.compareDirectories(result.leftRoot, result.rightRoot)
            useStore.getState().setResult(newResult)
          } catch (err: any) {
            setError(`Failed to trash ${file.relativePath}: ${err.message}`)
          }
        }
      }
    ]
  }

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
                    onClick={(e) => handleRowClick(entry.relativePath, e)}
                    onDoubleClick={() => setDiffEntry(entry)}
                    onContextMenu={(e, side) => handleContextMenu(e, entry, side)}
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

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={getContextMenuItems()}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  )
}
