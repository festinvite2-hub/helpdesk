export const MOCK_TICKET_DETAIL = {
  id: '10',
  ticket_number: 'TK-0010',
  title: 'Nu merge imprimanta din secretariat',
  description:
    'Imprimanta HP din secretariat nu mai printează, afișează eroare paper jam dar nu e hârtie blocată. Am încercat să o opresc și pornesc dar nu a funcționat.',
  status: 'in_progress',
  priority: 'high',
  category: 'Hardware',
  department: 'IT',
  department_color: '#3B82F6',
  routed_by: 'keyword',
  created_by: { name: 'Maria Popescu', role: 'user' },
  assigned_to: { name: 'Andrei Tecuci', role: 'responsible' },
  created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
}

export const MOCK_MESSAGES = [
  {
    id: 'm1',
    sender_type: 'user',
    sender_name: 'Maria Popescu',
    content:
      'Imprimanta HP din secretariat nu mai printează, afișează eroare paper jam dar nu e hârtie blocată. Am încercat să o opresc și pornesc dar nu a funcționat.',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'm2',
    sender_type: 'ai',
    sender_name: 'Asistent AI',
    content:
      'Am analizat problema ta. Pe baza documentației interne, eroarea "paper jam" pe imprimantele HP poate fi cauzată de:\n\n1. Senzorul de hârtie murdar — curăță cu aer comprimat\n2. Role de alimentare uzate\n3. Hârtie reziduală în interiorul imprimantei\n\nÎncearcă să deschizi capacul frontal și să verifici dacă există bucăți mici de hârtie. Dacă problema persistă, un tehnician va fi notificat.',
    sources: ['Manual HP LaserJet Pro - Troubleshooting', 'Procedura internă imprimante'],
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000 + 30000).toISOString(),
  },
  {
    id: 'm3',
    sender_type: 'user',
    sender_name: 'Maria Popescu',
    content: 'Am verificat și nu e hârtie blocată. Am curățat și senzorul dar tot nu merge. Cred că trebuie să vină cineva.',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'm4',
    sender_type: 'responsible',
    sender_name: 'Andrei Tecuci',
    content:
      'Bună Maria, am văzut tichetul. Voi trece pe la secretariat azi după ora 14:00 să verific imprimanta. Probabil trebuie înlocuite rolele de alimentare.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'm5',
    sender_type: 'user',
    sender_name: 'Maria Popescu',
    content: 'Mulțumesc! Vă aștept.',
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
]

export const MOCK_STATUS_HISTORY = [
  {
    status: 'open',
    changed_by: 'Sistem',
    note: 'Tichet creat. Rutat automat către IT (keyword: imprimantă).',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    status: 'waiting',
    changed_by: 'Asistent AI',
    note: 'Răspuns automat trimis. Scor confidență: 0.82',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000 + 30000).toISOString(),
  },
  {
    status: 'in_progress',
    changed_by: 'Andrei Tecuci',
    note: 'Preluat de responsabil.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]
