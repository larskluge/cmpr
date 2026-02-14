import { ipcMain, dialog, BrowserWindow } from 'electron'
import { Worker } from 'worker_threads'
import { join } from 'path'
import { IPC } from '../shared/ipc-channels'
import { compare } from './comparison/comparator'
import { scanDirectory } from './comparison/scanner'
import { copyFileToDir, moveFileToDir } from './file-ops'
import type { FileEntry, ComparisonResult, ScanProgress } from '../shared/types'
import { createHash } from 'crypto'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { relative } from 'path'

function sendProgress(win: BrowserWindow, progress: ScanProgress): void {
  win.webContents.send(IPC.SCAN_PROGRESS, progress)
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle(IPC.COMPARE_DIRECTORIES, async (event, leftPath: string, rightPath: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found')

    // Scan left directory
    const leftEntries = await scanDirectory(leftPath, (current, total, currentFile) => {
      sendProgress(win, { phase: 'scanning-left', current, total, currentFile })
    })

    // Scan right directory
    const rightEntries = await scanDirectory(rightPath, (current, total, currentFile) => {
      sendProgress(win, { phase: 'scanning-right', current, total, currentFile })
    })

    // Compare
    sendProgress(win, { phase: 'comparing', current: 0, total: 1, currentFile: '' })
    const result = compare(leftPath, rightPath, leftEntries, rightEntries)

    return result
  })

  ipcMain.handle(IPC.COPY_FILE, async (_event, sourcePath: string, sourceRoot: string, destRoot: string) => {
    const destPath = await copyFileToDir(sourcePath, sourceRoot, destRoot)
    return await rehashFile(destPath, destRoot)
  })

  ipcMain.handle(IPC.MOVE_FILE, async (_event, sourcePath: string, sourceRoot: string, destRoot: string) => {
    const destPath = await moveFileToDir(sourcePath, sourceRoot, destRoot)
    return await rehashFile(destPath, destRoot)
  })

  ipcMain.handle(IPC.READ_FILE, async (_event, filePath: string) => {
    const { readFile } = await import('fs/promises')
    const content = await readFile(filePath, 'utf-8')
    return content
  })

  ipcMain.handle(IPC.GET_CLI_ARGS, () => {
    // Return CLI args passed after '--'
    const args = process.argv
    const doubleDashIndex = args.indexOf('--')
    if (doubleDashIndex !== -1) {
      return args.slice(doubleDashIndex + 1)
    }
    // For packaged app, check direct args
    return args.slice(2).filter(a => !a.startsWith('-'))
  })
}

async function rehashFile(filePath: string, root: string): Promise<FileEntry> {
  const sha256 = await new Promise<string>((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
  const fileStat = await stat(filePath)
  return {
    relativePath: relative(root, filePath),
    absolutePath: filePath,
    sha256,
    sizeBytes: fileStat.size
  }
}
