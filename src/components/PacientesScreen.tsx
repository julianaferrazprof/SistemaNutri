import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Activity,
  FileText
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Nutricionista } from '../services/auth';
import { sql } from '../services/dashboard';

interface PacientesScreenProps {
  user: Nutricionista;
  selectedPacienteId?: string | null;
  onClearSelectedPaciente?: () => void;
}

interface PacienteDetail {
  id: string;
  nome: string;
  email?: string;
  whatsapp?: string;
  data_nascimento?: string;
  sexo?: string;
  peso_inicial?: number;
  altura?: number;
  objetivo_texto?: string;
  nivel_atividade?: string;
  medicamentos?: string;
  suplementos?: string;
  created_at: string;
}

interface ConsultaItem {
  id: string;
  data_consulta: string;
  peso?: number;
  cintura?: number;
  quadril?: number;
  percentual_gordura?: number;
  observacoes?: string;
  proximo_retorno?: string;
}

export const PacientesScreen: React.FC<PacientesScreenProps> = ({
  user,
  selectedPacienteId: initialSelectedId,
  onClearSelectedPaciente
}) => {
  const [pacientes, setPacientes] = useState<PacienteDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<PacienteDetail | null>(null);
  const [consultas, setConsultas] = useState<ConsultaItem[]>([]);
  const [isLoadingConsultas, setIsLoadingConsultas] = useState(false);

  // Carregar lista de pacientes do Neon
  const loadPacientes = async () => {
    setIsLoading(true);
    try {
      if (sql) {
        const rows = await sql`
          SELECT *
          FROM pacientes
          WHERE nutricionista_id = ${user.id}
          ORDER BY nome ASC
        `;
        const list: PacienteDetail[] = rows.map((r: any) => ({
          id: r.id,
          nome: r.nome,
          email: r.email,
          whatsapp: r.whatsapp,
          data_nascimento: r.data_nascimento,
          sexo: r.sexo,
          peso_inicial: r.peso_inicial ? Number(r.peso_inicial) : undefined,
          altura: r.altura ? Number(r.altura) : undefined,
          objetivo_texto: r.objetivo_texto,
          nivel_atividade: r.nivel_atividade,
          medicamentos: r.medicamentos,
          suplementos: r.suplementos,
          created_at: r.created_at
        }));
        setPacientes(list);

        if (initialSelectedId) {
          const match = list.find(p => p.id === initialSelectedId);
          if (match) {
            selectPaciente(match);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, [user.id, initialSelectedId]);

  const selectPaciente = async (paciente: PacienteDetail) => {
    setSelectedPaciente(paciente);
    setIsLoadingConsultas(true);
    try {
      if (sql) {
        const rows = await sql`
          SELECT *
          FROM consultas
          WHERE paciente_id = ${paciente.id}
          ORDER BY data_consulta DESC
        `;
        setConsultas(rows.map((r: any) => ({
          id: r.id,
          data_consulta: r.data_consulta,
          peso: r.peso ? Number(r.peso) : undefined,
          cintura: r.cintura ? Number(r.cintura) : undefined,
          quadril: r.quadril ? Number(r.quadril) : undefined,
          percentual_gordura: r.percentual_gordura ? Number(r.percentual_gordura) : undefined,
          observacoes: r.observacoes,
          proximo_retorno: r.proximo_retorno
        })));
      }
    } catch (err) {
      console.error('Erro ao carregar consultas:', err);
    } finally {
      setIsLoadingConsultas(false);
    }
  };

  const handleBackToList = () => {
    setSelectedPaciente(null);
    if (onClearSelectedPaciente) onClearSelectedPaciente();
  };

  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.whatsapp && p.whatsapp.includes(searchTerm))
  );

  // Exibição do Perfil do Paciente selecionado
  if (selectedPaciente) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Topo do Perfil */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="h-9 px-3 text-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar para a lista
          </Button>
          <span className="text-xs text-slate-400">/ Perfil do Paciente</span>
        </div>

        {/* Header do Paciente */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-emerald-500/20">
              {selectedPaciente.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{selectedPaciente.nome}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                {selectedPaciente.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {selectedPaciente.email}
                  </span>
                )}
                {selectedPaciente.whatsapp && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedPaciente.whatsapp}
                  </span>
                )}
                {selectedPaciente.created_at && (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Cadastrado em {new Date(selectedPaciente.created_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes Clínicos e Consultas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados Físicos / Anamnese */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Dados Gerais
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500">Peso Inicial:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPaciente.peso_inicial ? `${selectedPaciente.peso_inicial} kg` : 'Não informado'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500">Altura:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPaciente.altura ? `${selectedPaciente.altura} m` : 'Não informado'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500">Nível de Atividade:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPaciente.nivel_atividade || 'Não informado'}
                </span>
              </div>
              {selectedPaciente.objetivo_texto && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block mb-1">Objetivo:</span>
                  <p className="font-medium text-slate-700 leading-relaxed">
                    {selectedPaciente.objetivo_texto}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Histórico de Consultas */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Histórico de Consultas
            </h2>

            {isLoadingConsultas ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
              </div>
            ) : consultas.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 bg-slate-50 rounded-xl">
                Nenhuma consulta registrada para este paciente ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {consultas.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        Consulta em {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                      </span>
                      {c.proximo_retorno && (
                        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                          Retorno: {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-2">
                      {c.peso && <div className="text-slate-600">Peso: <strong className="text-slate-800">{c.peso} kg</strong></div>}
                      {c.cintura && <div className="text-slate-600">Cintura: <strong className="text-slate-800">{c.cintura} cm</strong></div>}
                      {c.quadril && <div className="text-slate-600">Quadril: <strong className="text-slate-800">{c.quadril} cm</strong></div>}
                      {c.percentual_gordura && <div className="text-slate-600">% Gordura: <strong className="text-slate-800">{c.percentual_gordura}%</strong></div>}
                    </div>

                    {c.observacoes && (
                      <p className="text-xs text-slate-600 mt-2 italic bg-white p-2.5 rounded-lg border border-slate-100">
                        "{c.observacoes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Lista de Pacientes
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Pacientes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie e visualize o histórico de todos os seus pacientes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={loadPacientes}
            disabled={isLoading}
            className="h-10 px-3.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            id="search-pacientes"
            placeholder="Buscar paciente por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="h-10"
          />
        </div>
      </div>

      {/* Lista / Tabela de Pacientes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPacientes.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
              {searchTerm ? 'Nenhum paciente encontrado para esta busca' : 'Nenhum paciente cadastrado ainda'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'Tente pesquisar com outros termos.' : 'Seus novos pacientes cadastrados aparecerão listados aqui.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPacientes.map((p) => (
              <div
                key={p.id}
                onClick={() => selectPaciente(p)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                    {p.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                      {p.nome}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      {p.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {p.email}
                        </span>
                      )}
                      {p.whatsapp && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {p.whatsapp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    Ver perfil
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
