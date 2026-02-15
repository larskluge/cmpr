import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { ComparisonResult, FileEntry, ScanProgress } from '../shared/types'

const api = {
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.SELECT_DIRECTORY),

  compareDirectories: (leftPath: string, rightPath: string): Promise<ComparisonResult> =>
    ipcRenderer.invoke(IPC.COMPARE_DIRECTORIES, leftPath, rightPath),

  copyFile: (sourcePath: string, sourceRoot: string, destRoot: string): Promise<FileEntry> =>
    ipcRenderer.invoke(IPC.COPY_FILE, sourcePath, sourceRoot, destRoot),

  moveFile: (sourcePath: string, sourceRoot: string, destRoot: string): Promise<FileEntry> =>
    ipcRenderer.invoke(IPC.MOVE_FILE, sourcePath, sourceRoot, destRoot),

  getCliArgs: (): Promise<string[]> =>
    ipcRenderer.invoke(IPC.GET_CLI_ARGS),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke(IPC.READ_FILE, filePath),

  trashFile: (filePath: string): Promise<void> =>
    ipcRenderer.invoke(IPC.TRASH_FILE, filePath),

  showInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SHOW_IN_FOLDER, filePath),

  onScanProgress: (callback: (progress: ScanProgress) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ScanProgress) => callback(progress)
    ipcRenderer.on(IPC.SCAN_PROGRESS, handler)
    return () => ipcRenderer.removeListener(IPC.SCAN_PROGRESS, handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ApiType = typeof api
