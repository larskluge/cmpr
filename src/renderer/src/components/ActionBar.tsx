import { useStore, getFilteredEntries } from '../store'

export function ActionBar() {
  const { selectedPaths, result, activeFilter, selectAll, clearSelection, setError } = useStore()

  if (!result) return null

  const entries = getFilteredEntries({ result, activeFilter })
  const selectedEntries = entries.filter(e => selectedPaths.has(e.relativePath))
  const count = selectedEntries.length

  const hasLeft = selectedEntries.some(e => e.left)
  const hasRight = selectedEntries.some(e => e.right)

  async function performAction(direction: 'left-to-right' | 'right-to-left', mode: 'copy' | 'move') {
    if (!result) return
    const fn = mode === 'copy' ? window.api.copyFile : window.api.moveFile

    for (const entry of selectedEntries) {
      try {
        if (direction === 'left-to-right' && entry.left) {
          await fn(entry.left.absolutePath, result.leftRoot, result.rightRoot)
        } else if (direction === 'right-to-left' && entry.right) {
          await fn(entry.right.absolutePath, result.rightRoot, result.leftRoot)
        }
      } catch (err: any) {
        setError(`Failed to ${mode} ${entry.relativePath}: ${err.message}`)
        return
      }
    }

    clearSelection()
    const newResult = await window.api.compareDirectories(result.leftRoot, result.rightRoot)
    useStore.getState().setResult(newResult)
  }

  const btnBase = 'px-2.5 py-1 text-xs rounded-lg transition-all duration-200'
  const btnEnabled = 'cursor-pointer'
  const btnDisabled = 'opacity-30 cursor-not-allowed'

  return (
    <div className="mx-6 mb-3 flex items-center gap-2">
      <button
        onClick={selectAll}
        className={`${btnBase} text-neutral-500 bg-white shadow-sm hover:bg-neutral-100 cursor-pointer`}
      >
        Select All
      </button>
      <button
        onClick={clearSelection}
        disabled={count === 0}
        className={`${btnBase} text-neutral-500 bg-white shadow-sm ${count > 0 ? 'hover:bg-neutral-100 ' + btnEnabled : btnDisabled}`}
      >
        Clear{count > 0 ? ` (${count})` : ''}
      </button>
      <div className="w-px h-4 bg-neutral-200" />
      <button
        onClick={() => performAction('left-to-right', 'copy')}
        disabled={!hasLeft}
        className={`${btnBase} text-blue-600 bg-blue-50 ${hasLeft ? 'hover:bg-blue-100 ' + btnEnabled : btnDisabled}`}
      >
        Copy &rarr;
      </button>
      <button
        onClick={() => performAction('right-to-left', 'copy')}
        disabled={!hasRight}
        className={`${btnBase} text-violet-600 bg-violet-50 ${hasRight ? 'hover:bg-violet-100 ' + btnEnabled : btnDisabled}`}
      >
        &larr; Copy
      </button>
      <button
        onClick={() => performAction('left-to-right', 'move')}
        disabled={!hasLeft}
        className={`${btnBase} text-blue-600 bg-blue-50 ${hasLeft ? 'hover:bg-blue-100 ' + btnEnabled : btnDisabled}`}
      >
        Move &rarr;
      </button>
      <button
        onClick={() => performAction('right-to-left', 'move')}
        disabled={!hasRight}
        className={`${btnBase} text-violet-600 bg-violet-50 ${hasRight ? 'hover:bg-violet-100 ' + btnEnabled : btnDisabled}`}
      >
        &larr; Move
      </button>
    </div>
  )
}
