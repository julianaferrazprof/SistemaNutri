import { neon } from '@neondatabase/serverless';

const databaseUrl = import.meta.env.VITE_NEON_DATABASE_URL || '';
export const sql = databaseUrl ? neon(databaseUrl) : null;

export interface PacienteSemRetorno {
  id: string;
  nome: string;
  email?: string;
  whatsapp?: string;
  ultima_consulta: string;
  dias_sem_consulta: number;
}

export interface DashboardMetrics {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}

export interface PacienteItem {
  id: string;
  nome: string;
  email?: string;
  whatsapp?: string;
  created_at: string;
}

/**
 * Obtém os dados do dashboard em tempo real do banco Neon
 */
export async function getDashboardData(nutricionistaId: string): Promise<DashboardMetrics> {
  if (!sql) {
    // Fallback vazio/mock se não houver conexão Neon configurada
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }

  try {
    // 1. Total de pacientes cadastrados pela nutricionista logada
    const pacientesCountResult = await sql`
      SELECT COUNT(*)::int as total
      FROM pacientes
      WHERE nutricionista_id = ${nutricionistaId}
    `;
    const totalPacientes = pacientesCountResult[0]?.total || 0;

    // 2. Consultas da semana atual da nutricionista
    // Considera a semana atual (de domingo/segunda até sábado/domingo ou últimos 7 dias da semana corrente)
    const consultasSemanaResult = await sql`
      SELECT COUNT(c.id)::int as total
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
        AND c.data_consulta < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
    `;
    const consultasSemana = consultasSemanaResult[0]?.total || 0;

    // 3. Pacientes sem retorno:
    // Pacientes cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado (ou proximo_retorno é NULL / < CURRENT_DATE)
    const pacientesSemRetornoResult = await sql`
      WITH ultimas_consultas AS (
        SELECT 
          c.paciente_id,
          MAX(c.data_consulta) as ultima_consulta_data,
          MAX(c.proximo_retorno) as max_proximo_retorno
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${nutricionistaId}
        GROUP BY c.paciente_id
      )
      SELECT 
        p.id,
        p.nome,
        p.email,
        p.whatsapp,
        uc.ultima_consulta_data as ultima_consulta,
        (CURRENT_DATE - uc.ultima_consulta_data)::int as dias_sem_consulta
      FROM pacientes p
      JOIN ultimas_consultas uc ON p.id = uc.paciente_id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND uc.ultima_consulta_data < (CURRENT_DATE - INTERVAL '30 days')
        AND (uc.max_proximo_retorno IS NULL OR uc.max_proximo_retorno < CURRENT_DATE)
      ORDER BY uc.ultima_consulta_data ASC
    `;

    const pacientesSemRetorno: PacienteSemRetorno[] = pacientesSemRetornoResult.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      email: row.email || undefined,
      whatsapp: row.whatsapp || undefined,
      ultima_consulta: row.ultima_consulta ? new Date(row.ultima_consulta).toLocaleDateString('pt-BR') : '',
      dias_sem_consulta: row.dias_sem_consulta || 0,
    }));

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno,
    };
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard Neon:', error);
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }
}

/**
 * Busca lista de pacientes cadastrados da nutricionista
 */
export async function getPacientes(nutricionistaId: string): Promise<PacienteItem[]> {
  if (!sql) return [];
  try {
    const rows = await sql`
      SELECT id, nome, email, whatsapp, created_at
      FROM pacientes
      WHERE nutricionista_id = ${nutricionistaId}
      ORDER BY nome ASC
    `;
    return rows.map((r: any) => ({
      id: r.id,
      nome: r.nome,
      email: r.email,
      whatsapp: r.whatsapp,
      created_at: r.created_at,
    }));
  } catch (error) {
    console.error('Erro ao buscar lista de pacientes:', error);
    return [];
  }
}
