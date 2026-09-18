import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  RefreshCw, 
  UserCheck, 
  AlertCircle, 
  ChevronRight,
  Phone,
  Mail,
  CalendarDays
} from 'lucide-react';
import type { Nutricionista } from '../services/auth';
import { getDashboardData, type DashboardMetrics, type PacienteSemRetorno } from '../services/dashboard';

interface DashboardProps {
  user: Nutricionista;
  onNavigateToPacientes: () => void;
  onSelectPaciente?: (pacienteId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onNavigateToPacientes,
  onSelectPaciente
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (showRefreshState = false) => {
    if (showRefreshState) setIsRefreshing(true);
    try {
      const data = await getDashboardData(user.id);
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handlePacienteClick = (paciente: PacienteSemRetorno) => {
    if (onSelectPaciente) {
      onSelectPaciente(paciente.id);
    } else {
      onNavigateToPacientes();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Topo / Boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Visão Geral em Tempo Real
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Olá, {user.nome}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Aqui está o resumo da sua prática clínica hoje.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-xs disabled:opacity-60 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar dados'}
        </button>
      </div>

      {/* Grid com os 3 Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 — Total de pacientes ativos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pacientes Ativos
            </span>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-12 h-9 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                  metrics.totalPacientes
                )}
              </h3>
              <span className="text-xs text-slate-500 font-medium">cadastrados</span>
            </div>

            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Total de pacientes sob seus cuidados
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
            <button
              type="button"
              onClick={onNavigateToPacientes}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group-hover:underline"
            >
              Ver todos os pacientes
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2 — Consultas da semana */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Consultas da Semana
            </span>
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100/80 text-teal-600 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-12 h-9 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                  metrics.consultasSemana
                )}
              </h3>
              <span className="text-xs text-slate-500 font-medium">atendimentos</span>
            </div>

            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
              Registradas na semana atual
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
            <span className="text-xs text-slate-400">
              Sincronizado com Neon
            </span>
          </div>
        </div>

        {/* Card 3 — Pacientes sem retorno (Contador de Destaque) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pacientes Sem Retorno
            </span>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-600 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-12 h-9 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                  metrics.pacientesSemRetorno.length
                )}
              </h3>
              <span className="text-xs text-slate-500 font-medium">pendentes</span>
            </div>

            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              Última consulta há mais de 30 dias
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
            <span className="text-xs text-amber-700 font-medium">
              Sem agendamento futuro
            </span>
          </div>
        </div>
      </div>

      {/* Card 3 Detalhado — Lista de Pacientes Sem Retorno */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Pacientes que precisam de retorno
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pacientes cuja última consulta foi realizada há mais de 30 dias e ainda não têm data agendada.
            </p>
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 self-start sm:self-auto">
            {metrics.pacientesSemRetorno.length} paciente(s)
          </span>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : metrics.pacientesSemRetorno.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-slate-50/50 border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-700">
                Nenhum paciente sem retorno no momento
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Excelente trabalho! Todos os seus pacientes estão com o acompanhamento em dia ou agendados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.pacientesSemRetorno.map((paciente) => (
                <div
                  key={paciente.id}
                  onClick={() => handlePacienteClick(paciente)}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 -mx-6 px-6 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 mt-0.5">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                        {paciente.nome}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {paciente.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {paciente.email}
                          </span>
                        )}
                        {paciente.whatsapp && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {paciente.whatsapp}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right">
                    <div className="text-xs">
                      <span className="text-slate-400 block font-medium">Última consulta</span>
                      <span className="text-slate-700 font-semibold">{paciente.ultima_consulta}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200/50">
                      {paciente.dias_sem_consulta} dias atrás
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
