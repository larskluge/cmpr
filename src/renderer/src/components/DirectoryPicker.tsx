import { useState, useRef, useLayoutEffect, useCallback } from 'react'
import { useStore } from '../store'
import { middleTruncate } from '../utils/middle-truncate'

function getDroppedPath(e: React.DragEvent): string | null {
  const files = Array.from(e.dataTransfer.files)
  for (const f of files) {
    const p = window.api.getPathForFile(f)
    if (p) return p
  }
  return null
}

function DirInput({ label, value, onChange, onBrowse }: {
  label: string
  value: string
  onChange: (v: string) => void
  onBrowse: () => void
}) {
  const [over, setOver] = useState(false)
  const [focused, setFocused] = useState(false)
  const [truncated, setTruncated] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLSpanElement>(null)

  const recompute = useCallback(() => {
    const input = inputRef.current
    if (!input) return
    const style = getComputedStyle(input)
    const containerWidth = input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    setTruncated(middleTruncate(value, containerWidth, style.font))
  }, [value])

  useLayoutEffect(() => {
    recompute()
    const el = inputRef.current
    if (!el) return
    const observer = new ResizeObserver(recompute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [recompute])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setOver(false)
    const path = getDroppedPath(e)
    if (path) onChange(path)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setOver(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setOver(false)
  }

  return (
    <div
      className="flex-1 min-w-0"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <label className="block text-xs text-neutral-400 mb-1">{label}</label>
      <div className={`flex gap-2 rounded-lg transition-all duration-200 ${over ? 'ring-2 ring-neutral-300' : ''}`}>
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Drop folder or type path"
            className={`w-full px-3 py-2 bg-white rounded-lg text-sm font-mono text-neutral-700 placeholder:text-neutral-300 shadow-sm outline-none focus:ring-2 focus:ring-neutral-200 transition-all duration-200 ${!focused && value ? 'text-transparent' : ''}`}
          />
          {!focused && value && (
            <span
              ref={overlayRef}
              className="absolute inset-0 px-3 py-2 text-sm font-mono text-neutral-700 pointer-events-none block whitespace-nowrap overflow-hidden"
              title={value}
            >
              {truncated}
            </span>
          )}
        </div>
        <button
          onClick={onBrowse}
          className="px-3 py-2 bg-white rounded-lg text-sm text-neutral-500 shadow-sm hover:bg-neutral-100 transition-all duration-200 cursor-pointer"
        >
          Browse
        </button>
      </div>
    </div>
  )
}

export function DirectoryPicker() {
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
    <div className="flex items-end gap-3">
      <DirInput label="Left Directory" value={leftPath} onChange={setLeftPath} onBrowse={() => browse('left')} />
      <DirInput label="Right Directory" value={rightPath} onChange={setRightPath} onBrowse={() => browse('right')} />
      <button
        onClick={runComparison}
        disabled={!leftPath || !rightPath || scanning}
        className="px-5 py-2 bg-neutral-800 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
      >
        Compare
      </button>
    </div>
  )
}
