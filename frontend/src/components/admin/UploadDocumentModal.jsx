import { useEffect, useState } from 'react'
import { ChevronDown, CheckCircle2, UploadCloud, X } from 'lucide-react'

export default function UploadDocumentModal({ isOpen, departments, onClose, onSave }) {
  const [mockFile, setMockFile] = useState(null)
  const [departmentId, setDepartmentId] = useState('global')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setMockFile(null)
    setDepartmentId('global')
    setDescription('')
  }, [isOpen])

  if (!isOpen) return null

  const simulateFileSelect = () => {
    setMockFile({
      name: `document-nou-${Date.now()}.pdf`,
      size: Math.floor(Math.random() * 500000) + 50000,
      type: 'pdf',
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!mockFile) return

    const selectedDepartment = departments.find((department) => department.id === departmentId)

    onSave({
      filename: mockFile.name,
      file_size: mockFile.size,
      file_type: mockFile.type,
      department: departmentId === 'global' ? null : selectedDepartment,
      description: description.trim(),
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 hidden bg-black/50 md:block" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90vh] md:w-full md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold">Upload document</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 active:bg-slate-100"
            aria-label="Închide"
          >
            <X size={20} />
          </button>
        </header>

        <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <button
              type="button"
              onClick={simulateFileSelect}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition-colors active:bg-slate-50 md:p-10"
            >
              <UploadCloud size={40} className="mx-auto text-slate-400" />
              {!mockFile ? (
                <>
                  <p className="mt-3 text-sm text-slate-500">Apasă pentru a selecta fișierul</p>
                  <p className="mt-1 text-xs text-slate-400">PDF, TXT, CSV, MD — max 10MB</p>
                  <p className="mt-2 hidden text-xs text-slate-400 md:block">Poți trage fișierul aici (simulare vizuală)</p>
                </>
              ) : (
                <>
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span className="max-w-[260px] truncate">{mockFile.name}</span>
                  </div>
                  <span className="mt-2 inline-block text-xs font-medium text-blue-600">Schimbă fișier</span>
                </>
              )}
            </button>

            <div>
              <label htmlFor="kb-department" className="mb-1 block text-sm font-medium text-slate-700">
                Departament
              </label>
              <div className="relative">
                <select
                  id="kb-department"
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className="w-full min-h-[44px] appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="global">📂 Global (toate departamentele)</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div>
              <label htmlFor="kb-description" className="mb-1 block text-sm font-medium text-slate-700">
                Descriere (opțional)
              </label>
              <textarea
                id="kb-description"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descriere opțională a documentului"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <footer className="border-t border-slate-200 px-4 py-3">
            <button
              type="submit"
              disabled={!mockFile}
              className="min-h-[48px] w-full rounded-xl bg-blue-600 font-semibold text-white transition-all active:scale-[0.98] active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Uploadează
            </button>
          </footer>
        </form>
      </div>
    </>
  )
}
