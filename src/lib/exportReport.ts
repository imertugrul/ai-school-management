/**
 * Export utilities for analytics reports
 * Excel: uses xlsx library
 * PDF: triggers browser print with a print-optimised view
 */

// ── Excel export ──────────────────────────────────────────────────────────────

export async function exportExcel(payload: {
  kpis:              Record<string, unknown>
  gradeDistribution: Record<string, unknown>
  attendanceTrend:   unknown[]
  atRiskStudents:    unknown[]
  title?:            string
}) {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()

  // Sheet 1: KPI Summary
  const kpiRows = Object.entries(payload.kpis).map(([key, val]) => ({ Metrik: key, Değer: val }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), 'KPI Özet')

  // Sheet 2: Grade distribution
  const distRows = Object.entries(payload.gradeDistribution)
    .filter(([k]) => k !== 'byClass')
    .map(([key, val]) => ({ Harf: key, Öğrenci: val }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(distRows), 'Not Dağılımı')

  // Sheet 3: Attendance trend
  if (payload.attendanceTrend.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.attendanceTrend as object[]), 'Devamsızlık Trendi')
  }

  // Sheet 4: At-risk students
  if (payload.atRiskStudents.length > 0) {
    const riskRows = (payload.atRiskStudents as { student: string; class: string; avg: number | null; attendanceRate: number; riskFactors: string[] }[])
      .map(s => ({
        Öğrenci:    s.student,
        Sınıf:      s.class,
        Ortalama:   s.avg,
        'Devam %':  s.attendanceRate,
        'Risk Faktörleri': s.riskFactors.join(', '),
      }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riskRows), 'Risk Öğrenciler')
  }

  // Download
  const dateStr = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')
  XLSX.writeFile(wb, `${payload.title ?? 'Analitik'}_${dateStr}.xlsx`)
}

// ── Staff Excel export ────────────────────────────────────────────────────────

export async function exportStaffExcel(payload: {
  summary:      Record<string, unknown>
  trend:        unknown[]
  byClass:      unknown[]
  chronicAbsent: unknown[]
}) {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([payload.summary]), 'Özet')
  if (payload.trend.length > 0)        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.trend as object[]), 'Aylık Trend')
  if (payload.byClass.length > 0)      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.byClass as object[]), 'Sınıf Bazlı')
  if (payload.chronicAbsent.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.chronicAbsent as object[]), 'Kronik Devamsızlar')

  const dateStr = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')
  XLSX.writeFile(wb, `Devamsızlık_Raporu_${dateStr}.xlsx`)
}

// ── PDF: browser print ────────────────────────────────────────────────────────

export function printReport() {
  window.print()
}
