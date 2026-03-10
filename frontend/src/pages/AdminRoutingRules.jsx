import { useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, FlaskConical, Pencil, Plus } from 'lucide-react'
import ToggleSwitch from '../components/common/ToggleSwitch'
import RoutingRuleModal from '../components/admin/RoutingRuleModal'
import { MOCK_ROUTING_RULES } from '../mocks/admin'

const PRIORITY_LABELS = {
  low: 'Scăzută',
  medium: 'Medie',
  high: 'Ridicată',
  critical: 'Critică',
}

export default function AdminRoutingRules() {
  const [rules, setRules] = useState(MOCK_ROUTING_RULES)
  const [editingRule, setEditingRule] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState(null)

  const sortedRules = useMemo(() => [...rules].sort((a, b) => a.sort_order - b.sort_order), [rules])
  const activeRulesCount = useMemo(() => rules.filter((rule) => rule.is_active).length, [rules])

  const handleOpenCreate = () => {
    setEditingRule(null)
    const nextOrder = sortedRules.length ? Math.max(...sortedRules.map((rule) => rule.sort_order)) + 1 : 1
    setEditingRule({ sort_order: nextOrder })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (rule) => {
    setEditingRule(rule)
    setIsModalOpen(true)
  }

  const handleSave = (payload) => {
    if (editingRule?.id) {
      setRules((prev) => prev.map((rule) => (rule.id === editingRule.id ? { ...rule, ...payload } : rule)))
      setIsModalOpen(false)
      return
    }

    setRules((prev) => [
      ...prev,
      {
        id: `r${Date.now()}`,
        ...payload,
      },
    ])
    setIsModalOpen(false)
  }

  const handleDelete = (rule) => {
    if (!window.confirm(`Sigur dorești să ștergi regula „${rule.name}”?`)) return
    setRules((prev) => prev.filter((item) => item.id !== rule.id))
    setIsModalOpen(false)
  }

  const moveRule = (ruleId, direction) => {
    setRules((prev) => {
      const sorted = [...prev].sort((a, b) => a.sort_order - b.sort_order)
      const idx = sorted.findIndex((rule) => rule.id === ruleId)

      if (direction === 'up' && idx > 0) {
        const temp = sorted[idx].sort_order
        sorted[idx].sort_order = sorted[idx - 1].sort_order
        sorted[idx - 1].sort_order = temp
      } else if (direction === 'down' && idx < sorted.length - 1) {
        const temp = sorted[idx].sort_order
        sorted[idx].sort_order = sorted[idx + 1].sort_order
        sorted[idx + 1].sort_order = temp
      }

      return sorted
    })
  }

  const handleTest = () => {
    if (!testText.trim()) return

    const lower = testText.toLowerCase()
    const activeRules = [...rules]
      .filter((rule) => rule.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)

    for (const rule of activeRules) {
      for (const keyword of rule.keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          setTestResult({
            matched: true,
            rule,
            keyword,
          })
          return
        }
      }
    }

    setTestResult({ matched: false })
  }

  return (
    <section className="w-full">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Reguli de rutare</h1>
          <p className="text-sm text-slate-500">
            {activeRulesCount} reguli active · Prioritate: mai mic = verificat primul
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-blue-600 px-4 text-sm font-medium text-white transition-all active:scale-[0.97] active:bg-blue-700"
        >
          <Plus size={16} />
          Adaugă
        </button>
      </header>

      <section className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <FlaskConical size={18} className="text-blue-600" />
          <p className="text-sm font-semibold text-blue-900">Testează rutarea</p>
        </div>

        <input
          type="text"
          value={testText}
          onChange={(event) => setTestText(event.target.value)}
          placeholder="Scrie textul unui tichet de test..."
          className="mt-2 w-full min-h-[48px] rounded-xl border border-blue-200 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          type="button"
          onClick={handleTest}
          className="mt-2 w-full min-h-[44px] rounded-xl bg-blue-600 text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-blue-700"
        >
          Testează
        </button>

        {testResult && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-white p-3">
            {testResult.matched ? (
              <>
                <p className="text-sm font-medium text-green-700">✅ Regulă potrivită: «{testResult.rule.name}»</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Departament:</span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: testResult.rule.target_department.color }}
                  >
                    {testResult.rule.target_department.name}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Keyword potrivit: «{testResult.keyword}»</p>
                {testResult.rule.priority_override && (
                  <p className="mt-1 text-xs text-orange-600">
                    Prioritate suprascrisă: {PRIORITY_LABELS[testResult.rule.priority_override]}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-amber-700">⚠️ Nicio regulă potrivită. Tichetul ar fi clasificat de AI.</p>
            )}
          </div>
        )}
      </section>

      <div className="mt-4 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {sortedRules.map((rule, index) => {
          const isFirst = index === 0
          const isLast = index === sortedRules.length - 1

          return (
            <article
              key={rule.id}
              className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${rule.is_active ? '' : 'opacity-50'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-400">#{rule.sort_order}</span>
                  <h2 className="ml-2 text-sm font-semibold">{rule.name}</h2>
                </div>
                <ToggleSwitch
                  enabled={rule.is_active}
                  onChange={(nextValue) =>
                    setRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, is_active: nextValue } : item)))
                  }
                  label={`Stare regulă ${rule.name}`}
                />
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <ArrowRight size={14} className="text-slate-400" />
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: rule.target_department.color }}
                >
                  {rule.target_department.name}
                </span>
                {rule.priority_override && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                    Prioritate {PRIORITY_LABELS[rule.priority_override]}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {rule.keywords.map((keyword) => (
                  <span key={`${rule.id}-${keyword}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {keyword}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => moveRule(rule.id, 'up')}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 transition-colors active:bg-slate-200 ${
                    isFirst ? 'opacity-30' : ''
                  }`}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={isLast}
                  onClick={() => moveRule(rule.id, 'down')}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 transition-colors active:bg-slate-200 ${
                    isLast ? 'opacity-30' : ''
                  }`}
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(rule)}
                  className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 transition-colors active:bg-slate-200"
                >
                  <Pencil size={14} />
                  Editează
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <RoutingRuleModal
        isOpen={isModalOpen}
        rule={editingRule?.id ? editingRule : null}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </section>
  )
}
