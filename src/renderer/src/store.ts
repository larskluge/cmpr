import { create } from 'zustand'
import type { ComparisonResult, ComparisonEntry, FileStatus, ScanProgress } from '../../shared/types'

type FilterType = 'all' | FileStatus

interface AppState {
  leftPath: string
  rightPath: string
  result: ComparisonResult | null
  scanning: boolean
  progress: ScanProgress | null
  activeFilter: FilterType
  selectedPaths: Set<string>
  lastSelectedPath: string | null
  error: string | null

  setLeftPath: (path: string) => void
  setRightPath: (path: string) => void
  setResult: (result: ComparisonResult | null) => void
  setScanning: (scanning: boolean) => void
  setProgress: (progress: ScanProgress | null) => void
  setActiveFilter: (filter: FilterType) => void
  toggleSelected: (path: string) => void
  selectOnly: (path: string) => void
  addToSelection: (path: string) => void
  rangeSelect: (path: string) => void
  selectAll: () => void
  clearSelection: () => void
  setError: (error: string | null) => void
  updateEntry: (relativePath: string, updates: Partial<ComparisonEntry>) => void
}

function loadPath(key: string): string {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

export const useStore = create<AppState>((set, get) => ({
  leftPath: loadPath('cmpr:leftPath'),
  rightPath: loadPath('cmpr:rightPath'),
  result: null,
  scanning: false,
  progress: null,
  activeFilter: 'all',
  selectedPaths: new Set(),
  lastSelectedPath: null,
  error: null,

  setLeftPath: (path) => {
    try { localStorage.setItem('cmpr:leftPath', path) } catch {}
    set({ leftPath: path })
  },
  setRightPath: (path) => {
    try { localStorage.setItem('cmpr:rightPath', path) } catch {}
    set({ rightPath: path })
  },
  setResult: (result) => set({ result, activeFilter: 'all', selectedPaths: new Set(), lastSelectedPath: null }),
  setScanning: (scanning) => set({ scanning }),
  setProgress: (progress) => set({ progress }),
  setActiveFilter: (filter) => set({ activeFilter: filter, selectedPaths: new Set(), lastSelectedPath: null }),
  toggleSelected: (path) => set((state) => {
    const next = new Set(state.selectedPaths)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    return { selectedPaths: next, lastSelectedPath: path }
  }),
  selectOnly: (path) => set({ selectedPaths: new Set([path]), lastSelectedPath: path }),
  addToSelection: (path) => set((state) => {
    const next = new Set(state.selectedPaths)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    return { selectedPaths: next, lastSelectedPath: path }
  }),
  rangeSelect: (path) => set((state) => {
    const entries = getFilteredEntries(state)
    const paths = entries.map(e => e.relativePath)
    const anchorIdx = state.lastSelectedPath ? paths.indexOf(state.lastSelectedPath) : -1
    const currentIdx = paths.indexOf(path)
    if (anchorIdx === -1 || currentIdx === -1) {
      return { selectedPaths: new Set([path]), lastSelectedPath: path }
    }
    const start = Math.min(anchorIdx, currentIdx)
    const end = Math.max(anchorIdx, currentIdx)
    const rangePaths = paths.slice(start, end + 1)
    return { selectedPaths: new Set(rangePaths), lastSelectedPath: state.lastSelectedPath }
  }),
  selectAll: () => set((state) => {
    const filtered = getFilteredEntries(state)
    return { selectedPaths: new Set(filtered.map(e => e.relativePath)) }
  }),
  clearSelection: () => set({ selectedPaths: new Set(), lastSelectedPath: null }),
  setError: (error) => set({ error }),
  updateEntry: (relativePath, updates) => set((state) => {
    if (!state.result) return {}
    const entries = state.result.entries.map(e =>
      e.relativePath === relativePath ? { ...e, ...updates } : e
    )
    return { result: { ...state.result, entries } }
  })
}))

export function getFilteredEntries(state: Pick<AppState, 'result' | 'activeFilter'>): ComparisonEntry[] {
  if (!state.result) return []
  if (state.activeFilter === 'all') return state.result.entries.filter(e => e.status !== 'ignored')
  return state.result.entries.filter(e => e.status === state.activeFilter)
}

export type { FilterType }
