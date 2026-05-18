'use client'

import { useState } from 'react'

export interface WorksheetMeta {
  title?: string
  topic?: string
  courseCode?: string | null
  courseName?: string | null
  grade?: string | null
  curriculum?: string | null
  language?: string | null
  className?: string | null
  createdAt?: string | Date | null
}

export interface WorksheetContent {
  practice?: { questions?: Array<{ type: 'mcq' | 'short' | 'truefalse'; question: string; options?: string[]; answer?: string }> }
  activity?: { activities?: Array<{ title: string; instructions: string; studentSpace?: string }> }
  reading?: { text?: string; questions?: Array<{ question: string; answer?: string }> }
  notes?: { sections?: Array<{ title: string; lines?: number }> }
}

interface Props {
  meta: WorksheetMeta
  content: WorksheetContent
  /** Action bar — Print/PDF/Close — rendered above the printable area */
  toolbar?: React.ReactNode
}

export function WorksheetView({ meta, content, toolbar }: Props) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {toolbar && (
        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow shrink-0">
              <span className="text-white text-lg">📄</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{meta.title || meta.topic || 'Worksheet'}</h3>
              <p className="text-xs text-gray-500 truncate">
                {meta.courseCode && <>{meta.courseCode}</>}
                {meta.language && <> · {meta.language === 'tr' ? 'Türkçe' : 'İngilizce'}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">{toolbar}</div>
        </div>
      )}

      <div id="worksheet-content" className="px-6 py-6 space-y-8 bg-white">
        {/* Print/PDF header */}
        <div className="pb-4 border-b border-gray-300">
          <h1 className="text-xl font-bold text-gray-900">{meta.title || meta.topic || 'Worksheet'}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {meta.courseCode && <>{meta.courseCode}</>}
            {meta.courseName && <> – {meta.courseName}</>}
            {meta.grade && <> · Sınıf: {meta.grade}</>}
            {meta.className && <> · {meta.className}</>}
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-sm">
            <div>Öğrenci Adı: <span className="inline-block w-64 border-b border-gray-400 align-bottom" /></div>
            <div>Tarih: <span className="inline-block w-32 border-b border-gray-400 align-bottom" /></div>
          </div>
        </div>

        {/* Practice */}
        {(content.practice?.questions?.length ?? 0) > 0 && (
          <Section icon="✏️" title="Alıştırma Soruları">
            <ol className="space-y-4 list-decimal list-inside">
              {content.practice!.questions!.map((q, i) => (
                <li key={i} className="text-sm text-gray-800">
                  <span className="font-medium">{q.question}</span>
                  {q.type === 'mcq' && Array.isArray(q.options) && (
                    <ul className="mt-2 ml-6 space-y-1.5">
                      {q.options.map((opt, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-5 h-5 border border-gray-400 rounded-full inline-block shrink-0 mt-0.5" />
                          <span>{String.fromCharCode(65 + j)}) {opt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.type === 'short' && <div className="mt-2 ml-6 border-b border-gray-300 h-8" />}
                  {q.type === 'truefalse' && (
                    <div className="mt-2 ml-6 flex gap-6 text-sm text-gray-700">
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border border-gray-400 rounded inline-block" /> Doğru</span>
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border border-gray-400 rounded inline-block" /> Yanlış</span>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Activity */}
        {(content.activity?.activities?.length ?? 0) > 0 && (
          <Section icon="🎯" title="Etkinlikler">
            <div className="space-y-4">
              {content.activity!.activities!.map((a, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 print:break-inside-avoid">
                  <h4 className="font-bold text-sm text-gray-900 mb-1">{a.title}</h4>
                  <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{a.instructions}</p>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 min-h-[80px] text-xs text-gray-400 italic whitespace-pre-line">
                    {a.studentSpace || 'Öğrenci için boşluk'}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Reading */}
        {content.reading?.text && (
          <Section icon="📖" title="Okuma Metni">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 border border-gray-200 print:break-inside-avoid">
              {content.reading.text}
            </p>
            {(content.reading.questions?.length ?? 0) > 0 && (
              <ol className="mt-4 space-y-3 list-decimal list-inside">
                {content.reading.questions!.map((q, i) => (
                  <li key={i} className="text-sm text-gray-800">
                    <span className="font-medium">{q.question}</span>
                    <div className="mt-2 ml-6 border-b border-gray-300 h-8" />
                  </li>
                ))}
              </ol>
            )}
          </Section>
        )}

        {/* Notes */}
        {(content.notes?.sections?.length ?? 0) > 0 && (
          <Section icon="📓" title="Not Alma Şablonu">
            <div className="space-y-4">
              {content.notes!.sections!.map((s, i) => (
                <div key={i} className="print:break-inside-avoid">
                  <h4 className="font-bold text-sm text-gray-900 mb-2">{s.title}</h4>
                  <div className="space-y-1">
                    {Array.from({ length: Math.max(1, Math.min(s.lines ?? 4, 12)) }).map((_, j) => (
                      <div key={j} className="border-b border-gray-300 h-6" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="print:break-inside-avoid">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
        <span className="text-lg">{icon}</span>
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </section>
  )
}

/** Triggers an html2pdf download from the element with id="worksheet-content". */
export async function downloadWorksheetPDF(filename: string) {
  if (typeof window === 'undefined') return
  const element = document.getElementById('worksheet-content')
  if (!element) return
  // html2pdf.js has no TS types
  // @ts-ignore
  const html2pdfMod: any = await import('html2pdf.js')
  const html2pdf = html2pdfMod.default ?? html2pdfMod
  await html2pdf().set({
    margin: 10,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }).from(element).save()
}

/** Hook providing a stable PDF-downloading state. */
export function usePdfDownload() {
  const [downloading, setDownloading] = useState(false)
  const download = async (filename: string) => {
    if (downloading) return
    setDownloading(true)
    try { await downloadWorksheetPDF(filename) }
    finally { setDownloading(false) }
  }
  return { downloading, download }
}
