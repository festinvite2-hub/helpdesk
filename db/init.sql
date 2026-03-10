-- Initializare schema productie pentru Helpdesk Intern v2.1
-- Baza de date: PostgreSQL 16 + extensia pgvector

-- 1) Extensii necesare
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) Departamentele organizationale care primesc tichete
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID,
    email_notify VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Utilizatorii platformei (elevi/profesori/personal/admini)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'dept_manager', 'admin')),
    primary_department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legatura managerului de departament se adauga dupa crearea tabelului users
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id)
    REFERENCES users(id);

-- 4) Membrii departamentelor si drepturile lor operationale
CREATE TABLE department_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role_in_dept VARCHAR(30) DEFAULT 'member' CHECK (role_in_dept IN ('manager', 'member')),
    can_be_assigned BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (department_id, user_id)
);

-- 5) Categorii functionale pentru clasificarea solicitarilor
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    default_department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true
);

-- 6) Reguli de rutare automata (cuvinte cheie, categorie sau fallback AI)
CREATE TABLE routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('keyword', 'category', 'ai_fallback')),
    keywords TEXT[],
    category_id UUID REFERENCES categories(id),
    target_department_id UUID NOT NULL REFERENCES departments(id),
    priority_override VARCHAR(20) CHECK (priority_override IN ('low', 'medium', 'high', 'critical') OR priority_override IS NULL),
    auto_assign_to UUID REFERENCES users(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7) Tichetele de suport si starea lor operationala
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number SERIAL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'escalated', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category_id UUID REFERENCES categories(id),
    department_id UUID REFERENCES departments(id),
    routed_by VARCHAR(20) CHECK (routed_by IN ('keyword', 'category', 'ai', 'manual')),
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    ai_confidence FLOAT,
    ai_auto_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 8) Mesaje asociate tichetelor (publice/interne, inclusiv raspunsuri AI)
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'dept_manager', 'ai')),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    sources JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9) Istoricul schimbarilor de status pentru audit si trasabilitate
CREATE TABLE ticket_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10) Documente de cunostinte incarcate in baza de date vectoriala
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size INTEGER,
    department_id UUID REFERENCES departments(id),
    chunk_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'indexed', 'error')),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11) Fragmente text indexate semantic pentru cautare cu embeddings
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexuri pentru performanta in interogari operationale
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_dept ON tickets(department_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_dept_members ON department_members(department_id);
CREATE INDEX idx_routing_rules_sort ON routing_rules(sort_order);
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_status_history_ticket ON ticket_status_history(ticket_id);
CREATE INDEX idx_chunks_doc ON document_chunks(document_id);
CREATE INDEX idx_kb_docs_dept ON knowledge_documents(department_id);
CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Date initiale: cont administrator
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@helpdesk.local',
    crypt('admin123', gen_salt('bf')),
    'Administrator Sistem',
    'admin'
);

-- Date initiale: departamente (UUID-uri fixe)
INSERT INTO departments (id, name, description, color)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'IT', 'Retele, calculatoare, software', '#3B82F6'),
    ('d0000000-0000-0000-0000-000000000002', 'Administrativ', 'Cladire, mobilier, curatenie', '#F59E0B'),
    ('d0000000-0000-0000-0000-000000000003', 'Secretariat', 'Acte, documente, cataloage', '#8B5CF6'),
    ('d0000000-0000-0000-0000-000000000004', 'Consiliere', 'Consiliere scolara, mediere', '#10B981'),
    ('d0000000-0000-0000-0000-000000000005', 'Conducere', 'Directiune, decizii', '#EF4444');

-- Date initiale: categorii si departamentul implicit pentru rutare
INSERT INTO categories (name, description, default_department_id)
VALUES
    ('Retea/WiFi', 'Probleme legate de conectivitate la retea si WiFi.', 'd0000000-0000-0000-0000-000000000001'),
    ('Software', 'Instalari, erori si configurari de aplicatii.', 'd0000000-0000-0000-0000-000000000001'),
    ('Hardware', 'Defectiuni echipamente si periferice.', 'd0000000-0000-0000-0000-000000000001'),
    ('Cont/Parola', 'Acces in conturi, resetari de parola si blocari.', 'd0000000-0000-0000-0000-000000000001'),
    ('Infrastructura', 'Probleme de cladire, utilitati si dotari.', 'd0000000-0000-0000-0000-000000000002'),
    ('Acte/Documente', 'Solicitari pentru adeverinte si documente scolare.', 'd0000000-0000-0000-0000-000000000003'),
    ('Consiliere', 'Situatii de consiliere scolara si mediere.', 'd0000000-0000-0000-0000-000000000004'),
    ('Altele', 'Solicitari care nu se incadreaza in categoriile standard.', NULL);

-- Date initiale: reguli de rutare dupa cuvinte cheie
INSERT INTO routing_rules (name, rule_type, keywords, target_department_id, sort_order)
VALUES
    ('WiFi si retea', 'keyword', ARRAY['wifi', 'retea', 'internet', 'router', 'conectare'], 'd0000000-0000-0000-0000-000000000001', 1),
    ('Calculatoare', 'keyword', ARRAY['calculator', 'laptop', 'mouse', 'tastatura', 'monitor'], 'd0000000-0000-0000-0000-000000000001', 2),
    ('Imprimante', 'keyword', ARRAY['imprimanta', 'toner', 'scaner', 'copiator'], 'd0000000-0000-0000-0000-000000000001', 3),
    ('Proiectoare', 'keyword', ARRAY['proiector', 'videoproiector', 'hdmi', 'ecran proiectie'], 'd0000000-0000-0000-0000-000000000001', 4),
    ('Conturi si parole', 'keyword', ARRAY['parola', 'cont', 'email', 'acces', 'blocat'], 'd0000000-0000-0000-0000-000000000001', 5),
    ('Usi si ferestre', 'keyword', ARRAY['usa', 'fereastra', 'geam', 'incuietoare', 'cheie', 'broasca'], 'd0000000-0000-0000-0000-000000000002', 10),
    ('Incalzire', 'keyword', ARRAY['calorifer', 'incalzire', 'centrala', 'apa calda', 'frig'], 'd0000000-0000-0000-0000-000000000002', 11),
    ('Curatenie', 'keyword', ARRAY['curatenie', 'mizerie', 'gunoi', 'toaleta', 'sapun'], 'd0000000-0000-0000-0000-000000000002', 12),
    ('Mobilier', 'keyword', ARRAY['mobilier', 'banca', 'scaun', 'tabla', 'dulap', 'masa'], 'd0000000-0000-0000-0000-000000000002', 13),
    ('Acte oficiale', 'keyword', ARRAY['adeverinta', 'diploma', 'certificat', 'foaie matricola'], 'd0000000-0000-0000-0000-000000000003', 20),
    ('Cataloage', 'keyword', ARRAY['catalog', 'note', 'absente', 'situatie scolara'], 'd0000000-0000-0000-0000-000000000003', 21),
    ('Comportament', 'keyword', ARRAY['comportament', 'bullying', 'conflict', 'hartuire', 'violenta'], 'd0000000-0000-0000-0000-000000000004', 30);
