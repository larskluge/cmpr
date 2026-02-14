import { useStore } from '../store'

export function SummaryBanner() {
  const result = useStore((s) => s.result)
  if (!result) return null

  const { summary } = result
  const total = result.entries.length

  let statusText: string
  let statusColor: string
  if (summary.directoriesIdentical) {
    statusText = 'Directories are identical'
    statusColor = 'text-emerald-600'
  } else if (summary.sameContentDifferentStructure) {
    statusText = 'Same content, different structure'
    statusColor = 'text-amber-600'
  } else {
    statusText = `${total} files compared`
    statusColor = 'text-neutral-600'
  }

  return (
    <div className="mx-6 mb-4 p-4 bg-white rounded-lg shadow-sm">
      <p className={`text-sm font-medium ${statusColor}`}>{statusText}</p>
      <div className="flex gap-4 mt-2 text-xs text-neutral-400">
        {summary.identical > 0 && (
          <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />{summary.identical} identical</span>
        )}
        {summary.different > 0 && (
          <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />{summary.different} different</span>
        )}
        {summary.leftOnly > 0 && (
          <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />{summary.leftOnly} left only</span>
        )}
        {summary.rightOnly > 0 && (
          <span><span className="inline-block w-2 h-2 rounded-full bg-violet-400 mr-1" />{summary.rightOnly} right only</span>
        )}
      </div>
    </div>
  )
}
