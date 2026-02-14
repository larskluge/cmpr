import { useEffect, useState, useRef } from 'react'
import type { ComparisonEntry } from '../../../shared/types'

interface Props {
  entry: ComparisonEntry
  onClose: () => void
}

interface DiffLine {
  type: 'same' | 'added' | 'removed'
  leftNum?: number
  rightNum?: number
  content: string
}

function computeDiff(left: string[], right: string[]): DiffLine[] {
  const n = left.length
  const m = right.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = left[i - 1] === right[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = []
  let i = n, j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
      result.push({ type: 'same', leftNum: i, rightNum: j, content: left[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'added', rightNum: j, content: right[j - 1] })
      j--
    } else {
      result.push({ type: 'removed', leftNum: i, content: left[i - 1] })
      i--
    }
  }

  return result.reverse()
}

export function DiffView({ entry, onClose }: Props) {
  const [leftContent, setLeftContent] = useState<string | null>(null)
  const [rightContent, setRightContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const promises: Promise<void>[] = []
    if (entry.left) {
      promises.push(window.api.readFile(entry.left.absolutePath).then(c => setLeftContent(c)).catch(() => setLeftContent(null)))
    } else {
      setLeftContent(null)
    }
    if (entry.right) {
      promises.push(window.api.readFile(entry.right.absolutePath).then(c => setRightContent(c)).catch(() => setRightContent(null)))
    } else {
      setRightContent(null)
    }
    Promise.all(promises).finally(() => setLoading(false))
  }, [entry])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const leftLines = leftContent?.split('\n') ?? []
  const rightLines = rightContent?.split('\n') ?? []
  const diffLines = !loading ? computeDiff(leftLines, rightLines) : []
  const isBinary = !loading && (leftContent === null && entry.left) || (rightContent === null && entry.right)

  return (
    <div className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl flex flex-col max-w-5xl w-full mx-6 max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 shrink-0">
          <span className="text-sm font-medium text-neutral-700 font-mono truncate">{entry.relativePath}</span>
          <button
            onClick={onClose}
            className="ml-4 px-3 py-1 text-xs text-neutral-500 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-all duration-200 cursor-pointer shrink-0"
          >
            Close <span className="text-neutral-400 ml-1">Esc</span>
          </button>
        </div>

        {/* Diff content */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-sm text-neutral-400">Loading...</div>
          ) : isBinary ? (
            <div className="flex items-center justify-center h-48 text-sm text-neutral-400">Binary or unreadable file</div>
          ) : entry.status === 'left-only' ? (
            <pre className="p-4 text-xs font-mono text-neutral-600 whitespace-pre-wrap">{leftContent}</pre>
          ) : entry.status === 'right-only' ? (
            <pre className="p-4 text-xs font-mono text-neutral-600 whitespace-pre-wrap">{rightContent}</pre>
          ) : (
            <table className="w-full text-xs font-mono border-collapse">
              <tbody>
                {diffLines.map((line, i) => (
                  <tr
                    key={i}
                    className={
                      line.type === 'removed' ? 'bg-red-50' :
                      line.type === 'added' ? 'bg-emerald-50' :
                      ''
                    }
                  >
                    <td className="w-10 text-right pr-2 text-neutral-300 select-none align-top py-px leading-5">
                      {line.leftNum ?? ''}
                    </td>
                    <td className="w-10 text-right pr-2 text-neutral-300 select-none align-top py-px leading-5 border-r border-neutral-100">
                      {line.rightNum ?? ''}
                    </td>
                    <td className="w-5 text-center select-none align-top py-px leading-5">
                      <span className={
                        line.type === 'removed' ? 'text-red-400' :
                        line.type === 'added' ? 'text-emerald-500' :
                        'text-transparent'
                      }>
                        {line.type === 'removed' ? '−' : line.type === 'added' ? '+' : ' '}
                      </span>
                    </td>
                    <td className="whitespace-pre py-px pr-4 leading-5">
                      <span className={
                        line.type === 'removed' ? 'text-red-700' :
                        line.type === 'added' ? 'text-emerald-700' :
                        'text-neutral-600'
                      }>
                        {line.content}
                      </span>
                    </td>
                  </tr>
                ))}
                {diffLines.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-neutral-400">Files are identical</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
