import { createHash } from 'crypto'
import { createReadStream } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, relative } from 'path'
import type { FileEntry } from '../../shared/types'

async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

export async function scanDirectory(
  rootPath: string,
  onProgress?: (current: number, total: number, currentFile: string) => void
): Promise<FileEntry[]> {
  const files: string[] = []

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile()) {
        files.push(fullPath)
      }
    }
  }

  await walk(rootPath)

  const results: FileEntry[] = []
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]
    const relPath = relative(rootPath, filePath)
    onProgress?.(i + 1, files.length, relPath)

    const [sha256, fileStat] = await Promise.all([
      hashFile(filePath),
      stat(filePath)
    ])

    results.push({
      relativePath: relPath,
      absolutePath: filePath,
      sha256,
      sizeBytes: fileStat.size
    })
  }

  return results
}
