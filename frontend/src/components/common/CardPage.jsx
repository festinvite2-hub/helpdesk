import { Link } from 'react-router-dom'
import TouchableCard from './TouchableCard'

export default function CardPage({ title, description, actions = [] }) {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-slate-600">{description}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <TouchableCard key={item} className="h-full">
            <h2 className="font-semibold">Cardul {item}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Aici apar informații sumare, optimizate pentru mobil.
            </p>
            <button className="mt-4 min-h-[44px] rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-transform active:scale-[0.97]">
              Vezi detalii
            </button>
          </TouchableCard>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-transform active:scale-[0.97]"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
