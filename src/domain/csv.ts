/** Spreadsheet-safe CSV. Cells that could run as formulas in Excel are neutralized. */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  const cell = (value: string | number) => {
    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text) && typeof value === 'string') text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}
