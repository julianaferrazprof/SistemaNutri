import { neon } from '@neondatabase/serverless';

export interface Nutricionista {
  id: string;
  nome: string;
  email: string;
  created_at?: string;
}

// Obter URL do banco configurada em variáveis de ambiente se disponível
const databaseUrl = import.meta.env.VITE_NEON_DATABASE_URL || '';

// Inicialização segura do cliente Neon se houver URL informada
const sql = databaseUrl ? neon(databaseUrl) : null;

const LOCAL_STORAGE_USERS_KEY = 'nutrismart_nutricionistas';
const LOCAL_STORAGE_SESSION_KEY = 'nutrismart_current_session';

/**
 * Cria a tabela de nutricionistas no Neon caso não exista
 */
export async function initNeonDatabase() {
  if (sql) {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS nutricionistas (
          id TEXT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
    } catch (err) {
      console.warn('Neon connection / table init notice:', err);
    }
  }
}

/**
 * Obtém usuários locais persistidos (fallback ou cache)
 */
function getLocalUsers(): Array<Nutricionista & { password_hash: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: Array<Nutricionista & { password_hash: string }>) {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
}

/**
 * Cadastro de nutricionista
 */
export async function registerNutricionista(nome: string, email: string, password: string): Promise<Nutricionista> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedNome = nome.trim();
  const createdAt = new Date().toISOString();

  let id: string = '';

  // 1. Persiste no Neon se houver conexão ativa
  if (sql) {
    try {
      const existing = await sql`SELECT id FROM nutricionistas WHERE email = ${normalizedEmail} LIMIT 1`;
      if (existing && existing.length > 0) {
        throw new Error('Já existe uma conta cadastrada com este email.');
      }

      const rows = await sql`
        INSERT INTO nutricionistas (nome, email, password_hash, created_at)
        VALUES (${trimmedNome}, ${normalizedEmail}, ${password}, ${createdAt})
        RETURNING id, nome, email, created_at
      `;

      if (rows && rows.length > 0) {
        id = rows[0].id;
      }
    } catch (err: any) {
      console.error('Erro ao salvar no Neon:', err);
      // Se for duplicidade ou outro erro de validação/banco, lança para o formulário
      throw new Error(err.message || 'Erro ao conectar ou gravar no banco de dados Neon.');
    }
  }

  if (!id) {
    id = 'nutri_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  // 2. Persiste localmente para manter a consistência e permitir login instantâneo
  const localUsers = getLocalUsers();
  const userIndex = localUsers.findIndex(u => u.email.toLowerCase() === normalizedEmail);
  const userObj = {
    id,
    nome: trimmedNome,
    email: normalizedEmail,
    password_hash: password,
    created_at: createdAt
  };

  if (userIndex >= 0) {
    localUsers[userIndex] = userObj;
  } else {
    localUsers.push(userObj);
  }
  saveLocalUsers(localUsers);

  // Retorna dados do nutricionista sem o hash de senha
  const nutri: Nutricionista = {
    id,
    nome: trimmedNome,
    email: normalizedEmail,
    created_at: createdAt
  };

  // Salva a sessão ativa automaticamente
  setSession(nutri);
  return nutri;
}

/**
 * Login de nutricionista
 */
export async function loginNutricionista(email: string, password: string): Promise<Nutricionista> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Tentar autenticação no Neon se configurado
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, nome, email, password_hash, created_at 
        FROM nutricionistas 
        WHERE email = ${normalizedEmail} 
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        const user = rows[0];
        if (user.password_hash === password) {
          const nutri: Nutricionista = {
            id: user.id,
            nome: user.nome,
            email: user.email,
            created_at: user.created_at
          };
          setSession(nutri);
          return nutri;
        } else {
          throw new Error('Email ou senha incorretos. Por favor, tente novamente.');
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('incorretos')) {
        throw err;
      }
      console.warn('Erro consultando Neon remoto, verificando autenticação local:', err);
    }
  }

  // 2. Verificação local
  const localUsers = getLocalUsers();
  const user = localUsers.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.password_hash !== password) {
    throw new Error('Email ou senha incorretos. Por favor, tente novamente.');
  }

  const nutri: Nutricionista = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    created_at: user.created_at
  };

  setSession(nutri);
  return nutri;
}

/**
 * Gerenciamento de Sessão Ativa
 */
export function getSession(): Nutricionista | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(nutri: Nutricionista): void {
  localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(nutri));
}

export function clearSession(): void {
  localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
}
