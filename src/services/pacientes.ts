import { neon } from '@neondatabase/serverless';

const databaseUrl = import.meta.env.VITE_NEON_DATABASE_URL || '';
export const sql = databaseUrl ? neon(databaseUrl) : null;

export interface Paciente {
  id: string;
  nutricionista_id: string;
  // Aba 1 - Pessoal
  nome: string;
  data_nascimento?: string;
  sexo?: 'Feminino' | 'Masculino' | 'Outro' | string;
  whatsapp?: string;
  email?: string;
  // Aba 2 - Clínico
  peso_inicial?: number;
  altura?: number;
  imc?: number;
  objetivos?: string[];
  objetivo_texto?: string;
  nivel_atividade?: string;
  patologias?: string[];
  patologias_outras?: string;
  restricoes?: string[];
  restricoes_outras?: string;
  alergias?: string[];
  alergias_outras?: string;
  medicamentos?: string;
  suplementos?: string;
  // Aba 3 - Hábitos
  refeicoes_dia?: number;
  horario_acorda?: string;
  horario_dorme?: string;
  agua_litros?: number;
  pratica_atividade?: boolean;
  atividade_detalhes?: string;
  observacoes?: string;
  created_at?: string;
}

export interface PacienteListItem {
  id: string;
  nome: string;
  objetivo_principal?: string;
  ultima_consulta?: string;
  email?: string;
  whatsapp?: string;
  created_at: string;
}

export interface ConsultaItem {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso?: number;
  cintura?: number;
  quadril?: number;
  percentual_gordura?: number;
  observacoes?: string;
  proximo_retorno?: string;
}

export interface PlanoAlimentarItem {
  id: string;
  paciente_id: string;
  titulo?: string;
  conteudo: string;
  created_at: string;
}

const LOCAL_STORAGE_PACIENTES_KEY = 'nutrismart_pacientes';
const LOCAL_STORAGE_CONSULTAS_KEY = 'nutrismart_consultas';
const LOCAL_STORAGE_PLANOS_KEY = 'nutrismart_planos';

/**
 * Garante que as tabelas de pacientes, consultas e planos existam no Neon
 */
