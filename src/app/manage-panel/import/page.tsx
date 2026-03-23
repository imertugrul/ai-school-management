'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const downloadTemplate = () => {
    const template = 'name,email,password,role,className,subject\nAli Yilmaz,ali@school.com,pass123,STUDENT,9A,\nMehmet Oz,mehmet@school.com,pass123,TEACHER,,Mathematics'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-template.csv'
    a.click()
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const user: any = {}
      headers.forEach((header, index) => {
        user[header] = values[index] || ''
      })
      return user
    }).filter(user => user.name && user.email) // Filter out empty rows
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const users = parseCSV(text)

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users })
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ 
        success: false, 
        results: { 
          success: 0, 
          failed: 0, 
          errors: [error.message || 'Failed to import'] 
        } 
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Import Users</h1>
            <p className="text-gray-600 mt-1">Bulk import students and teachers via CSV</p>
          </div>
          <button
            onClick={() => router.push('/manage-panel')}
            className="btn-secondary"
          >
            ← Back
          </button>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">CSV Format</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Required columns:</strong> name, email, password, role, className
            </p>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Role values:</strong> STUDENT, TEACHER, ADMIN
            </p>
            <p className="text-sm text-blue-800">
              <strong>className:</strong> Must match existing class (e.g., 9A, 10B) - leave empty for teachers
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="btn-secondary text-sm"
          >
            📄 Download Template CSV
          </button>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upload CSV File</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={!file || importing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : 'Import Users'}
            </button>
          </form>

          {result && (
            <div className={`mt-6 border rounded-lg p-4 ${
              result.success && result.results.failed === 0
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="font-semibold mb-2">Import Results:</h3>
              <p className="text-sm">✅ Success: {result.results.success}</p>
              <p className="text-sm">❌ Failed: {result.results.failed}</p>
              
              {result.results.errors && result.results.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold mb-1">Errors:</p>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    {result.results.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
