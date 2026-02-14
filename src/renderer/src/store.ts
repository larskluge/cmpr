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
  error: string | null

  setLeftPath: (path: string) => void
  setRightPath: (path: string) => void
  setResult: (result: ComparisonResult | null) => void
  setScanning: (scanning: boolean) => void
  setProgress: (progress: ScanProgress | null) => void
  setActiveFilter: (filter: FilterType) => void
  toggleSelected: (path: string) => void
  selectAll: () => void
  clearSelection: () => void
  setError: (error: string | null) => void
  updateEntry: (relativePath: string, updates: Partial<ComparisonEntry>) => void
}

export const useStore = create<AppState>((set, get) => ({
  leftPath: '',
  rightPath: '',
  result: null,
  scanning: false,
  progress: null,
  activeFilter: 'all',
  selectedPaths: new Set(),
  error: null,

  setLeftPath: (path) => set({ leftPath: path }),
  setRightPath: (path) => set({ rightPath: path }),
  setResult: (result) => set({ result, activeFilter: 'all', selectedPaths: new Set() }),
  setScanning: (scanning) => set({ scanning }),
  setProgress: (progress) => set({ progress }),
  setActiveFilter: (filter) => set({ activeFilter: filter, selectedPaths: new Set() }),
  toggleSelected: (path) => set((state) => {
    const next = new Set(state.selectedPaths)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    return { selectedPaths: next }
  }),
  selectAll: () => set((state) => {
    const filtered = getFilteredEntries(state)
    return { selectedPaths: new Set(filtered.map(e => e.relativePath)) }
  }),
  clearSelection: () => set({ selectedPaths: new Set() }),
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
