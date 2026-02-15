import { useStore } from '../store'

export function ResultHeader() {
  const { leftPath, rightPath, setResult } = useStore()

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setResult(null)}
        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all duration-200 cursor-pointer shrink-0"
        title="Back to folder picker"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <span className="text-xs font-mono text-neutral-500 truncate" title={leftPath}>{leftPath}</span>
        <span className="text-neutral-300 shrink-0">&harr;</span>
        <span className="text-xs font-mono text-neutral-500 truncate" title={rightPath}>{rightPath}</span>
      </div>
    </div>
  )
}
