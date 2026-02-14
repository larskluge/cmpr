import { useEffect, useState, useCallback } from 'react'
import { useStore } from './store'
import { DirectoryPicker } from './components/DirectoryPicker'
import { SummaryBanner } from './components/SummaryBanner'
import { FilterBar } from './components/FilterBar'
import { ComparisonTable } from './components/ComparisonTable'
import { ActionBar } from './components/ActionBar'
import { ProgressOverlay } from './components/ProgressOverlay'

export default function App() {
  const { scanning, result, error, setError, leftPath, rightPath, setLeftPath, setRightPath } = useStore()
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    window.api.getCliArgs().then((args) => {
      if (args.length >= 2) {
        useStore.getState().setLeftPath(args[0])
        useStore.getState().setRightPath(args[1])
      }
    })
  }, [])

  // Prevent Electron from navigating to dropped file URLs
  useEffect(() => {
    const preventNav = (e: Event) => e.preventDefault()
    document.addEventListener('dragover', preventNav)
    document.addEventListener('drop', preventNav)
    return () => {
      document.removeEventListener('dragover', preventNav)
      document.removeEventListener('drop', preventNav)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const paths = files.map(f => window.api.getPathForFile(f)).filter(Boolean)

    if (paths.length >= 1 && !leftPath) {
      setLeftPath(paths[0])
      if (paths.length >= 2) setRightPath(paths[1])
    } else if (paths.length >= 1 && !rightPath) {
      setRightPath(paths[0])
    } else if (paths.length >= 2) {
      setLeftPath(paths[0])
      setRightPath(paths[1])
    } else if (paths.length === 1) {
      if (!leftPath) setLeftPath(paths[0])
      else setRightPath(paths[0])
    }
  }, [leftPath, rightPath, setLeftPath, setRightPath])

  return (
    <div
      className="h-screen flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Titlebar drag region */}
      <div className="titlebar-drag h-12 shrink-0 absolute top-0 left-0 right-0" />

      <div className="pt-12 px-6 pb-4 shrink-0">
        <DirectoryPicker />
      </div>

      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm shrink-0">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {result && (
        <>
          <SummaryBanner />
          <FilterBar />
          <ActionBar />
          <div className="flex-1 min-h-0 px-6 pb-6">
            <ComparisonTable />
          </div>
        </>
      )}

      {!result && !scanning && (
        <div className={`flex-1 flex items-center justify-center transition-all duration-200 ${dragOver ? 'bg-neutral-100' : ''}`}>
          <p className="text-sm text-neutral-400">
            {dragOver ? 'Drop folders here' : 'Select or drop two directories to compare'}
          </p>
        </div>
      )}

      {scanning && <ProgressOverlay />}
    </div>
  )
}
