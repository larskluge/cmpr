import type { FileEntry, ComparisonEntry, ComparisonResult, ComparisonSummary } from '../../shared/types'
import { isIgnoredFile } from '../../shared/types'

export function compare(
  leftRoot: string,
  rightRoot: string,
  leftEntries: FileEntry[],
  rightEntries: FileEntry[]
): ComparisonResult {
  const leftMap = new Map<string, FileEntry>()
  const rightMap = new Map<string, FileEntry>()

  for (const e of leftEntries) leftMap.set(e.relativePath, e)
  for (const e of rightEntries) rightMap.set(e.relativePath, e)

  const allPaths = new Set([...leftMap.keys(), ...rightMap.keys()])
  const entries: ComparisonEntry[] = []

  for (const path of [...allPaths].sort()) {
    const left = leftMap.get(path)
    const right = rightMap.get(path)

    if (isIgnoredFile(path)) {
      entries.push({ relativePath: path, status: 'ignored', left, right })
      continue
    }

    if (left && right) {
      entries.push({
        relativePath: path,
        status: left.sha256 === right.sha256 ? 'identical' : 'different',
        left,
        right
      })
    } else if (left) {
      entries.push({ relativePath: path, status: 'left-only', left })
    } else {
      entries.push({ relativePath: path, status: 'right-only', right })
    }
  }

  const summary = computeSummary(entries, leftEntries, rightEntries)

  return { leftRoot, rightRoot, entries, summary }
}

function computeSummary(
  entries: ComparisonEntry[],
  leftEntries: FileEntry[],
  rightEntries: FileEntry[]
): ComparisonSummary {
  const counts = { identical: 0, different: 0, leftOnly: 0, rightOnly: 0, ignored: 0 }
  for (const e of entries) {
    if (e.status === 'identical') counts.identical++
    else if (e.status === 'different') counts.different++
    else if (e.status === 'left-only') counts.leftOnly++
    else if (e.status === 'right-only') counts.rightOnly++
    else if (e.status === 'ignored') counts.ignored++
  }

  const nonIgnored = entries.filter(e => e.status !== 'ignored')

  // Check if same content exists but in different paths
  const leftHashes = new Map<string, number>()
  const rightHashes = new Map<string, number>()
  for (const e of leftEntries) {
    if (!isIgnoredFile(e.relativePath)) {
      leftHashes.set(e.sha256, (leftHashes.get(e.sha256) || 0) + 1)
    }
  }
  for (const e of rightEntries) {
    if (!isIgnoredFile(e.relativePath)) {
      rightHashes.set(e.sha256, (rightHashes.get(e.sha256) || 0) + 1)
    }
  }

  let sameContentDifferentStructure = false
  if (leftHashes.size === rightHashes.size && leftHashes.size > 0) {
    sameContentDifferentStructure = [...leftHashes.entries()].every(
      ([hash, count]) => rightHashes.get(hash) === count
    ) && counts.identical !== nonIgnored.length
  }

  return {
    ...counts,
    directoriesIdentical: counts.identical === nonIgnored.length && nonIgnored.length > 0,
    sameContentDifferentStructure,
    allFilesExistBothSides: counts.leftOnly === 0 && counts.rightOnly === 0
  }
}
