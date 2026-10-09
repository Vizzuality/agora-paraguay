/**
 * Opens the browser's print dialog for the report. The document title is what the
 * browser proposes as the PDF's file name, so it is swapped for the report's and put back
 * once the dialog closes. The report is always light: the `dark` class comes off the root
 * for the dialog's lifetime, so the print stylesheet never has to restate the theme.
 * Browser only: called from a click handler, never during render.
 */
export function printReport(fileName: string): void {
  const root = document.documentElement;
  const previousTitle = document.title;
  const wasDark = root.classList.contains('dark');

  const restore = () => {
    document.title = previousTitle;
    if (wasDark) root.classList.add('dark');
    window.removeEventListener('afterprint', restore);
  };

  window.addEventListener('afterprint', restore);
  document.title = fileName;
  root.classList.remove('dark');
  window.print();
}
