import { useStore } from '../store'

const phaseLabels = {
  'scanning-left': 'Scanning left directory',
  'scanning-right': 'Scanning right directory',
  'comparing': 'Comparing files'
}

export function ProgressOverlay() {
  const progress = useStore((s) => s.progress)

  return (
    <div className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full mx-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
          <span className="text-sm font-medium text-neutral-700">
            {progress ? phaseLabels[progress.phase] : 'Preparing...'}
          </span>
        </div>

        {progress && progress.total > 0 && (
          <>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-neutral-700 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-neutral-400 font-mono truncate">
              {progress.currentFile || `${progress.current} / ${progress.total}`}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
