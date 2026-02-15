// Shared canvas for text measurement (avoids creating one per call)
let measureCtx: CanvasRenderingContext2D | null | undefined
function getTextWidth(text: string, font: string): number {
  if (measureCtx === undefined) {
    measureCtx = document.createElement('canvas').getContext('2d')
  }
  if (!measureCtx) return text.length * 8 // fallback estimate
  measureCtx.font = font
  return measureCtx.measureText(text).width
}

/**
 * Compute middle-truncated string: "start…end"
 * Splits available space roughly 50/50 between start and end portions.
 */
export function middleTruncate(text: string, availableWidth: number, font: string): string {
  const fullWidth = getTextWidth(text, font)
  if (fullWidth <= availableWidth) return text

  const ellipsis = '\u2026'
  const ellipsisWidth = getTextWidth(ellipsis, font)
  const budget = availableWidth - ellipsisWidth
  if (budget <= 0) return ellipsis

  const halfBudget = budget / 2

  // Find how many chars fit from the start
  let startLen = 0
  for (let i = 1; i <= text.length; i++) {
    if (getTextWidth(text.slice(0, i), font) > halfBudget) break
    startLen = i
  }

  // Find how many chars fit from the end
  let endLen = 0
  for (let i = 1; i <= text.length; i++) {
    if (getTextWidth(text.slice(text.length - i), font) > halfBudget) break
    endLen = i
  }

  if (startLen === 0 && endLen === 0) return ellipsis
  return text.slice(0, startLen) + ellipsis + text.slice(text.length - endLen)
}
