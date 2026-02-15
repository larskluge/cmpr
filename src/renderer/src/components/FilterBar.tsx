import { useStore, type FilterType } from '../store'

const filters: { key: FilterType; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'bg-neutral-200' },
  { key: 'identical', label: 'Identical', color: 'bg-emerald-400' },
  { key: 'different', label: 'Different', color: 'bg-amber-400' },
  { key: 'left-only', label: 'Left Only', color: 'bg-blue-400' },
  { key: 'right-only', label: 'Right Only', color: 'bg-violet-400' },
  { key: 'moved', label: 'Moved', color: 'bg-cyan-400' },
  { key: 'ignored', label: 'Ignored', color: 'bg-neutral-400' }
]

export function FilterBar() {
  const { activeFilter, setActiveFilter, result } = useStore()
  if (!result) return null

  function getCount(key: FilterType): number {
    if (!result) return 0
    if (key === 'all') return result.entries.filter(e => e.status !== 'ignored').length
    return result.entries.filter(e => e.status === key).length
  }

  return (
    <div className="mx-6 mb-4 flex gap-2">
      {filters.map(({ key, label, color }) => {
        const count = getCount(key)
        if ((key === 'ignored' || key === 'moved') && count === 0) return null
        const active = activeFilter === key
        return (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
              active
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'bg-white text-neutral-500 hover:bg-neutral-100 shadow-sm'
            }`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />
            {label}
            <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
