#!/usr/bin/env node

const { spawn } = require('child_process')
const { resolve, join } = require('path')

const args = process.argv.slice(2)
const appRoot = resolve(__dirname, '..')

// Find electron binary
let electronPath
try {
  electronPath = require('electron')
} catch {
  electronPath = join(appRoot, 'node_modules', '.bin', 'electron')
}

const child = spawn(String(electronPath), [appRoot, '--', ...args], {
  stdio: 'inherit',
  env: { ...process.env }
})

child.on('close', (code) => {
  process.exit(code ?? 0)
})
