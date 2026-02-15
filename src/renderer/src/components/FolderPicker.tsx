import { useState, useCallback } from 'react'
import { useStore } from '../store'

function getDroppedPath(e: React.DragEvent): string | null {
  const files = Array.from(e.dataTransfer.files)
  for (const f of files) {
    const p = window.api.getPathForFile(f)
    if (p) return p
  }
  return null
}

function FolderIcon() {
  return (
    <svg width="64" height="56" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8C2 4.68629 4.68629 2 8 2H22L28 10H56C59.3137 10 62 12.6863 62 16V48C62 51.3137 59.3137 54 56 54H8C4.68629 54 2 51.3137 2 48V8Z" fill="currentColor" />
    </svg>
  )
}

function FolderSlot({ label, path, onDrop, onBrowse }: {
  label: string
  path: string
  onDrop: (path: string) => void
  onBrowse: () => void
}) {
  const [over, setOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOver(false)
    const p = getDroppedPath(e)
    if (p) onDrop(p)
  }, [onDrop])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOver(false)
  }, [])

  const folderName = path ? path.split('/').pop() || path : null

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center gap-4 p-8 rounded-2xl cursor-pointer transition-all duration-200 ${
        over ? 'bg-neutral-100 ring-2 ring-neutral-300' : 'hover:bg-neutral-50'
      }`}
      onClick={onBrowse}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className={`transition-colors duration-200 ${path ? 'text-neutral-400' : 'text-neutral-200'}`}>
        <FolderIcon />
      </div>
      {path ? (
        <>
          <p className="text-lg font-medium text-neutral-700 text-center">{folderName}</p>
          <p className="text-xs font-mono text-neutral-400 text-center max-w-64 truncate" title={path}>{path}</p>
        </>
      ) : (
        <p className="text-sm text-neutral-400 text-center">Drop or click to select</p>
      )}
      <span className="text-[10px] uppercase tracking-wider text-neutral-300 font-medium">{label}</span>
    </div>
  )
}

export function FolderPicker() {
  const { leftPath, rightPath, setLeftPath, setRightPath, scanning, setScanning, setResult, setProgress, setError } = useStore()

  async function browse(side: 'left' | 'right') {
    const path = await window.api.selectDirectory()
    if (path) {
      if (side === 'left') setLeftPath(path)
      else setRightPath(path)
    }
  }

  async function runComparison() {
    if (!leftPath || !rightPath) return
    setScanning(true)
    setError(null)
    setResult(null)

    const unsubscribe = window.api.onScanProgress((progress) => {
      setProgress(progress)
    })

    try {
      const result = await window.api.compareDirectories(leftPath, rightPath)
      setResult(result)
    } catch (err: any) {
      setError(err.message || 'Comparison failed')
    } finally {
      unsubscribe()
      setScanning(false)
      setProgress(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="flex gap-8 mb-8 w-full max-w-xl">
        <FolderSlot label="Left" path={leftPath} onDrop={setLeftPath} onBrowse={() => browse('left')} />
        <FolderSlot label="Right" path={rightPath} onDrop={setRightPath} onBrowse={() => browse('right')} />
      </div>
      {leftPath && rightPath && (
        <button
          onClick={runComparison}
          disabled={scanning}
          className="px-8 py-2.5 bg-neutral-800 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          Compare
        </button>
      )}
    </div>
  )
}
