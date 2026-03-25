export interface BulletinEmailData {
  studentName: string
  guardianName: string
  month: string // "2026-03"
  className: string
  teacherName: string
  attendancePresent: number
  attendanceAbsent: number
  attendanceLate: number
  gradeAverage: number | null
  gradeDetails: { courseName: string; average: number }[] | null
  participationRating: number | null
  behaviorRating: number | null
  homeworkRating: number | null
  strengthAreas: string | null
  improvementAreas: string | null
  teacherComment: string | null
  schoolName?: string
}

function ratingLabel(r: number | null): string {
  if (r === null) return '—'
  if (r >= 5) return '⭐⭐⭐⭐⭐ Excellent'
  if (r >= 4) return '⭐⭐⭐⭐ Good'
  if (r >= 3) return '⭐⭐⭐ Average'
  if (r >= 2) return '⭐⭐ Needs Improvement'
  return '⭐ Insufficient'
}

function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${months[parseInt(m)] ?? m} ${year}`
}

export function buildBulletinEmail(data: BulletinEmailData): { subject: string; html: string } {
  const monthStr = monthLabel(data.month)
  const totalDays = data.attendancePresent + data.attendanceAbsent + data.attendanceLate
  const attendancePct = totalDays > 0
    ? Math.round((data.attendancePresent / totalDays) * 100)
    : 0

  const gradeRows = (data.gradeDetails ?? [])
    .map(g => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${g.courseName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#1e40af;">${g.average.toFixed(1)}</td>
      </tr>`)
    .join('')

  const subject = `${monthStr} Monthly Performance Bulletin — ${data.studentName}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,.7);letter-spacing:1px;text-transform:uppercase;">${data.schoolName ?? 'School'}</p>
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">${monthStr} Performance Bulletin</h1>
            <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,.85);">${data.studentName} · ${data.className}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">

          <p style="margin:0 0 24px;font-size:15px;color:#374151;">
            Dear <strong>${data.guardianName}</strong>,<br/>
            Please find below the ${monthStr} monthly performance bulletin prepared by <strong>${data.teacherName}</strong>.
          </p>

          <!-- Attendance -->
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Attendance</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:28px;overflow:hidden;">
            <tr>
              <td style="padding:16px;text-align:center;border-right:1px solid #e5e7eb;">
                <div style="font-size:28px;font-weight:700;color:#059669;">${data.attendancePresent}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:2px;">Present</div>
              </td>
              <td style="padding:16px;text-align:center;border-right:1px solid #e5e7eb;">
                <div style="font-size:28px;font-weight:700;color:#dc2626;">${data.attendanceAbsent}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:2px;">Absent</div>
              </td>
              <td style="padding:16px;text-align:center;border-right:1px solid #e5e7eb;">
                <div style="font-size:28px;font-weight:700;color:#d97706;">${data.attendanceLate}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:2px;">Late</div>
              </td>
              <td style="padding:16px;text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#1e40af;">${attendancePct}%</div>
                <div style="font-size:12px;color:#6b7280;margin-top:2px;">Attendance Rate</div>
              </td>
            </tr>
          </table>

          ${data.gradeAverage !== null ? `
          <!-- Grades -->
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Grade Average</h2>
          <div style="background:#eff6ff;border-left:4px solid #1e40af;border-radius:8px;padding:16px;margin-bottom:${gradeRows ? '0' : '28px'};">
            <span style="font-size:32px;font-weight:700;color:#1e40af;">${data.gradeAverage.toFixed(1)}</span>
            <span style="font-size:14px;color:#6b7280;margin-left:8px;">/ 100</span>
          </div>
          ${gradeRows ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;margin-top:8px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">Subject</th>
                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;">Average</th>
              </tr>
            </thead>
            <tbody>${gradeRows}</tbody>
          </table>` : '<div style="margin-bottom:28px;"></div>'}
          ` : ''}

          <!-- Teacher Assessment -->
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Teacher Assessment</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <span style="font-size:13px;color:#374151;font-weight:600;">Participation: </span>
              <span style="font-size:13px;color:#6b7280;">${ratingLabel(data.participationRating)}</span>
            </td></tr>
            <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <span style="font-size:13px;color:#374151;font-weight:600;">Behavior: </span>
              <span style="font-size:13px;color:#6b7280;">${ratingLabel(data.behaviorRating)}</span>
            </td></tr>
            <tr><td style="padding:12px 16px;">
              <span style="font-size:13px;color:#374151;font-weight:600;">Homework: </span>
              <span style="font-size:13px;color:#6b7280;">${ratingLabel(data.homeworkRating)}</span>
            </td></tr>
          </table>

          ${data.strengthAreas ? `
          <h2 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.5px;">Strengths</h2>
          <div style="background:#f0fdf4;border-left:4px solid #059669;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:14px;color:#374151;line-height:1.6;">
            ${data.strengthAreas}
          </div>` : ''}

          ${data.improvementAreas ? `
          <h2 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:.5px;">Areas for Improvement</h2>
          <div style="background:#fffbeb;border-left:4px solid #d97706;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:14px;color:#374151;line-height:1.6;">
            ${data.improvementAreas}
          </div>` : ''}

          ${data.teacherComment ? `
          <h2 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.5px;">Teacher Comment</h2>
          <div style="background:#faf5ff;border-left:4px solid #7c3aed;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">
            "${data.teacherComment}"
          </div>` : ''}

          <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
            This bulletin was prepared by ${data.teacherName}.<br/>
            ${data.schoolName ?? ''} · ${monthStr}
          </p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}
