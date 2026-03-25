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
  const kpiRows = Object.entries(payload.kpis).map(([key, val]) => ({ Metric: key, Value: val }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), 'KPI Summary')

  // Sheet 2: Grade distribution
  const distRows = Object.entries(payload.gradeDistribution)
    .filter(([k]) => k !== 'byClass')
    .map(([key, val]) => ({ Grade: key, Students: val }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(distRows), 'Grade Distribution')

  // Sheet 3: Attendance trend
  if (payload.attendanceTrend.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.attendanceTrend as object[]), 'Attendance Trend')
  }

  // Sheet 4: At-risk students
  if (payload.atRiskStudents.length > 0) {
    const riskRows = (payload.atRiskStudents as { student: string; class: string; avg: number | null; attendanceRate: number; riskFactors: string[] }[])
      .map(s => ({
        Student:          s.student,
        Class:            s.class,
        Average:          s.avg,
        'Attendance %':   s.attendanceRate,
        'Risk Factors':   s.riskFactors.join(', '),
      }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riskRows), 'At-Risk Students')
  }

  // Download
  const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  XLSX.writeFile(wb, `${payload.title ?? 'Analytics'}_${dateStr}.xlsx`)
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

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([payload.summary]), 'Summary')
  if (payload.trend.length > 0)        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.trend as object[]), 'Monthly Trend')
  if (payload.byClass.length > 0)      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.byClass as object[]), 'By Class')
  if (payload.chronicAbsent.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.chronicAbsent as object[]), 'Chronic Absences')

  const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  XLSX.writeFile(wb, `Attendance_Report_${dateStr}.xlsx`)
}

// ── PDF: browser print ────────────────────────────────────────────────────────

export function printReport() {
  window.print()
}
