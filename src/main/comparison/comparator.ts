import type { FileEntry, ComparisonEntry, ComparisonResult, ComparisonSummary } from '../../shared/types'
import { isIgnoredFile } from '../../shared/types'

export function compare(
  leftRoot: string,
  rightRoot: string,
  leftEntries: FileEntry[],
  rightEntries: FileEntry[]
): ComparisonResult {
  const entries: ComparisonEntry[] = []

  // Separate ignored files
  const leftIgnored: FileEntry[] = []
  const rightIgnored: FileEntry[] = []
  const leftFiles: FileEntry[] = []
  const rightFiles: FileEntry[] = []

  for (const e of leftEntries) {
    if (isIgnoredFile(e.relativePath)) leftIgnored.push(e)
    else leftFiles.push(e)
  }
  for (const e of rightEntries) {
    if (isIgnoredFile(e.relativePath)) rightIgnored.push(e)
    else rightFiles.push(e)
  }

  // Emit ignored entries
  const allIgnoredPaths = new Set([
    ...leftIgnored.map(e => e.relativePath),
    ...rightIgnored.map(e => e.relativePath)
  ])
  const leftIgnoredMap = new Map(leftIgnored.map(e => [e.relativePath, e]))
  const rightIgnoredMap = new Map(rightIgnored.map(e => [e.relativePath, e]))
  for (const path of [...allIgnoredPaths].sort()) {
    entries.push({
      relativePath: path,
      status: 'ignored',
      left: leftIgnoredMap.get(path),
      right: rightIgnoredMap.get(path)
    })
  }

  // Group non-ignored files by SHA
  const leftBySha = new Map<string, FileEntry[]>()
  const rightBySha = new Map<string, FileEntry[]>()
  for (const e of leftFiles) {
    const list = leftBySha.get(e.sha256) || []
    list.push(e)
    leftBySha.set(e.sha256, list)
  }
  for (const e of rightFiles) {
    const list = rightBySha.get(e.sha256) || []
    list.push(e)
    rightBySha.set(e.sha256, list)
  }

  // Track which files have been matched
  const matchedLeft = new Set<string>()   // relativePaths
  const matchedRight = new Set<string>()  // relativePaths

  // For each SHA present on both sides, match files
  for (const [sha, leftList] of leftBySha) {
    const rightList = rightBySha.get(sha)
    if (!rightList) continue

    // First pass: match files that share the same path (identical)
    const leftByPath = new Map(leftList.map(e => [e.relativePath, e]))
    const rightByPath = new Map(rightList.map(e => [e.relativePath, e]))

    for (const [path, leftEntry] of leftByPath) {
      if (rightByPath.has(path)) {
        entries.push({
          relativePath: path,
          status: 'identical',
          left: leftEntry,
          right: rightByPath.get(path)
        })
        matchedLeft.add(path)
        matchedRight.add(path)
      }
    }

    // Second pass: pair remaining unmatched files with same SHA (moved)
    const unmatchedLeft = leftList.filter(e => !matchedLeft.has(e.relativePath))
    const unmatchedRight = rightList.filter(e => !matchedRight.has(e.relativePath))

    const pairCount = Math.min(unmatchedLeft.length, unmatchedRight.length)
    for (let i = 0; i < pairCount; i++) {
      entries.push({
        relativePath: unmatchedLeft[i].relativePath,
        status: 'moved',
        left: unmatchedLeft[i],
        right: unmatchedRight[i]
      })
      matchedLeft.add(unmatchedLeft[i].relativePath)
      matchedRight.add(unmatchedRight[i].relativePath)
    }

    // Third pass: excess duplicates — same SHA exists on the other side but all
    // counterparts are already paired. Still mark as 'moved' so the UI shows the
    // content exists on both sides (many-to-one pairing).
    if (unmatchedLeft.length > pairCount) {
      const counterpart = unmatchedRight[0] || rightList[0]
      for (let i = pairCount; i < unmatchedLeft.length; i++) {
        entries.push({
          relativePath: unmatchedLeft[i].relativePath,
          status: 'moved',
          left: unmatchedLeft[i],
          right: counterpart
        })
        matchedLeft.add(unmatchedLeft[i].relativePath)
      }
    } else if (unmatchedRight.length > pairCount) {
      const counterpart = unmatchedLeft[0] || leftList[0]
      for (let i = pairCount; i < unmatchedRight.length; i++) {
        entries.push({
          relativePath: unmatchedRight[i].relativePath,
          status: 'moved',
          left: counterpart,
          right: unmatchedRight[i]
        })
        matchedRight.add(unmatchedRight[i].relativePath)
      }
    }
  }

  // Remaining unmatched files: check if same path exists on opposite side → 'different'
  const unmatchedLeftFiles = leftFiles.filter(e => !matchedLeft.has(e.relativePath))
  const unmatchedRightFiles = rightFiles.filter(e => !matchedRight.has(e.relativePath))

  const unmatchedLeftByPath = new Map(unmatchedLeftFiles.map(e => [e.relativePath, e]))
  const unmatchedRightByPath = new Map(unmatchedRightFiles.map(e => [e.relativePath, e]))

  for (const [path, leftEntry] of unmatchedLeftByPath) {
    if (unmatchedRightByPath.has(path)) {
      entries.push({
        relativePath: path,
        status: 'different',
        left: leftEntry,
        right: unmatchedRightByPath.get(path)
      })
      matchedLeft.add(path)
      matchedRight.add(path)
    }
  }

  // Truly unmatched: left-only and right-only
  for (const e of leftFiles) {
    if (!matchedLeft.has(e.relativePath)) {
      entries.push({ relativePath: e.relativePath, status: 'left-only', left: e })
    }
  }
  for (const e of rightFiles) {
    if (!matchedRight.has(e.relativePath)) {
      entries.push({ relativePath: e.relativePath, status: 'right-only', right: e })
    }
  }

  // Sort entries by relativePath for consistent display
  entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath))

  const summary = computeSummary(entries)

  return { leftRoot, rightRoot, entries, summary }
}

function computeSummary(entries: ComparisonEntry[]): ComparisonSummary {
  const counts = { identical: 0, different: 0, leftOnly: 0, rightOnly: 0, moved: 0, ignored: 0 }
  for (const e of entries) {
    if (e.status === 'identical') counts.identical++
    else if (e.status === 'different') counts.different++
    else if (e.status === 'left-only') counts.leftOnly++
    else if (e.status === 'right-only') counts.rightOnly++
    else if (e.status === 'moved') counts.moved++
    else if (e.status === 'ignored') counts.ignored++
  }

  const nonIgnored = entries.filter(e => e.status !== 'ignored')

  return {
    ...counts,
    directoriesIdentical: counts.identical === nonIgnored.length && nonIgnored.length > 0,
    sameContentDifferentStructure: counts.different === 0 && counts.leftOnly === 0 && counts.rightOnly === 0
      && counts.moved > 0 && nonIgnored.length > 0,
    allFilesExistBothSides: counts.leftOnly === 0 && counts.rightOnly === 0
  }
}
