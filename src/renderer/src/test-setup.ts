import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock window.api
;(globalThis as any).window = {
  ...globalThis.window,
  api: {
    selectDirectory: vi.fn(),
    compareDirectories: vi.fn(),
    copyFile: vi.fn(),
    moveFile: vi.fn(),
    getCliArgs: vi.fn().mockResolvedValue([]),
    readFile: vi.fn(),
    onScanProgress: vi.fn().mockReturnValue(() => {}),
    getPathForFile: vi.fn((file: File) => (file as any)._testPath || '')
  }
}
