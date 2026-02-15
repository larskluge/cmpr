import { describe, it, expect } from 'vitest'
import { compare } from '../comparator'
import type { FileEntry } from '../../../shared/types'

function file(relativePath: string, sha256: string, root: string = '/left'): FileEntry {
  return {
    relativePath,
    absolutePath: `${root}/${relativePath}`,
    sha256,
    sizeBytes: 100
  }
}

describe('comparator', () => {
  it('marks files with same path and SHA as identical', () => {
    const left = [file('a.txt', 'sha1')]
    const right = [file('a.txt', 'sha1', '/right')]
    const result = compare('/left', '/right', left, right)

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].status).toBe('identical')
  })

  it('marks files with same path but different SHA as different', () => {
    const left = [file('a.txt', 'sha1')]
    const right = [file('a.txt', 'sha2', '/right')]
    const result = compare('/left', '/right', left, right)

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].status).toBe('different')
  })

  it('marks files with same SHA but different path as moved', () => {
    const left = [file('old/a.txt', 'sha1')]
    const right = [file('new/a.txt', 'sha1', '/right')]
    const result = compare('/left', '/right', left, right)

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].status).toBe('moved')
    expect(result.entries[0].left).toBeDefined()
    expect(result.entries[0].right).toBeDefined()
  })

  it('marks file with no counterpart as left-only', () => {
    const left = [file('a.txt', 'sha1')]
    const result = compare('/left', '/right', left, [])

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].status).toBe('left-only')
  })

  it('marks file with no counterpart as right-only', () => {
    const right = [file('a.txt', 'sha1', '/right')]
    const result = compare('/left', '/right', [], right)

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].status).toBe('right-only')
  })

  it('duplicate left file with same SHA as matched file should still show right counterpart', () => {
    // Two files on the left with the same SHA, one file on the right with that SHA.
    // Both left files should be 'moved' — the excess one references the same right
    // file (many-to-one) so the UI shows the content exists on both sides.
    const left = [
      file('original.pdf', 'sha1'),
      file('duplicate.pdf', 'sha1')
    ]
    const right = [file('renamed.pdf', 'sha1', '/right')]
    const result = compare('/left', '/right', left, right)

    const nonIgnored = result.entries.filter(e => e.status !== 'ignored')
    expect(nonIgnored).toHaveLength(2)

    // Both should be 'moved' with left and right populated
    for (const entry of nonIgnored) {
      expect(entry.status).toBe('moved')
      expect(entry.left).toBeDefined()
      expect(entry.right).toBeDefined()
      expect(entry.right!.sha256).toBe('sha1')
    }

    // No left-only entries
    expect(nonIgnored.filter(e => e.status === 'left-only')).toHaveLength(0)
  })

  it('duplicate right file with same SHA as matched file should still show left counterpart', () => {
    const left = [file('a.pdf', 'sha1')]
    const right = [
      file('b.pdf', 'sha1', '/right'),
      file('c.pdf', 'sha1', '/right')
    ]
    const result = compare('/left', '/right', left, right)

    const nonIgnored = result.entries.filter(e => e.status !== 'ignored')
    expect(nonIgnored).toHaveLength(2)

    for (const entry of nonIgnored) {
      expect(entry.status).toBe('moved')
      expect(entry.left).toBeDefined()
      expect(entry.right).toBeDefined()
      expect(entry.left!.sha256).toBe('sha1')
    }

    expect(nonIgnored.filter(e => e.status === 'right-only')).toHaveLength(0)
  })
})
