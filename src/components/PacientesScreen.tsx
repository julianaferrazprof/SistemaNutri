import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  RefreshCw,
  ChevronRight,
  UserPlus,
  Target
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { NovoPacienteForm } from './NovoPacienteForm';
import { PacienteProfile } from './PacienteProfile';
import type { Nutricionista } from '../services/auth';
import { 
  getPacientesList, 
  type PacienteListItem, 
  type Paciente 
} from '../services/pacientes';

interface PacientesScreenProps {
  user: Nutricionista;
  selectedPacienteId?: string | null;
  onClearSelectedPaciente?: () => void;
}

export const PacientesScreen: React.FC<PacientesScreenProps> = ({
  user,
  selectedPacienteId: initialSelectedId,
  onClearSelectedPaciente
}) => {
  const [pacientes, setPacientes] = useState<PacienteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle de Visualização: 'list' | 'create' | 'detail'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail'>('list');
  const [currentSelectedId, setCurrentSelectedId] = useState<string | null>(initialSelectedId || null);

  // Carregar lista de pacientes
  const loadPacientes = async () => {
    setIsLoading(true);
    try {
      const list = await getPacientesList(user.id);
      setPacientes(list);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
    if (initialSelectedId) {
      setCurrentSelectedId(initialSelectedId);
      setViewMode('detail');
    }
  }, [user.id, initialSelectedId]);

  const handleOpenPacienteDetail = (pacienteId: string) => {
    setCurrentSelectedId(pacienteId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setCurrentSelectedId(null);
    if (onClearSelectedPaciente) onClearSelectedPaciente();
    loadPacientes();
  };

  const handleCreatedSuccess = (newPaciente: Paciente) => {
    loadPacientes();
    setCurrentSelectedId(newPaciente.id);
    setViewMode('detail');
  };

  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.objetivo_principal && p.objetivo_principal.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.whatsapp && p.whatsapp.includes(searchTerm))
  );

  // ========================================================
  // 1. TELA DE FORMULÁRIO DE CADASTRO (NOVO PACIENTE)
  // ========================================================
  if (viewMode === 'create') {
    return (
      <NovoPacienteForm
        user={user}
        onSuccess={handleCreatedSuccess}
        onCancel={handleBackToList}
      />
    );
  }

  // ========================================================
  // 2. TELA DE PERFIL DO PACIENTE (PROMPT 5: 3 SEÇÕES)
  // ========================================================
  if (viewMode === 'detail' && currentSelectedId) {
    return (
      <PacienteProfile
        pacienteId={currentSelectedId}
        onBack={handleBackToList}
      />
    );
  }

  // ========================================================
  // 3. TELA DE LISTAGEM DE PACIENTES
  // ========================================================
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Topo da Listagem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Pacientes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie e visualize o histórico de todos os seus pacientes cadastrados.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => loadPacientes()}
            disabled={isLoading}
            className="h-11 px-3.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          {/* Botão Novo Paciente que abre o formulário de cadastro */}
          <Button
            onClick={() => setViewMode('create')}
            className="h-11 px-5 text-sm shadow-md shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Campo de busca por nome no topo da listagem */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            id="search-pacientes"
            placeholder="Buscar por nome ou objetivo do paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="h-11"
          />
        </div>
      </div>

      {/* Lista de Pacientes Cadastrados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPacientes.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {searchTerm ? 'Nenhum paciente encontrado para esta busca' : 'Nenhum paciente cadastrado ainda'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'Tente buscar com outro termo.' : 'Clique no botão "Novo Paciente" para realizar seu primeiro cadastro.'}
            </p>
            {!searchTerm && (
              <div className="mt-5">
                <Button
                  onClick={() => setViewMode('create')}
                  className="h-10 text-xs px-4"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Cadastrar Primeiro Paciente
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPacientes.map((p) => (
              <div
                key={p.id}
                onClick={() => handleOpenPacienteDetail(p.id)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                {/* Paciente: Nome e Dados */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                    {p.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                      {p.nome}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                    </h4>
                    
                    {/* Objetivo do Paciente */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/80">
                        <Target className="w-3 h-3 text-emerald-600" />
                        {p.objetivo_principal}
                      </span>

                      {p.whatsapp && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Phone className="w-3 h-3" />
                          {p.whatsapp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Data da última consulta e ação */}
                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block font-medium">Última consulta</span>
                    <span className="text-slate-700 font-semibold">
                      {p.ultima_consulta ? p.ultima_consulta : 'Nenhuma consulta'}
                    </span>
                  </div>

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
