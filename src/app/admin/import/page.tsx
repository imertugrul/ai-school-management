'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [userType, setUserType] = useState<'STUDENT' | 'TEACHER'>('STUDENT')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const downloadTemplate = () => {
    const csvContent = userType === 'STUDENT' 
      ? 'name,email,password,className\nJohn Doe,john@example.com,password123,11-A\nJane Smith,jane@example.com,password123,11-B'
      : 'name,email,password\nAlice Teacher,alice@example.com,password123\nBob Instructor,bob@example.com,password123'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${userType.toLowerCase()}_template.csv`
    link.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      alert('Please select a file!')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userType', userType)

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        setFile(null)
        alert(`Success! ${data.imported} users imported.`)
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred!')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Bulk Import (CSV)</h1>
            <button 
              onClick={() => router.push('/admin')}
              className="btn-secondary"
            >
              ← Admin Panel
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* User Type Selection */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">1. Select User Type</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setUserType('STUDENT')}
              className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                userType === 'STUDENT'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">👨‍🎓</div>
              <div className="font-semibold">Student</div>
            </button>
            <button
              onClick={() => setUserType('TEACHER')}
              className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                userType === 'TEACHER'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">👨‍🏫</div>
              <div className="font-semibold">Teacher</div>
            </button>
          </div>
        </div>

        {/* Download Template */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">2. Download CSV Template</h2>
          <p className="text-gray-600 mb-4">
            {userType === 'STUDENT' 
              ? 'Student template: name, email, password, className (e.g., 11-A)'
              : 'Teacher template: name, email, password'
            }
          </p>
          <button onClick={downloadTemplate} className="btn-secondary">
            📥 Download {userType === 'STUDENT' ? 'Student' : 'Teacher'} Template
          </button>
        </div>

        {/* Upload File */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">3. Upload CSV File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="text-4xl mb-4">📄</div>
              {file ? (
                <div>
                  <p className="text-green-600 font-semibold mb-2">Selected file:</p>
                  <p className="text-gray-700">{file.name}</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">Click to select CSV file</p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </div>
              )}
            </label>
          </div>

          {file && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary w-full mt-4"
            >
              {importing ? 'Importing...' : `Import ${userType === 'STUDENT' ? 'Students' : 'Teachers'}`}
            </button>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="card bg-green-50 border border-green-200">
            <h2 className="text-xl font-bold text-green-900 mb-4">✅ Import Complete!</h2>
            <div className="space-y-2 text-green-800">
              <p>✅ Success: <span className="font-bold">{result.imported}</span> users</p>
              {result.errors && result.errors.length > 0 && (
                <div>
                  <p className="text-red-600">❌ Errors: {result.errors.length} rows</p>
                  <div className="mt-2 text-sm">
                    {result.errors.slice(0, 5).map((err: any, i: number) => (
                      <p key={i} className="text-red-600">Row {err.row}: {err.error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Important Notes:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>CSV file must be in UTF-8 format</li>
            <li>First row should be the header</li>
            <li>Email addresses must be unique</li>
            {userType === 'STUDENT' && (
              <li>className column must match an existing class name (e.g., 11-A)</li>
            )}
            <li>Passwords must be at least 6 characters</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
