/**
 * Downloads a Blob as a file without using .click() (which bubbles and can trigger
 * React Router navigation) and without delegating to xlsx/jsPDF's internal
 * file-saver bundle (which uses setTimeout + bubbling MouseEvent as a fallback).
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.dispatchEvent(new MouseEvent("click", { bubbles: false, cancelable: false }))
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
