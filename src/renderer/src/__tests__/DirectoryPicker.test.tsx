import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DirectoryPicker } from '../components/DirectoryPicker'
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

describe('DirectoryPicker', () => {
  beforeEach(() => {
    useStore.setState({ leftPath: '', rightPath: '', result: null, error: null })
  })

  it('renders left and right inputs', () => {
    render(<DirectoryPicker />)
    expect(screen.getByText('Left Directory')).toBeInTheDocument()
    expect(screen.getByText('Right Directory')).toBeInTheDocument()
  })

  it('sets left path on drop to left input area', () => {
    render(<DirectoryPicker />)
    const leftLabel = screen.getByText('Left Directory')
    const leftArea = leftLabel.closest('div')!

    fireEvent.drop(leftArea, createDropEvent(['/Users/test/folder-a']))

    expect(useStore.getState().leftPath).toBe('/Users/test/folder-a')
  })

  it('sets right path on drop to right input area', () => {
    render(<DirectoryPicker />)
    const rightLabel = screen.getByText('Right Directory')
    const rightArea = rightLabel.closest('div')!

    fireEvent.drop(rightArea, createDropEvent(['/Users/test/folder-b']))

    expect(useStore.getState().rightPath).toBe('/Users/test/folder-b')
  })

  it('does not cross-contaminate paths on drop', () => {
    render(<DirectoryPicker />)
    const leftLabel = screen.getByText('Left Directory')
    const leftArea = leftLabel.closest('div')!

    fireEvent.drop(leftArea, createDropEvent(['/Users/test/folder-a']))

    expect(useStore.getState().leftPath).toBe('/Users/test/folder-a')
    expect(useStore.getState().rightPath).toBe('')
  })

  it('drop on input element inside left area sets left path', () => {
    render(<DirectoryPicker />)
    const inputs = screen.getAllByPlaceholderText('Drop folder or type path')
    const leftInput = inputs[0]

    fireEvent.drop(leftInput, createDropEvent(['/Users/test/from-input']))

    // The drop should bubble to the parent handler and set the path
    expect(useStore.getState().leftPath).toBe('/Users/test/from-input')
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
