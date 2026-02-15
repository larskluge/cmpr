import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FolderPicker } from '../components/FolderPicker'
import { useStore } from '../store'
import App from '../App'

function createDropEvent(paths: string[]) {
  const files = paths.map(p => {
    const f = new File([''], 'folder', { type: '' })
    Object.defineProperty(f, '_testPath', { value: p })
    return f
  })

  const dataTransfer = {
    files,
    items: files.map(f => ({ kind: 'file', getAsFile: () => f })),
    types: ['Files']
  }

  return { dataTransfer }
}

describe('FolderPicker', () => {
  beforeEach(() => {
    useStore.setState({ leftPath: '', rightPath: '', result: null, error: null })
  })

  it('renders two folder slots', () => {
    render(<FolderPicker />)
    expect(screen.getByText('Left')).toBeInTheDocument()
    expect(screen.getByText('Right')).toBeInTheDocument()
  })

  it('shows placeholder when no path set', () => {
    render(<FolderPicker />)
    const placeholders = screen.getAllByText('Drop or click to select')
    expect(placeholders).toHaveLength(2)
  })

  it('shows folder name when path is set', () => {
    useStore.setState({ leftPath: '/Users/test/my-folder' })
    render(<FolderPicker />)
    expect(screen.getByText('my-folder')).toBeInTheDocument()
  })

  it('shows Compare button when both paths set', () => {
    useStore.setState({ leftPath: '/a', rightPath: '/b' })
    render(<FolderPicker />)
    expect(screen.getByText('Compare')).toBeInTheDocument()
  })

  it('does not show Compare button when only one path set', () => {
    useStore.setState({ leftPath: '/a', rightPath: '' })
    render(<FolderPicker />)
    expect(screen.queryByText('Compare')).not.toBeInTheDocument()
  })

  it('sets left path on drop to left slot', () => {
    render(<FolderPicker />)
    const leftSlot = screen.getByText('Left').closest('div[class*="flex-1"]')!

    fireEvent.drop(leftSlot, createDropEvent(['/Users/test/folder-a']))

    expect(useStore.getState().leftPath).toBe('/Users/test/folder-a')
  })

  it('sets right path on drop to right slot', () => {
    render(<FolderPicker />)
    const rightSlot = screen.getByText('Right').closest('div[class*="flex-1"]')!

    fireEvent.drop(rightSlot, createDropEvent(['/Users/test/folder-b']))

    expect(useStore.getState().rightPath).toBe('/Users/test/folder-b')
  })
})

describe('App drag-and-drop', () => {
  beforeEach(() => {
    useStore.setState({ leftPath: '', rightPath: '', result: null, error: null, scanning: false })
  })

  it('document-level dragover is prevented to avoid navigation', () => {
    render(<App />)
    const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true })
    document.dispatchEvent(dragOverEvent)
    expect(dragOverEvent.defaultPrevented).toBe(true)
  })

  it('document-level drop is prevented to avoid navigation', () => {
    render(<App />)
    const dataTransfer = {
      files: [],
      items: [],
      types: []
    }
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer })
    document.dispatchEvent(dropEvent)
    expect(dropEvent.defaultPrevented).toBe(true)
  })

  it('drop on App root sets left path when empty', () => {
    render(<App />)
    const root = document.querySelector('.h-screen')!

    fireEvent.drop(root, createDropEvent(['/Users/test/dropped-folder']))

    expect(useStore.getState().leftPath).toBe('/Users/test/dropped-folder')
  })

  it('drop on App root sets right path when left is filled', () => {
    useStore.setState({ leftPath: '/existing/left' })
    render(<App />)
    const root = document.querySelector('.h-screen')!

    fireEvent.drop(root, createDropEvent(['/Users/test/dropped-folder']))

    expect(useStore.getState().rightPath).toBe('/Users/test/dropped-folder')
  })

  it('drop with two folders on App root sets both paths', () => {
    render(<App />)
    const root = document.querySelector('.h-screen')!

    fireEvent.drop(root, createDropEvent(['/Users/test/folder-a', '/Users/test/folder-b']))

    expect(useStore.getState().leftPath).toBe('/Users/test/folder-a')
    expect(useStore.getState().rightPath).toBe('/Users/test/folder-b')
  })
})
