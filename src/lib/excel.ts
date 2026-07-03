import * as XLSX from 'xlsx'

/**
 * Export any array of objects to an Excel (.xlsx) file and trigger browser download.
 */
export function exportToExcel<T extends object>(
  data: T[],
  filename: string,
  sheetName = 'Sheet1'
): void {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Export multiple sheets to a single Excel file.
 */
export function exportMultiSheetExcel(
  sheets: { name: string; data: object[] }[],
  filename: string
): void {
  const workbook = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  }
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
