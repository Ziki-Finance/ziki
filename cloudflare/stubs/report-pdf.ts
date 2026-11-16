/**
 * Cloudflare build stand-in for components/security-checks/report-pdf.tsx (CR-002, D-015).
 * @react-pdf/renderer (pdfkit) can't be bundled for Workers and needs far more than the Free
 * plan's 10 ms of CPU. The report route catches this and tells the person the PDF isn't available.
 */
export function renderReportPdf(): Promise<never> {
  return Promise.reject(new Error("PDF reports are not available on the Cloudflare deployment."));
}
