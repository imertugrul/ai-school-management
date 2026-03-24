'use client'

import { useEffect, useRef, useState } from 'react'

interface FormState {
  name: string
  school: string
  email: string
  phone: string
  studentCount: string
  message: string
}

export default function LandingContact() {
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

  function validate() {
    const errs: Partial<FormState> = {}
    if (!form.name.trim())   errs.name   = 'Ad soyad zorunludur'
    if (!form.school.trim()) errs.school = 'Okul adı zorunludur'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Geçerli bir email giriniz'
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitted(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1.5px solid rgba(11,31,75,0.12)', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
    color: 'var(--text-dark)', backgroundColor: '#fafbfc',
    transition: 'border-color 0.2s',
  }

  return (
    <section id="contact" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--navy)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* ── Left: Info ──────────────────────────────────────────────── */}
          <div className="reveal space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 font-body text-xs font-semibold tracking-widest uppercase"
                style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: 'var(--gold)' }}>
                İletişim
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-tight" style={{ color: '#ffffff' }}>
                Okulunuz İçin
                <br />
                <span className="text-gold-gradient">Demo Talep Edin</span>
              </h2>
            </div>
            <p className="font-body text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Uzmanlarımız okulunuzun ihtiyaçlarını dinlesin, size özel demo sunsun.
            </p>

            {/* Contact details */}
            <div className="space-y-4">
              {[
                { icon: '📧', text: 'demo@schoolpro.ai' },
                { icon: '🌐', text: 'ai-school-management-omega.vercel.app' },
              ].map(c => (
                <div key={c.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
                    {c.icon}
                  </div>
                  <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{c.text}</span>
                </div>
              ))}
            </div>

            {/* Trust block */}
            <div className="flex flex-wrap gap-4 pt-4">
              {['🔒 KVKK Uyumlu', '🛡️ GDPR Compliant', '✓ 14 Gün Ücretsiz'].map(t => (
                <div key={t} className="px-4 py-2 rounded-full font-body text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Form ─────────────────────────────────────────────── */}
          <div className="reveal reveal-delay-2 rounded-3xl p-8 md:p-10"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
            {submitted ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-dark)' }}>Talebiniz Alındı!</h3>
                <p className="font-body" style={{ color: 'var(--text-muted)' }}>
                  En kısa sürede size dönüş yapacağız.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="font-display font-bold text-2xl mb-6" style={{ color: 'var(--text-dark)' }}>Demo Formu</h3>

                {/* Name + School */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Ad Soyad <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Mehmet Öztürk"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : undefined }}
                      onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                      onBlur={e => (e.target.style.borderColor = errors.name ? '#ef4444' : 'rgba(11,31,75,0.12)')}
                    />
                    {errors.name && <p className="font-body text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Okul Adı <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Anadolu Lisesi"
                      value={form.school}
                      onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
                      style={{ ...inputStyle, borderColor: errors.school ? '#ef4444' : undefined }}
                      onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                      onBlur={e => (e.target.style.borderColor = errors.school ? '#ef4444' : 'rgba(11,31,75,0.12)')}
                    />
                    {errors.school && <p className="font-body text-xs mt-1" style={{ color: '#ef4444' }}>{errors.school}</p>}
                  </div>
                </div>

                {/* Email + Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="mehmet@okul.edu.tr"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      style={{ ...inputStyle, borderColor: errors.email ? '#ef4444' : undefined }}
                      onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                      onBlur={e => (e.target.style.borderColor = errors.email ? '#ef4444' : 'rgba(11,31,75,0.12)')}
                    />
                    {errors.email && <p className="font-body text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Telefon
                    </label>
                    <input
                      type="tel"
                      placeholder="+90 532 123 45 67"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(11,31,75,0.12)')}
                    />
                  </div>
                </div>

                {/* Student count */}
                <div>
                  <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Öğrenci Sayısı
                  </label>
                  <select
                    value={form.studentCount}
                    onChange={e => setForm(f => ({ ...f, studentCount: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(11,31,75,0.12)')}
                  >
                    <option value="">Seçiniz</option>
                    <option value="0-100">0 – 100</option>
                    <option value="100-500">100 – 500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Mesaj
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Okulunuz hakkında kısa bilgi verin..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(11,31,75,0.12)')}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full font-body font-bold py-4 rounded-xl text-base transition-all hover:scale-[1.02] hover:shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, var(--navy), var(--navy-light))',
                    color: '#ffffff',
                    boxShadow: '0 8px 32px rgba(11,31,75,0.25)',
                  }}
                >
                  Demo Talep Et →
                </button>

                <p className="font-body text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  🔒 Bilgileriniz KVKK kapsamında korunur
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
