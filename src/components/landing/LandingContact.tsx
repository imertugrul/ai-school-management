'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { trackEvent } from '@/lib/analytics'

interface FormState {
  name: string; school: string; email: string
  phone: string; studentCount: string; message: string
}

export default function LandingContact() {
  const { t } = useLanguage()
  const ref = useRef<HTMLElement>(null)
  const [form, setForm] = useState<FormState>({ name: '', school: '', email: '', phone: '', studentCount: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<FormState>>({})

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    el.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Reset submitted state when language changes (so success message updates)
  useEffect(() => { setSubmitted(false) }, [t])

  function validate() {
    const errs: Partial<FormState> = {}
    if (!form.name.trim())   errs.name   = '!'
    if (!form.school.trim()) errs.school = '!'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = '!'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    trackEvent('demo_request', 'conversion', form.studentCount || 'unknown')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('[Contact] API error:', data)
        alert(data.error || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.')
        return
      }
    } catch (err) {
      console.error('[Contact] Network error:', err)
      alert('Bağlantı hatası. Lütfen tekrar deneyin.')
      return
    }
    setSubmitted(true)
  }

  const baseInput: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1.5px solid var(--gray-200)', outline: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px',
    color: 'var(--text)', backgroundColor: '#fafbfc', transition: 'border-color 0.2s',
  }

  const focusStyle = { borderColor: 'var(--accent)' }
  const blurStyle  = { borderColor: 'var(--gray-200)' }

  return (
    <section id="contact" ref={ref} className="py-24 lg:py-32"
      style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(147,197,253,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(196,181,253,0.15) 0%, transparent 50%), #F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Left: info */}
          <div className="reveal space-y-8 lg:pt-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 font-body text-xs font-semibold tracking-widest uppercase"
                style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}>
                İletişim
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl leading-tight" style={{ color: 'var(--text)' }}>
                {t.contact.title}
              </h2>
            </div>
            <p className="font-body text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t.contact.subtitle}
            </p>
            {/* Contact details */}
            <div className="space-y-3">
              {[
                { icon: '📧', text: t.contact.email_label },
                { icon: '🌐', text: t.contact.web_label },
              ].map(c => (
                <div key={c.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: 'var(--primary-pale)' }}>
                    {c.icon}
                  </div>
                  <span className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>{c.text}</span>
                </div>
              ))}
            </div>
            {/* Trust */}
            <div className="flex flex-wrap gap-3 pt-2">
              {['🔒 KVKK / GDPR', '✓ 14 Gün Ücretsiz', '⚡ Hızlı Kurulum'].map(tag => (
                <div key={tag} className="px-4 py-2 rounded-full font-body text-xs font-semibold"
                  style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)', border: '1px solid rgba(30,58,95,0.12)' }}>
                  {tag}
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="reveal reveal-delay-2 rounded-3xl p-8 md:p-10 shadow-xl"
            style={{ backgroundColor: '#fff', border: '1px solid var(--gray-200)' }}>
            {submitted ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text)' }}>
                  {t.contact.success.split('!')[0]}!
                </h3>
                <p className="font-body" style={{ color: 'var(--text-muted)' }}>
                  {t.contact.success.split('! ')[1] || ''}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text)' }}>
                  {t.contact.title}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: 'name' as const, label: t.contact.name, placeholder: 'Mehmet Öztürk', type: 'text' },
                    { key: 'school' as const, label: t.contact.school, placeholder: 'Anadolu Lisesi', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {f.label} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ ...baseInput, borderColor: errors[f.key] ? '#ef4444' : 'var(--gray-200)' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                        onBlur={e => (e.target.style.borderColor = errors[f.key] ? '#ef4444' : 'var(--gray-200)')}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      {t.contact.email} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="email" placeholder="demo@okul.edu.tr" value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      style={{ ...baseInput, borderColor: errors.email ? '#ef4444' : 'var(--gray-200)' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.target.style.borderColor = errors.email ? '#ef4444' : 'var(--gray-200)')}
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      {t.contact.phone}
                    </label>
                    <input type="tel" placeholder="+90 532..." value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      style={baseInput}
                      onFocus={e => Object.assign(e.target.style, focusStyle)}
                      onBlur={e => Object.assign(e.target.style, blurStyle)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {t.contact.size}
                  </label>
                  <select value={form.studentCount} onChange={e => setForm(p => ({ ...p, studentCount: e.target.value }))}
                    style={{ ...baseInput, cursor: 'pointer' }}
                    onFocus={e => Object.assign(e.target.style, focusStyle)}
                    onBlur={e => Object.assign(e.target.style, blurStyle)}>
                    <option value="">{t.contact.sizePlaceholder}</option>
                    <option value="0-100">{t.contact.size_0}</option>
                    <option value="100-500">{t.contact.size_1}</option>
                    <option value="500+">{t.contact.size_2}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {t.contact.message}
                  </label>
                  <textarea rows={3} placeholder={t.contact.messagePlaceholder} value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    style={{ ...baseInput, resize: 'none' }}
                    onFocus={e => Object.assign(e.target.style, focusStyle)}
                    onBlur={e => Object.assign(e.target.style, blurStyle)}
                  />
                </div>
                <button type="submit"
                  className="w-full font-body font-bold py-4 rounded-xl text-white text-base transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 24px rgba(79,142,247,0.4)' }}>
                  {t.contact.submit}
                </button>
                <p className="font-body text-xs text-center" style={{ color: 'var(--text-light)' }}>
                  {t.contact.privacy}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
