import { parentPort, workerData } from 'worker_threads'
import { scanDirectory } from './scanner'

const { rootPath } = workerData as { rootPath: string }

scanDirectory(rootPath, (current, total, currentFile) => {
  parentPort?.postMessage({ type: 'progress', current, total, currentFile })
}).then((entries) => {
  parentPort?.postMessage({ type: 'done', entries })
}).catch((error) => {
  parentPort?.postMessage({ type: 'error', error: error.message })
})
