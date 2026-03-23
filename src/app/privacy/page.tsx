import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-blue-600">
            ← Back
          </Link>
          <span className="text-sm font-bold text-gray-700">Privacy Policy</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: March 2026</p>

        <div className="space-y-10 text-gray-700">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. What Data We Collect</h2>
            <p className="mb-3">We collect the following categories of personal data:</p>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li><strong>Account data:</strong> Name, email address, hashed password, role (student / teacher / admin / parent).</li>
              <li><strong>Academic data:</strong> Test answers, grades, attendance records, lesson plans, course enrollments.</li>
              <li><strong>Usage data:</strong> Session tokens, login timestamps (managed by NextAuth.js).</li>
              <li><strong>Media uploads:</strong> Files you upload to the platform (stored on Vercel Blob).</li>
            </ul>
            <p className="text-sm mt-3">We do <strong>not</strong> collect: government IDs, financial data, health data, or biometric data.</p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Where Data Is Stored</h2>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li><strong>Database:</strong> Neon PostgreSQL — data at rest is encrypted (AES-256). Hosted in the US (AWS us-east-1).</li>
              <li><strong>File storage:</strong> Vercel Blob — files are stored in Vercel's CDN-backed object storage.</li>
              <li><strong>Application hosting:</strong> Vercel Edge Network — HTTPS enforced on all endpoints.</li>
              <li><strong>Session tokens:</strong> HTTP-only cookies, not accessible to JavaScript.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. How AI Processing Works</h2>
            <p className="mb-3 text-sm">
              This platform uses AI models (OpenAI GPT-4o-mini, Anthropic Claude) for automatic grading and lesson plan generation.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm space-y-2">
              <p className="font-semibold text-green-800">✅ Anonymization guarantee</p>
              <p className="text-green-700">
                Student names, email addresses, IDs, class names, and school names are <strong>never</strong> included
                in prompts sent to AI providers. Only anonymous answer text and question content are processed.
              </p>
              <p className="text-green-700">
                Every AI call is logged in our audit database with a <code>hasPersonalData: false</code> flag,
                which is verified programmatically before each request.
              </p>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-3">
              <li>OpenAI Data Processing Addendum (DPA) is required to be signed by the organization.</li>
              <li>AI provider links: <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noreferrer" className="text-blue-600 underline">OpenAI Privacy Policy</a>, <a href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer" className="text-blue-600 underline">Anthropic Privacy Policy</a>.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Your Rights Under KVKK (Law No. 6698) and GDPR</h2>
            <p className="text-sm mb-3">Under KVKK Article 11 and GDPR Article 15–22, you have the right to:</p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { icon: '🔍', right: 'Access', desc: 'Request a copy of all personal data we hold about you.' },
                { icon: '✏️', right: 'Rectification', desc: 'Correct inaccurate or incomplete data.' },
                { icon: '🗑️', right: 'Erasure (Right to be Forgotten)', desc: 'Request permanent deletion of all your data. School admins can trigger this via the admin panel.' },
                { icon: '📤', right: 'Data Portability', desc: 'Receive your data in a machine-readable format.' },
                { icon: '🚫', right: 'Object to Processing', desc: 'Object to processing of your data for specific purposes.' },
                { icon: '⏸️', right: 'Restriction', desc: 'Request restriction of processing in certain circumstances.' },
              ].map(r => (
                <div key={r.right} className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="font-semibold text-gray-900">{r.icon} {r.right}</p>
                  <p className="text-gray-500 mt-1">{r.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Retention</h2>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li>Student academic records are retained for the duration of the student's enrollment plus 2 years.</li>
              <li>AI audit logs are retained for 1 year.</li>
              <li>Deleted user data is purged immediately and is not recoverable.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact</h2>
            <p className="text-sm">
              For privacy-related requests, please contact your school administrator or our Data Protection Officer (DPO):
            </p>
            <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4 text-sm">
              <p className="font-semibold text-gray-900">Data Protection Officer</p>
              <p className="text-gray-500">Email: privacy@schoolapp.example</p>
              <p className="text-gray-500">Response time: Within 30 days (KVKK) / 1 month (GDPR)</p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} School Management Platform. All rights reserved.
      </footer>
    </div>
  )
}
