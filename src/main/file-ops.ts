import { copyFile, mkdir, unlink } from 'fs/promises'
import { dirname, join, relative } from 'path'

export async function copyFileToDir(
  sourcePath: string,
  sourceRoot: string,
  destRoot: string
): Promise<string> {
  const rel = relative(sourceRoot, sourcePath)
  const destPath = join(destRoot, rel)
  await mkdir(dirname(destPath), { recursive: true })
  await copyFile(sourcePath, destPath)
  return destPath
}

export async function moveFileToDir(
  sourcePath: string,
  sourceRoot: string,
  destRoot: string
): Promise<string> {
  const destPath = await copyFileToDir(sourcePath, sourceRoot, destRoot)
  await unlink(sourcePath)
  return destPath
}
