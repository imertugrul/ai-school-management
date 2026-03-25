import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Left half — dark navy */}
        <div
          style={{
            width: 560,
            height: '100%',
            background: '#1E3A5F',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 56px',
            gap: 0,
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ fontSize: 40 }}>🎓</div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>
              SchoolPro <span style={{ color: '#4F8EF7' }}>AI</span>
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              color: '#fff',
              fontSize: 34,
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            Yapay Zeka Destekli{'\n'}Okul Yönetim Sistemi
          </div>

          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 36 }}>
            IB · AP · MEB · IGCSE destekli
          </div>

          {/* Features */}
          {[
            '🤖  AI ile 2 dakikada ders planı',
            '📊  Otomatik puanlama sistemi',
            '💬  Veli WhatsApp & Email bildirimleri',
          ].map(text => (
            <div
              key={text}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 15,
                marginBottom: 10,
                gap: 4,
              }}
            >
              {text}
            </div>
          ))}

          {/* URL */}
          <div style={{ color: '#4F8EF7', fontSize: 13, marginTop: 32, fontWeight: 600 }}>
            www.schoolproai.com
          </div>
        </div>

        {/* Right half — light gradient */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #EEF3FB 0%, #dbeafe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
          }}
        >
          {/* Dashboard mockup */}
          <div
            style={{
              width: '100%',
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 8px 40px rgba(30,58,95,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Window chrome */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fca5a5' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fcd34d' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6ee7b7' }} />
            </div>
            {/* Stat cards row */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Öğrenciler', val: '2,450', color: '#1E3A5F' },
                { label: 'Öğretmenler', val: '180',   color: '#4F8EF7' },
                { label: 'Başarı',     val: '%94',    color: '#10B981' },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    background: '#F8FAFC',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: 11 }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.val}</div>
                </div>
              ))}
            </div>
            {/* Progress bars */}
            {[
              { label: 'Matematik', pct: 84, color: '#4F8EF7' },
              { label: 'Fen',       pct: 71, color: '#10B981' },
              { label: 'Türkçe',    pct: 91, color: '#1E3A5F' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 60, color: '#64748b', fontSize: 12 }}>{b.label}</div>
                <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4 }}>
                  <div
                    style={{
                      width: `${b.pct}%`,
                      height: '100%',
                      background: b.color,
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div style={{ width: 32, color: b.color, fontSize: 12, fontWeight: 700 }}>{b.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
