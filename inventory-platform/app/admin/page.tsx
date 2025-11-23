'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle } from 'lucide-react'

export default function AdminPage() {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const supabase = createClient()

  const handleImport = async () => {
    setImporting(true)
    setImportResult(null)

    try {
      const response = await fetch('/api/import-products', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setImportResult(`Successfully imported ${data.imported} products!`)
    } catch (error: any) {
      setImportResult(`Error: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Import</h2>
          <p className="text-gray-600 mb-6">
            Import products from january-2025-products.txt into the database.
          </p>

          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Upload className="w-5 h-5" />
            {importing ? 'Importing...' : 'Import Products'}
          </button>

          {importResult && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
              importResult.startsWith('Error') 
                ? 'bg-red-50 text-red-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              <CheckCircle className="w-5 h-5" />
              <span>{importResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

