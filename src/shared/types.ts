export interface FileEntry {
  relativePath: string
  absolutePath: string
  sha256: string
  sizeBytes: number
}

export type FileStatus = 'identical' | 'different' | 'left-only' | 'right-only' | 'ignored'

export const IGNORED_PATTERNS = [
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  '.Spotlight-V100',
  '.Trashes',
  '._*'
]

export function isIgnoredFile(relativePath: string): boolean {
  const name = relativePath.split('/').pop() || ''
  return IGNORED_PATTERNS.some(p =>
    p.endsWith('*') ? name.startsWith(p.slice(0, -1)) : name === p
  )
}

export interface ComparisonEntry {
  relativePath: string
  status: FileStatus
  left?: FileEntry
  right?: FileEntry
}

export interface ComparisonSummary {
  identical: number
  different: number
  leftOnly: number
  rightOnly: number
  ignored: number
  directoriesIdentical: boolean
  sameContentDifferentStructure: boolean
  allFilesExistBothSides: boolean
}

export interface ComparisonResult {
  leftRoot: string
  rightRoot: string
  entries: ComparisonEntry[]
  summary: ComparisonSummary
}

export interface ScanProgress {
  phase: 'scanning-left' | 'scanning-right' | 'comparing'
  current: number
  total: number
  currentFile: string
}
