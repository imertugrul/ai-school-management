import Link from 'next/link'

const COLUMNS = [
  {
    title: 'Ürün',
    links: [
      { label: 'Özellikler',    href: '#features' },
      { label: 'Fiyatlandırma', href: '#pricing' },
      { label: 'Demo',          href: '#contact' },
      { label: 'Destek',        href: '#contact' },
    ],
  },
  {
    title: 'Şirket',
    links: [
      { label: 'Hakkımızda', href: '#' },
      { label: 'Kariyer',    href: '#' },
      { label: 'İletişim',   href: '#contact' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { label: 'Gizlilik Politikası', href: '/privacy' },
      { label: 'KVKK',                href: '/privacy' },
      { label: 'Kullanım Koşulları',  href: '#' },
    ],
  },
]

export default function LandingFooter() {
  return (
    <footer style={{ backgroundColor: 'var(--navy-dark)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎓</span>
              <span className="font-body text-xl font-bold text-white">
                SchoolPro <span style={{ color: 'var(--gold)' }}>AI</span>
              </span>
            </div>
            <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Eğitimin geleceği bugün başlıyor.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map(col => (
            <div key={col.title}>
              <h4 className="font-body text-xs font-bold tracking-widest uppercase mb-4"
                style={{ color: 'var(--gold)' }}>
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="font-body text-sm transition-colors"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © 2026 SchoolPro AI. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4 font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>🔒 KVKK Uyumlu</span>
            <span>|</span>
            <span>🛡️ GDPR Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