export async function initPacientesDatabase() {
  if (sql) {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS pacientes (
          id TEXT PRIMARY KEY,
          nutricionista_id TEXT NOT NULL,
          nome VARCHAR(255) NOT NULL,
          data_nascimento DATE,
          sexo VARCHAR(50),
          whatsapp VARCHAR(50),
          email VARCHAR(255),
          peso_inicial NUMERIC(5,2),
          altura NUMERIC(5,2),
          imc NUMERIC(5,2),
          objetivos TEXT[],
          objetivo_texto TEXT,
          nivel_atividade VARCHAR(100),
          patologias TEXT[],
          patologias_outras TEXT,
          restricoes TEXT[],
          restricoes_outras TEXT,
          alergias TEXT[],
          alergias_outras TEXT,
          medicamentos TEXT,
          suplementos TEXT,
          refeicoes_dia INT,
          horario_acorda VARCHAR(20),
          horario_dorme VARCHAR(20),
          agua_litros NUMERIC(4,2),
          pratica_atividade BOOLEAN DEFAULT FALSE,
          atividade_detalhes TEXT,
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS consultas (
          id TEXT PRIMARY KEY,
          paciente_id TEXT NOT NULL,
          data_consulta DATE NOT NULL,
          peso NUMERIC(5,2),
          cintura NUMERIC(5,2),
          quadril NUMERIC(5,2),
          percentual_gordura NUMERIC(4,2),
          observacoes TEXT,
          proximo_retorno DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS planos_alimentares (
          id TEXT PRIMARY KEY,
          paciente_id TEXT NOT NULL,
          titulo VARCHAR(255),
          conteudo TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Atualiza schema se colunas novas não existirem
      await sql`
        DO $$
        BEGIN
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS imc NUMERIC(5,2); EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS objetivos TEXT[]; EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS patologias TEXT[]; EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS patologias_outras TEXT; EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS restricoes TEXT[]; EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS restricoes_outras TEXT; EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS alergias TEXT[]; EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS alergias_outras TEXT; EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS refeicoes_dia INT; EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS horario_acorda VARCHAR(20); EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS horario_dorme VARCHAR(20); EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS agua_litros NUMERIC(4,2); EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS pratica_atividade BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN END;
          BEGIN ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS atividade_detalhes TEXT; EXCEPTION WHEN OTHERS THEN END;
        END $$;
      `;
    } catch (err) {
      console.warn('Init pacientes DB notice:', err);
    }
  }
}

/**
 * Persistência local para fallback offline
 */
function getLocalPacientes(): Paciente[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PACIENTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPacientes(pacientes: Paciente[]) {
  localStorage.setItem(LOCAL_STORAGE_PACIENTES_KEY, JSON.stringify(pacientes));
}

function getLocalConsultas(): ConsultaItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONSULTAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalConsultas(consultas: ConsultaItem[]) {
  localStorage.setItem(LOCAL_STORAGE_CONSULTAS_KEY, JSON.stringify(consultas));
}

function getLocalPlanos(): PlanoAlimentarItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLANOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Criação de novo paciente
 */
export async function createPaciente(pacienteData: Omit<Paciente, 'id' | 'created_at'>): Promise<Paciente> {
  const createdAt = new Date().toISOString();
  let generatedId = '';

  if (sql) {
    try {
      await initPacientesDatabase();
      const rows = await sql`
        INSERT INTO pacientes (
          nutricionista_id,
          nome,
          data_nascimento,
          sexo,
          whatsapp,
          email,
          peso_inicial,
          altura,
          imc,
          objetivos,
          objetivo_texto,
          nivel_atividade,
          patologias,
          patologias_outras,
          restricoes,
          restricoes_outras,
          alergias,
          alergias_outras,
          medicamentos,
          suplementos,
          refeicoes_dia,
          horario_acorda,
          horario_dorme,
          agua_litros,
          pratica_atividade,
          atividade_detalhes,
          observacoes,
          created_at
        ) VALUES (
          ${pacienteData.nutricionista_id},
          ${pacienteData.nome},
          ${pacienteData.data_nascimento || null},
          ${pacienteData.sexo || null},
          ${pacienteData.whatsapp || null},
          ${pacienteData.email || null},
          ${pacienteData.peso_inicial || null},
          ${pacienteData.altura || null},
          ${pacienteData.imc || null},
          ${pacienteData.objetivos || []},
          ${pacienteData.objetivo_texto || null},
          ${pacienteData.nivel_atividade || null},
          ${pacienteData.patologias || []},
          ${pacienteData.patologias_outras || null},
          ${pacienteData.restricoes || []},
          ${pacienteData.restricoes_outras || null},
          ${pacienteData.alergias || []},
          ${pacienteData.alergias_outras || null},
          ${pacienteData.medicamentos || null},
          ${pacienteData.suplementos || null},
          ${pacienteData.refeicoes_dia || null},
          ${pacienteData.horario_acorda || null},
          ${pacienteData.horario_dorme || null},
          ${pacienteData.agua_litros || null},
          ${pacienteData.pratica_atividade || false},
          ${pacienteData.atividade_detalhes || null},
          ${pacienteData.observacoes || null},
          ${createdAt}
        )
        RETURNING *
      `;

      if (rows && rows.length > 0) {
        generatedId = rows[0].id;
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente no Neon:', err);
    }
  }

  if (!generatedId) {
    generatedId = 'pac_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  const newPaciente: Paciente = {
    ...pacienteData,
    id: generatedId,
    created_at: createdAt
  };

  const localList = getLocalPacientes();
  localList.unshift(newPaciente);
  saveLocalPacientes(localList);

  return newPaciente;
}

/**
 * Atualização dos dados do paciente no Neon e localmente
 */
export async function updatePaciente(id: string, updates: Partial<Paciente>): Promise<Paciente> {
  if (sql) {
    try {
      await initPacientesDatabase();
      await sql`
        UPDATE pacientes
        SET
          nome = COALESCE(${updates.nome || null}, nome),
          data_nascimento = ${updates.data_nascimento || null},
          sexo = ${updates.sexo || null},
          whatsapp = ${updates.whatsapp || null},
          email = ${updates.email || null},
          peso_inicial = ${updates.peso_inicial || null},
          altura = ${updates.altura || null},
          imc = ${updates.imc || null},
          objetivos = ${updates.objetivos || []},
          objetivo_texto = ${updates.objetivo_texto || null},
          nivel_atividade = ${updates.nivel_atividade || null},
          patologias = ${updates.patologias || []},
          patologias_outras = ${updates.patologias_outras || null},
          restricoes = ${updates.restricoes || []},
          restricoes_outras = ${updates.restricoes_outras || null},
          alergias = ${updates.alergias || []},
          alergias_outras = ${updates.alergias_outras || null},
          medicamentos = ${updates.medicamentos || null},
          suplementos = ${updates.suplementos || null},
          refeicoes_dia = ${updates.refeicoes_dia || null},
          horario_acorda = ${updates.horario_acorda || null},
          horario_dorme = ${updates.horario_dorme || null},
          agua_litros = ${updates.agua_litros || null},
          pratica_atividade = ${updates.pratica_atividade || false},
          atividade_detalhes = ${updates.atividade_detalhes || null},
          observacoes = ${updates.observacoes || null}
        WHERE id = ${id}
      `;
    } catch (err) {
      console.error('Erro ao atualizar paciente no Neon:', err);
    }
  }

  const localList = getLocalPacientes();
  const index = localList.findIndex(p => p.id === id);
  let updatedPaciente: Paciente;

  if (index >= 0) {
    updatedPaciente = { ...localList[index], ...updates };
    localList[index] = updatedPaciente;
    saveLocalPacientes(localList);
  } else {
    updatedPaciente = { id, nutricionista_id: '', nome: '', ...updates } as Paciente;
  }

  return updatedPaciente;
}

/**
 * Busca lista de pacientes cadastrados pela nutricionista
 */
export async function getPacientesList(nutricionistaId: string): Promise<PacienteListItem[]> {
  if (sql) {
    try {
      await initPacientesDatabase();
      const rows = await sql`
        SELECT 
          p.id,
          p.nome,
          p.email,
          p.whatsapp,
          p.objetivos,
          p.objetivo_texto,
          p.created_at,
          (
            SELECT MAX(c.data_consulta)
            FROM consultas c
            WHERE c.paciente_id = p.id
          ) as ultima_consulta_raw
        FROM pacientes p
        WHERE p.nutricionista_id = ${nutricionistaId}
        ORDER BY p.nome ASC
      `;

      return rows.map((r: any) => {
        let objetivoPrincipal = '';
        if (r.objetivos && Array.isArray(r.objetivos) && r.objetivos.length > 0) {
          objetivoPrincipal = r.objetivos.join(', ');
        } else if (r.objetivo_texto) {
          objetivoPrincipal = r.objetivo_texto;
        }

        return {
          id: r.id,
          nome: r.nome,
          email: r.email,
          whatsapp: r.whatsapp,
          objetivo_principal: objetivoPrincipal || 'Não informado',
          ultima_consulta: r.ultima_consulta_raw 
            ? new Date(r.ultima_consulta_raw).toLocaleDateString('pt-BR') 
            : undefined,
          created_at: r.created_at
        };
      });
    } catch (err) {
      console.error('Erro ao buscar pacientes no Neon:', err);
    }
  }

  // Fallback local
  const localList = getLocalPacientes().filter(p => p.nutricionista_id === nutricionistaId);
  const localConsultas = getLocalConsultas();

  return localList.map(p => {
    let objetivoPrincipal = '';
    if (p.objetivos && p.objetivos.length > 0) {
      objetivoPrincipal = p.objetivos.join(', ');
    } else if (p.objetivo_texto) {
      objetivoPrincipal = p.objetivo_texto;
    }

    const pConsultas = localConsultas.filter(c => c.paciente_id === p.id);
    let ultimaConsulta: string | undefined = undefined;
    if (pConsultas.length > 0) {
      const sorted = pConsultas.sort((a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime());
      ultimaConsulta = new Date(sorted[0].data_consulta).toLocaleDateString('pt-BR');
    }

    return {
      id: p.id,
      nome: p.nome,
      email: p.email,
      whatsapp: p.whatsapp,
      objetivo_principal: objetivoPrincipal || 'Não informado',
      ultima_consulta: ultimaConsulta,
      created_at: p.created_at || new Date().toISOString()
    };
  });
}

/**
 * Busca detalhes completos de um paciente por ID em tempo real
 */
export async function getPacienteById(id: string): Promise<Paciente | null> {
  if (sql) {
    try {
      const rows = await sql`
        SELECT *
        FROM pacientes
        WHERE id = ${id}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          nutricionista_id: r.nutricionista_id,
          nome: r.nome,
          data_nascimento: r.data_nascimento ? String(r.data_nascimento).split('T')[0] : undefined,
          sexo: r.sexo,
          whatsapp: r.whatsapp,
          email: r.email,
          peso_inicial: r.peso_inicial ? Number(r.peso_inicial) : undefined,
          altura: r.altura ? Number(r.altura) : undefined,
          imc: r.imc ? Number(r.imc) : undefined,
          objetivos: Array.isArray(r.objetivos) ? r.objetivos : [],
          objetivo_texto: r.objetivo_texto,
          nivel_atividade: r.nivel_atividade,
          patologias: Array.isArray(r.patologias) ? r.patologias : [],
          patologias_outras: r.patologias_outras,
          restricoes: Array.isArray(r.restricoes) ? r.restricoes : [],
          restricoes_outras: r.restricoes_outras,
          alergias: Array.isArray(r.alergias) ? r.alergias : [],
          alergias_outras: r.alergias_outras,
          medicamentos: r.medicamentos,
          suplementos: r.suplementos,
          refeicoes_dia: r.refeicoes_dia ? Number(r.refeicoes_dia) : undefined,
          horario_acorda: r.horario_acorda,
          horario_dorme: r.horario_dorme,
          agua_litros: r.agua_litros ? Number(r.agua_litros) : undefined,
          pratica_atividade: Boolean(r.pratica_atividade),
          atividade_detalhes: r.atividade_detalhes,
          observacoes: r.observacoes,
          created_at: r.created_at
        };
      }
    } catch (err) {
      console.error('Erro ao buscar paciente por ID:', err);
    }
  }

  const localList = getLocalPacientes();
  return localList.find(p => p.id === id) || null;
}

/**
 * Criação de nova consulta no Neon e localmente
 */
export async function createConsulta(consulta: Omit<ConsultaItem, 'id'>): Promise<ConsultaItem> {
  let generatedId = '';

  if (sql) {
    try {
      await initPacientesDatabase();
      const rows = await sql`
        INSERT INTO consultas (
          paciente_id,
          data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          proximo_retorno
        ) VALUES (
          ${consulta.paciente_id},
          ${consulta.data_consulta},
          ${consulta.peso || null},
          ${consulta.cintura || null},
          ${consulta.quadril || null},
          ${consulta.percentual_gordura || null},
          ${consulta.observacoes || null},
          ${consulta.proximo_retorno || null}
        )
        RETURNING *
      `;
      if (rows && rows.length > 0) {
        generatedId = rows[0].id;
      }
    } catch (err) {
      console.error('Erro ao salvar consulta no Neon:', err);
    }
  }

  if (!generatedId) {
    generatedId = 'cons_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  const newConsulta: ConsultaItem = {
    ...consulta,
    id: generatedId
  };

  const localList = getLocalConsultas();
  localList.unshift(newConsulta);
  saveLocalConsultas(localList);

  return newConsulta;
}

/**
 * Busca consultas de um paciente
 */
export async function getConsultasByPacienteId(pacienteId: string): Promise<ConsultaItem[]> {
  if (sql) {
    try {
      await initPacientesDatabase();
      const rows = await sql`
        SELECT *
        FROM consultas
        WHERE paciente_id = ${pacienteId}
        ORDER BY data_consulta DESC
      `;
      return rows.map((r: any) => ({
        id: r.id,
        paciente_id: r.paciente_id,
        data_consulta: String(r.data_consulta).split('T')[0],
        peso: r.peso ? Number(r.peso) : undefined,
        cintura: r.cintura ? Number(r.cintura) : undefined,
        quadril: r.quadril ? Number(r.quadril) : undefined,
        percentual_gordura: r.percentual_gordura ? Number(r.percentual_gordura) : undefined,
        observacoes: r.observacoes,
        proximo_retorno: r.proximo_retorno ? String(r.proximo_retorno).split('T')[0] : undefined
      }));
    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
    }
  }

  const localList = getLocalConsultas().filter(c => c.paciente_id === pacienteId);
  return localList.sort((a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime());
}

/**
 * Atualiza uma consulta existente no Neon e localmente
 */
export async function updateConsulta(id: string, updates: Partial<Omit<ConsultaItem, 'id' | 'paciente_id'>>): Promise<ConsultaItem> {
  if (sql) {
    try {
      await initPacientesDatabase();
      await sql`
        UPDATE consultas
        SET
          data_consulta = COALESCE(${updates.data_consulta || null}, data_consulta),
          peso = ${updates.peso ?? null},
          cintura = ${updates.cintura ?? null},
          quadril = ${updates.quadril ?? null},
          percentual_gordura = ${updates.percentual_gordura ?? null},
          observacoes = ${updates.observacoes || null},
          proximo_retorno = ${updates.proximo_retorno || null}
        WHERE id = ${id}
      `;
    } catch (err) {
      console.error('Erro ao atualizar consulta no Neon:', err);
    }
  }

  const localList = getLocalConsultas();
  const index = localList.findIndex(c => c.id === id);
  let updated: ConsultaItem;
  if (index >= 0) {
    updated = { ...localList[index], ...updates };
    localList[index] = updated;
    saveLocalConsultas(localList);
  } else {
    updated = { id, paciente_id: '', data_consulta: '', ...updates } as ConsultaItem;
  }
  return updated;
}

/**
 * Exclui uma consulta pelo ID no Neon e localmente
 */
export async function deleteConsulta(id: string): Promise<void> {
  if (sql) {
    try {
      await initPacientesDatabase();
      await sql`DELETE FROM consultas WHERE id = ${id}`;
    } catch (err) {
      console.error('Erro ao excluir consulta no Neon:', err);
    }
  }

  const localList = getLocalConsultas().filter(c => c.id !== id);
  saveLocalConsultas(localList);
}

function saveLocalPlanos(planos: PlanoAlimentarItem[]) {
  localStorage.setItem(LOCAL_STORAGE_PLANOS_KEY, JSON.stringify(planos));
}

/**
 * Criação e persistência de um novo plano alimentar
 */
export async function createPlanoAlimentar(
  pacienteId: string,
  conteudo: string,
  titulo?: string
): Promise<PlanoAlimentarItem> {
  const createdAt = new Date().toISOString();
  let generatedId = '';

  if (sql) {
    try {
      await initPacientesDatabase();
      const rows = await sql`
        INSERT INTO planos_alimentares (
          id,
          paciente_id,
          titulo,
          conteudo,
          created_at
        ) VALUES (
          ${'pln_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)},
          ${pacienteId},
          ${titulo || 'Plano Alimentar IA'},
          ${conteudo},
          ${createdAt}
        )
        RETURNING *
      `;
      if (rows && rows.length > 0) {
        generatedId = rows[0].id;
      }
    } catch (err) {
      console.error('Erro ao salvar plano alimentar no Neon:', err);
    }
  }

  if (!generatedId) {
    generatedId = 'pln_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  const newPlano: PlanoAlimentarItem = {
    id: generatedId,
    paciente_id: pacienteId,
    titulo: titulo || 'Plano Alimentar IA',
    conteudo,
    created_at: createdAt
  };

  const localList = getLocalPlanos();
  localList.unshift(newPlano);
  saveLocalPlanos(localList);

  return newPlano;
}

/**
 * Busca planos alimentares de um paciente
 */
export async function getPlanosAlimentaresByPacienteId(pacienteId: string): Promise<PlanoAlimentarItem[]> {
  if (sql) {
    try {
      await initPacientesDatabase();
      const rows = await sql`
        SELECT *
        FROM planos_alimentares
        WHERE paciente_id = ${pacienteId}
        ORDER BY created_at DESC
      `;
      return rows.map((r: any) => ({
        id: r.id,
        paciente_id: r.paciente_id,
        titulo: r.titulo || 'Plano Alimentar',
        conteudo: r.conteudo,
        created_at: r.created_at
      }));
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
    }
  }

  const localList = getLocalPlanos().filter(p => p.paciente_id === pacienteId);
  return localList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
