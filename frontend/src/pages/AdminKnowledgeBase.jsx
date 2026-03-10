import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileCode,
  FileText,
  FolderOpen,
  Loader2,
  RefreshCw,
  Table2,
  Trash2,
  Upload,
} from 'lucide-react'
import UploadDocumentModal from '../components/admin/UploadDocumentModal'
import { MOCK_DEPARTMENTS_FULL, MOCK_KB_DOCUMENTS } from '../mocks/admin'
import { formatFileSize } from '../utils/formatFileSize'

const statusConfig = {
  indexed: {
    label: 'Indexat',
    className: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  processing: {
    label: 'Procesare...',
    className: 'bg-blue-100 text-blue-700',
    icon: Loader2,
  },
  error: {
    label: 'Eroare',
    className: 'bg-red-100 text-red-700',
    icon: AlertCircle,
  },
}

const tabBase = [
  { id: null, label: 'Toate' },
  { id: 'global', label: 'Global' },
]

const monthMap = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec']

function formatDateRo(dateValue) {
  const date = new Date(dateValue)
  const day = date.getDate()
  const month = monthMap[date.getMonth()]
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

function getFileTypeMeta(type) {
  if (type === 'csv') return { Icon: Table2, iconClass: 'text-green-500' }
  if (type === 'md') return { Icon: FileCode, iconClass: 'text-purple-500' }
  if (type === 'pdf') return { Icon: FileText, iconClass: 'text-red-500' }

  return { Icon: FileText, iconClass: 'text-slate-500' }
}

export default function AdminKnowledgeBase() {
  const [documents, setDocuments] = useState(MOCK_KB_DOCUMENTS)
  const [activeTab, setActiveTab] = useState(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const totalChunks = useMemo(() => documents.reduce((total, doc) => total + doc.chunk_count, 0), [documents])

  const tabs = useMemo(() => {
    const departmentTabs = MOCK_DEPARTMENTS_FULL.slice(0, 4).map((department) => ({ id: department.id, label: department.name }))

    return [...tabBase, ...departmentTabs].map((tab) => {
      const count =
        tab.id === null
          ? documents.length
          : tab.id === 'global'
            ? documents.filter((document) => document.department === null).length
            : documents.filter((document) => document.department?.id === tab.id).length

      return { ...tab, count }
    })
  }, [documents])

  const filteredDocs = useMemo(() => {
    const matching =
      activeTab === 'global'
        ? documents.filter((document) => document.department === null)
        : activeTab
          ? documents.filter((document) => document.department?.id === activeTab)
          : documents

    return [...matching].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [documents, activeTab])

  const stats = useMemo(
    () => ({
      indexed: documents.filter((document) => document.status === 'indexed').length,
      processing: documents.filter((document) => document.status === 'processing').length,
      error: documents.filter((document) => document.status === 'error').length,
    }),
    [documents],
  )

  const handleDelete = (document) => {
    if (!window.confirm(`Sigur dorești să ștergi documentul „${document.filename}”?`)) return

    setDocuments((current) => current.filter((item) => item.id !== document.id))
  }

  const handleReindex = (document) => {
    setDocuments((current) =>
      current.map((item) => (item.id === document.id ? { ...item, status: 'processing', chunk_count: item.chunk_count } : item)),
    )

    window.setTimeout(() => {
      const randomGain = Math.floor(Math.random() * 3) + 1
      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id ? { ...item, status: 'indexed', chunk_count: item.chunk_count + randomGain } : item,
        ),
      )
    }, 2000)
  }

  const handleUpload = (payload) => {
    const newDocument = {
      id: `kb-${Date.now()}`,
      filename: payload.filename,
      file_type: payload.file_type,
      file_size: payload.file_size,
      department: payload.department
        ? { id: payload.department.id, name: payload.department.name, color: payload.department.color }
        : null,
      chunk_count: 0,
      status: 'processing',
      uploaded_by: 'Administrator Sistem',
      created_at: new Date().toISOString().slice(0, 10),
      description: payload.description,
    }

    setDocuments((current) => [newDocument, ...current])
    setIsUploadOpen(false)

    window.setTimeout(() => {
      setDocuments((current) =>
        current.map((item) =>
          item.id === newDocument.id
            ? {
                ...item,
                status: 'indexed',
                chunk_count: Math.floor(Math.random() * 11) + 5,
              }
            : item,
        ),
      )
    }, 3000)
  }

  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? 'Toate'

  return (
    <section className="w-full">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Bază de cunoștințe</h1>
          <p className="mt-1 text-sm text-slate-500">
            {documents.length} documente · {totalChunks} chunk-uri indexate
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-blue-600 px-4 text-sm font-medium text-white transition-all active:scale-[0.97] active:bg-blue-700"
        >
          <Upload size={16} />
          Upload
        </button>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <article className="rounded-xl bg-green-50 p-3 text-center">
          <CheckCircle2 size={18} className="mx-auto text-green-600" />
          <p className="mt-1 text-lg font-bold text-green-700">{stats.indexed}</p>
          <p className="text-[10px] text-slate-500">Indexate</p>
        </article>
        <article className="rounded-xl bg-blue-50 p-3 text-center">
          <Loader2 size={18} className="mx-auto animate-spin text-blue-600" />
          <p className="mt-1 text-lg font-bold text-blue-700">{stats.processing}</p>
          <p className="text-[10px] text-slate-500">În procesare</p>
        </article>
        <article className="rounded-xl bg-red-50 p-3 text-center">
          <AlertCircle size={18} className="mx-auto text-red-600" />
          <p className="mt-1 text-lg font-bold text-red-700">{stats.error}</p>
          <p className="text-[10px] text-slate-500">Eroare</p>
        </article>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 min-h-[44px] rounded-full border px-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-600 active:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          )
        })}
      </div>

      {filteredDocs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <FolderOpen size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Niciun document în {activeTabLabel}</p>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="mx-auto mt-4 flex min-h-[44px] items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white active:bg-blue-700"
          >
            Uploadează document
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
          {filteredDocs.map((document) => {
            const status = statusConfig[document.status]
            const StatusIcon = status.icon
            const { Icon: FileIcon, iconClass } = getFileTypeMeta(document.file_type)

            return (
              <article key={document.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center">
                    <FileIcon size={18} className={iconClass} />
                    <h2 className="ml-2 truncate text-sm font-medium">{document.filename}</h2>
                  </div>
                  <p className="text-xs text-slate-400">{formatFileSize(document.file_size)}</p>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  {document.department ? (
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: document.department.color }}
                    >
                      ● {document.department.name}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">📂 Global</span>
                  )}
                  <p className="text-xs text-slate-400">{document.chunk_count} chunk-uri</p>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                    <StatusIcon size={13} className={document.status === 'processing' ? 'animate-spin' : ''} />
                    {status.label}
                  </span>
                  <p className="text-xs text-slate-400">Uploadat: {formatDateRo(document.created_at)}</p>
                </div>

                <p className="mt-1 text-xs text-slate-400">Uploadat de: {document.uploaded_by}</p>

                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleReindex(document)}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 transition-colors active:bg-slate-200"
                  >
                    <RefreshCw size={14} />
                    Re-indexare
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(document)}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 text-sm font-medium text-red-600 transition-colors active:bg-red-100"
                  >
                    <Trash2 size={14} />
                    Șterge
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <UploadDocumentModal
        isOpen={isUploadOpen}
        departments={MOCK_DEPARTMENTS_FULL}
        onClose={() => setIsUploadOpen(false)}
        onSave={handleUpload}
      />
    </section>
  )
}
