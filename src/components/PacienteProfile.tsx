import React, { useEffect, useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  User, 
  Activity, 
  Clock, 
  Calendar, 
  Save, 
  Plus, 
  FileText, 
  Phone, 
  Mail, 
  Scale, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Pencil
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { EvolucaoPesoChart } from './EvolucaoPesoChart';
import { NovaConsultaModal } from './NovaConsultaModal';
import { EditarConsultaModal } from './EditarConsultaModal';
import { GerarPlanoModal } from './GerarPlanoModal';
import { 
  getPacienteById, 
  updatePaciente, 
  getConsultasByPacienteId, 
  getPlanosAlimentaresByPacienteId,
  type Paciente, 
  type ConsultaItem, 
  type PlanoAlimentarItem 
} from '../services/pacientes';

interface PacienteProfileProps {
  pacienteId: string;
  onBack: () => void;
}

type MainSection = 'dados' | 'consultas' | 'planos';
type DadosTab = 'pessoal' | 'clinico' | 'habitos';

const OBJETIVOS_OPTIONS = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar'
];

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo'
];

const PATOLOGIAS_OPTIONS = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto'
];

const RESTRICOES_OPTIONS = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar'
];

const ALERGIAS_OPTIONS = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar'
];

export const PacienteProfile: React.FC<PacienteProfileProps> = ({
  pacienteId,
  onBack
}) => {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<ConsultaItem[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentarItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<MainSection>('dados');
  const [activeDadosTab, setActiveDadosTab] = useState<DadosTab>('pessoal');

  // Modal de Nova Consulta
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);

  // Modal de Edição de Consulta
  const [consultaParaEditar, setConsultaParaEditar] = useState<ConsultaItem | null>(null);

  // Modal de Gerar Plano com IA
  const [isGerarPlanoModalOpen, setIsGerarPlanoModalOpen] = useState(false);

  // Estados de formulário editável
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Feminino');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [selectedObjetivos, setSelectedObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Moderadamente ativo');

  const [selectedPatologias, setSelectedPatologias] = useState<string[]>([]);
  const [patologiaNenhum, setPatologiaNenhum] = useState(false);
  const [patologiasOutras, setPatologiasOutras] = useState('');

  const [selectedRestricoes, setSelectedRestricoes] = useState<string[]>([]);
  const [restricaoNenhum, setRestricaoNenhum] = useState(false);
  const [restricoesOutras, setRestricoesOutras] = useState('');

  const [selectedAlergias, setSelectedAlergias] = useState<string[]>([]);
  const [alergiaNenhum, setAlergiaNenhum] = useState(false);
  const [alergiasOutras, setAlergiasOutras] = useState('');

  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  const [refeicoesDia, setRefeicoesDia] = useState('');
  const [horarioAcordaInput, setHorarioAcordaInput] = useState('');
  const [horarioDormeInput, setHorarioDormeInput] = useState('');
  const [aguaLitros, setAguaLitros] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState(false);
  const [atividadeDetalhes, setAtividadeDetalhes] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Expansão de visualização de plano alimentar no histórico
  const [expandedPlanoId, setExpandedPlanoId] = useState<string | null>(null);

  // Carregar dados completos do paciente em tempo real
  const loadData = async () => {
    setIsLoading(true);
    try {
      const p = await getPacienteById(pacienteId);
      if (p) {
        setPaciente(p);
        // Preenche estados do formulário
        setNome(p.nome || '');
        setDataNascimento(p.data_nascimento || '');
        setSexo(p.sexo || 'Feminino');
        setWhatsapp(p.whatsapp || '');
        setEmail(p.email || '');

        setPeso(p.peso_inicial !== undefined ? String(p.peso_inicial) : '');
        setAltura(p.altura !== undefined ? String(p.altura) : '');
        setSelectedObjetivos(p.objetivos || []);
        setObjetivoTexto(p.objetivo_texto || '');
        setNivelAtividade(p.nivel_atividade || 'Moderadamente ativo');

        const hasPatNenhum = p.patologias?.includes('Nenhum') || false;
        setPatologiaNenhum(hasPatNenhum);
        setSelectedPatologias(p.patologias?.filter(x => x !== 'Nenhum') || []);
        setPatologiasOutras(p.patologias_outras || '');

        const hasResNenhum = p.restricoes?.includes('Nenhum') || false;
        setRestricaoNenhum(hasResNenhum);
        setSelectedRestricoes(p.restricoes?.filter(x => x !== 'Nenhum') || []);
        setRestricoesOutras(p.restricoes_outras || '');

        const hasAleNenhum = p.alergias?.includes('Nenhum') || false;
        setAlergiaNenhum(hasAleNenhum);
        setSelectedAlergias(p.alergias?.filter(x => x !== 'Nenhum') || []);
        setAlergiasOutras(p.alergias_outras || '');

        setMedicamentos(p.medicamentos || '');
        setSuplementos(p.suplementos || '');

        setRefeicoesDia(p.refeicoes_dia !== undefined ? String(p.refeicoes_dia) : '4');
        setHorarioAcordaInput(p.horario_acorda || '07:00');
        setHorarioDormeInput(p.horario_dorme || '23:00');
        setAguaLitros(p.agua_litros !== undefined ? String(p.agua_litros) : '2.5');
        setPraticaAtividade(Boolean(p.pratica_atividade));
        setAtividadeDetalhes(p.atividade_detalhes || '');
        setObservacoes(p.observacoes || '');
      }

      const c = await getConsultasByPacienteId(pacienteId);
      setConsultas(c);

      const pl = await getPlanosAlimentaresByPacienteId(pacienteId);
      setPlanos(pl);
    } catch (err) {
      console.error('Erro ao carregar dados do perfil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pacienteId]);

  // Idade calculada
  const idadeCalculada = useMemo(() => {
    if (!dataNascimento) return null;
    const birthDate = new Date(dataNascimento);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dataNascimento]);

  // IMC calculado
  const imcCalculado = useMemo(() => {
    const p = parseFloat(peso.replace(',', '.'));
    let a = parseFloat(altura.replace(',', '.'));
    if (!p || !a || isNaN(p) || isNaN(a)) return null;
    if (a > 3) a = a / 100;
    if (a <= 0) return null;
    return Number((p / (a * a)).toFixed(2));
  }, [peso, altura]);

  const toggleArrayItem = (list: string[], item: string, setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSalvarAlteracoes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!nome.trim()) {
      setSaveError('O nome completo do paciente não pode ficar vazio.');
      return;
    }

    setIsSaving(true);
    try {
      const pesoNum = peso ? parseFloat(peso.replace(',', '.')) : undefined;
      let alturaNum = altura ? parseFloat(altura.replace(',', '.')) : undefined;
      if (alturaNum && alturaNum < 3) alturaNum = alturaNum * 100;

      const aguaNum = aguaLitros ? parseFloat(aguaLitros.replace(',', '.')) : undefined;
      const refeicoesNum = refeicoesDia ? parseInt(refeicoesDia, 10) : undefined;

      const updates: Partial<Paciente> = {
        nome: nome.trim(),
        data_nascimento: dataNascimento || undefined,
        sexo,
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        peso_inicial: pesoNum,
        altura: alturaNum,
        imc: imcCalculado || undefined,
        objetivos: selectedObjetivos,
        objetivo_texto: objetivoTexto.trim() || undefined,
        nivel_atividade: nivelAtividade,
        patologias: patologiaNenhum ? ['Nenhum'] : selectedPatologias,
        patologias_outras: patologiasOutras.trim() || undefined,
        restricoes: restricaoNenhum ? ['Nenhum'] : selectedRestricoes,
        restricoes_outras: restricoesOutras.trim() || undefined,
        alergias: alergiaNenhum ? ['Nenhum'] : selectedAlergias,
        alergias_outras: alergiasOutras.trim() || undefined,
        medicamentos: medicamentos.trim() || undefined,
        suplementos: suplementos.trim() || undefined,
        refeicoes_dia: refeicoesNum,
        horario_acorda: horarioAcordaInput || undefined,
        horario_dorme: horarioDormeInput || undefined,
        agua_litros: aguaNum,
        pratica_atividade: praticaAtividade,
        atividade_detalhes: praticaAtividade ? atividadeDetalhes.trim() : undefined,
        observacoes: observacoes.trim() || undefined
      };

      const updated = await updatePaciente(pacienteId, updates);
      setPaciente(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Erro ao atualizar paciente:', err);
      setSaveError(err.message || 'Erro ao salvar alterações no Neon.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConsultaSuccess = (novaConsulta: ConsultaItem) => {
    setConsultas(prev => [novaConsulta, ...prev].sort(
      (a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime()
    ));
  };

  const handleConsultaUpdated = (updated: ConsultaItem) => {
    setConsultas(prev =>
      prev
        .map(c => c.id === updated.id ? updated : c)
        .sort((a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime())
    );
  };

  const handleConsultaDeleted = (id: string) => {
    setConsultas(prev => prev.filter(c => c.id !== id));
  };

  const handlePlanoSalvo = (novoPlano: PlanoAlimentarItem) => {
    setPlanos(prev => [novoPlano, ...prev].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
    setExpandedPlanoId(novoPlano.id);
  };

  const renderPlanoConteudo = (conteudo: string) => {
    try {
      const parsed = JSON.parse(conteudo);
      if (parsed && Array.isArray(parsed.plano_semanal)) {
        return (
          <div className="space-y-4">
            {parsed.plano_semanal.map((dia: any, dIdx: number) => (
              <div key={dIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-100 font-bold text-xs text-emerald-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {dia.dia}
                </div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dia.refeicoes && Object.entries(dia.refeicoes).map(([key, items]: [string, any]) => {
                    const labels: Record<string, string> = {
                      cafe_da_manha: 'Café da Manhã',
                      lanche_manha: 'Lanche da Manhã',
                      almoco: 'Almoço',
                      lanche_tarde: 'Lanche da Tarde',
                      jantar: 'Jantar'
                    };
                    return (
                      <div key={key} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wide">
                          {labels[key] || key}
                        </span>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                          {Array.isArray(items) && items.map((opt: string, optIdx: number) => (
                            <li key={optIdx} className="leading-snug">{opt}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      }
    } catch {
      // Not JSON or fallback
    }

    return (
      <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
        {conteudo}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fadeIn py-8">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Paciente não encontrado</h3>
        <Button onClick={onBack} variant="outline" className="h-10 text-xs">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Topo / Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-10 px-3 text-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar
          </Button>
          <div>
            <span className="text-xs text-slate-400">Perfil do Paciente</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              {paciente.nome}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={loadData}
            className="h-10 px-3.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Atualizar dados
          </Button>
        </div>
      </div>

      {/* Header com Resumo do Paciente */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-emerald-500/20 flex-shrink-0">
            {paciente.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{paciente.nome}</h2>
              {paciente.sexo && (
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                  {paciente.sexo}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              {paciente.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {paciente.email}
                </span>
              )}
              {paciente.whatsapp && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {paciente.whatsapp}
                </span>
              )}
              {paciente.data_nascimento && (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')} {idadeCalculada !== null ? `(${idadeCalculada} anos)` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div className="text-left">
            <span className="text-[11px] text-slate-400 block font-medium">Consultas</span>
            <span className="text-lg font-bold text-slate-800">{consultas.length}</span>
          </div>
          <div className="text-left">
            <span className="text-[11px] text-slate-400 block font-medium">Peso Inicial</span>
            <span className="text-lg font-bold text-slate-800">
              {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}
            </span>
          </div>
          <div className="text-left">
            <span className="text-[11px] text-slate-400 block font-medium">IMC</span>
            <span className="text-lg font-bold text-emerald-600">
              {paciente.imc ? `${paciente.imc}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Navegação entre as 3 Seções Principais */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 gap-1.5 shadow-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('dados')}
          className={`flex-1 min-w-[170px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSection === 'dados'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('consultas')}
          className={`flex-1 min-w-[170px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSection === 'consultas'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Consultas ({consultas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('planos')}
          className={`flex-1 min-w-[170px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSection === 'planos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Planos Alimentares ({planos.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEIS) */}
      {/* ======================================================== */}
      {activeSection === 'dados' && (
        <form onSubmit={handleSalvarAlteracoes} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fadeIn">
          {/* Sub-abas: Pessoal, Clínico, Hábitos */}
          <div className="flex border-b border-slate-200 bg-slate-50/60 p-2 gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveDadosTab('pessoal')}
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                activeDadosTab === 'pessoal'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aba 1: Pessoal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDadosTab('clinico')}
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                activeDadosTab === 'clinico'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aba 2: Clínico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDadosTab('habitos')}
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                activeDadosTab === 'habitos'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aba 3: Hábitos</span>
            </button>
          </div>

          {/* Feedback de salvamento */}
          <div className="px-6 pt-6">
            {saveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  Alterações salvas com sucesso no banco de dados!
                </span>
              </div>
            )}
            {saveError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">{saveError}</span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* ABA 1: PESSOAL */}
            {activeDadosTab === 'pessoal' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      id="edit-paciente-nome"
                      label="Nome completo *"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      icon={<User className="w-4 h-4" />}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-paciente-nasc" className="block text-sm font-medium text-slate-700">
                      Data de nascimento
                    </label>
                    <input
                      id="edit-paciente-nasc"
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                    {idadeCalculada !== null && (
                      <span className="text-xs text-emerald-700 font-semibold mt-1 bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-100">
                        Idade: {idadeCalculada} anos
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Sexo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Feminino', 'Masculino', 'Outro'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSexo(item)}
                          className={`h-11 rounded-xl text-xs font-semibold border transition-all ${
                            sexo === item
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Input
                      id="edit-paciente-whatsapp"
                      label="WhatsApp"
                      placeholder="(00) 00000-0000"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      icon={<Phone className="w-4 h-4" />}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Input
                      id="edit-paciente-email"
                      type="email"
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={<Mail className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: CLÍNICO */}
            {activeDadosTab === 'clinico' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Antropometria Inicial */}
                <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    Antropometria Inicial
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="edit-paciente-peso" className="block text-xs font-semibold text-slate-700">
                        Peso atual
                      </label>
                      <div className="relative">
                        <input
                          id="edit-paciente-peso"
                          type="text"
                          value={peso}
                          onChange={(e) => setPeso(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                          kg
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="edit-paciente-altura" className="block text-xs font-semibold text-slate-700">
                        Altura
                      </label>
                      <div className="relative">
                        <input
                          id="edit-paciente-altura"
                          type="text"
                          value={altura}
                          onChange={(e) => setAltura(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                          cm
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        IMC (Automático)
                      </label>
                      <div className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 flex items-center justify-between shadow-sm">
                        <span className="text-sm font-bold text-slate-800">
                          {imcCalculado !== null ? `${imcCalculado} kg/m²` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-800">
                    Objetivo(s) Nutricional(is)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OBJETIVOS_OPTIONS.map((obj) => {
                      const isSelected = selectedObjetivos.includes(obj);
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => toggleArrayItem(selectedObjetivos, obj, setSelectedObjetivos)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{obj}
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    placeholder="Outro objetivo ou observação específica..."
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                  />
                </div>

                {/* Nível de Atividade */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-800">
                    Nível de Atividade Física
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {NIVEIS_ATIVIDADE.map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => setNivelAtividade(nivel)}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                          nivelAtividade === nivel
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-800">
                      Patologias ou condições de saúde
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={patologiaNenhum}
                        onChange={(e) => {
                          setPatologiaNenhum(e.target.checked);
                          if (e.target.checked) setSelectedPatologias([]);
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-700">Nenhum</span>
                    </label>
                  </div>
                  {!patologiaNenhum && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {PATOLOGIAS_OPTIONS.map((pat) => {
                          const isSelected = selectedPatologias.includes(pat);
                          return (
                            <button
                              key={pat}
                              type="button"
                              onClick={() => toggleArrayItem(selectedPatologias, pat, setSelectedPatologias)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{pat}
                            </button>
                          );
                        })}
                      </div>
                      <Input
                        placeholder="Adicionar outras patologias..."
                        value={patologiasOutras}
                        onChange={(e) => setPatologiasOutras(e.target.value)}
                      />
                    </>
                  )}
                </div>

                {/* Restrições Alimentares */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-800">
                      Restrições alimentares
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restricaoNenhum}
                        onChange={(e) => {
                          setRestricaoNenhum(e.target.checked);
                          if (e.target.checked) setSelectedRestricoes([]);
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-700">Nenhum</span>
                    </label>
                  </div>
                  {!restricaoNenhum && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {RESTRICOES_OPTIONS.map((rest) => {
                          const isSelected = selectedRestricoes.includes(rest);
                          return (
                            <button
                              key={rest}
                              type="button"
                              onClick={() => toggleArrayItem(selectedRestricoes, rest, setSelectedRestricoes)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{rest}
                            </button>
                          );
                        })}
                      </div>
                      <Input
                        placeholder="Adicionar outras restrições..."
                        value={restricoesOutras}
                        onChange={(e) => setRestricoesOutras(e.target.value)}
                      />
                    </>
                  )}
                </div>

                {/* Alergias */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-800">
                      Alergias alimentares
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alergiaNenhum}
                        onChange={(e) => {
                          setAlergiaNenhum(e.target.checked);
                          if (e.target.checked) setSelectedAlergias([]);
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-700">Nenhum</span>
                    </label>
                  </div>
                  {!alergiaNenhum && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {ALERGIAS_OPTIONS.map((alerg) => {
                          const isSelected = selectedAlergias.includes(alerg);
                          return (
                            <button
                              key={alerg}
                              type="button"
                              onClick={() => toggleArrayItem(selectedAlergias, alerg, setSelectedAlergias)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{alerg}
                            </button>
                          );
                        })}
                      </div>
                      <Input
                        placeholder="Adicionar outras alergias..."
                        value={alergiasOutras}
                        onChange={(e) => setAlergiasOutras(e.target.value)}
                      />
                    </>
                  )}
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-paciente-meds" className="block text-xs font-semibold text-slate-700">
                      Medicamentos contínuos
                    </label>
                    <textarea
                      id="edit-paciente-meds"
                      rows={2}
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-paciente-suplem" className="block text-xs font-semibold text-slate-700">
                      Suplementos em uso
                    </label>
                    <textarea
                      id="edit-paciente-suplem"
                      rows={2}
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: HÁBITOS */}
            {activeDadosTab === 'habitos' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-paciente-ref" className="block text-xs font-semibold text-slate-700">
                      Refeições por dia
                    </label>
                    <input
                      id="edit-paciente-ref"
                      type="number"
                      value={refeicoesDia}
                      onChange={(e) => setRefeicoesDia(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-paciente-hora-acorda" className="block text-xs font-semibold text-slate-700">
                      Horário que acorda
                    </label>
                    <input
                      id="edit-paciente-hora-acorda"
                      type="text"
                      value={horarioAcordaInput}
                      onChange={(e) => setHorarioAcordaInput(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-paciente-hora-dorme" className="block text-xs font-semibold text-slate-700">
                      Horário que dorme
                    </label>
                    <input
                      id="edit-paciente-hora-dorme"
                      type="text"
                      value={horarioDormeInput}
                      onChange={(e) => setHorarioDormeInput(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-paciente-agua" className="block text-xs font-semibold text-slate-700">
                      Água por dia
                    </label>
                    <div className="relative">
                      <input
                        id="edit-paciente-agua"
                        type="text"
                        value={aguaLitros}
                        onChange={(e) => setAguaLitros(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-14 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                        litros
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prática de Atividade */}
                <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Pratica atividade física?</h4>
                      <p className="text-xs text-slate-500">Exercícios regulares ou esportes.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPraticaAtividade(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          praticaAtividade
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPraticaAtividade(false);
                          setAtividadeDetalhes('');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          !praticaAtividade
                            ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {praticaAtividade && (
                    <div className="pt-2 animate-fadeIn">
                      <Input
                        id="edit-paciente-atividade-detalhes"
                        label="Qual atividade e frequência semanal?"
                        value={atividadeDetalhes}
                        onChange={(e) => setAtividadeDetalhes(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-paciente-obs" className="block text-sm font-semibold text-slate-800">
                    Observações gerais
                  </label>
                  <textarea
                    id="edit-paciente-obs"
                    rows={4}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Botão de Salvar Alterações */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <Button
                type="submit"
                isLoading={isSaving}
                className="h-11 px-6 text-xs sm:text-sm shadow-md shadow-emerald-600/20"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar alterações
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* SEÇÃO 2 — CONSULTAS & EVOLUÇÃO DE PESO */}
      {/* ======================================================== */}
      {activeSection === 'consultas' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Topo da Seção de Consultas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Histórico de Atendimentos</h3>
              <p className="text-xs text-slate-500">Acompanhamento da evolução física e registro das sessões clínicas.</p>
            </div>

            <Button
              onClick={() => setIsConsultaModalOpen(true)}
              className="h-11 px-5 text-xs shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Consulta
            </Button>
          </div>

          {/* Gráfico de Evolução de Peso em Destaque */}
          <EvolucaoPesoChart
            consultas={consultas}
            pesoInicial={paciente.peso_inicial}
          />

          {/* Lista de Consultas em Ordem Cronológica Decrescente */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Consultas Realizadas ({consultas.length})
              </h4>
            </div>

            {consultas.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Nenhuma consulta registrada ainda. Clique em "Nova Consulta" para registrar o primeiro atendimento.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {consultas.map((c) => (
                  <div key={c.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <span className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        Consulta em {new Date(c.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {c.proximo_retorno && (
                          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                            Próximo retorno: {new Date(c.proximo_retorno + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setConsultaParaEditar(c)}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
                          title="Editar ou excluir esta consulta"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-medium">Peso:</span>
                        <strong className="text-slate-800 text-sm">{c.peso ? `${c.peso} kg` : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Cintura:</span>
                        <strong className="text-slate-800 text-sm">{c.cintura ? `${c.cintura} cm` : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Quadril:</span>
                        <strong className="text-slate-800 text-sm">{c.quadril ? `${c.quadril} cm` : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">% Gordura:</span>
                        <strong className="text-slate-800 text-sm">{c.percentual_gordura ? `${c.percentual_gordura}%` : '—'}</strong>
                      </div>
                    </div>

                    {c.observacoes && (
                      <div className="mt-3 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700 block mb-1">Notas do atendimento:</span>
                        <p className="italic">"{c.observacoes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SEÇÃO 3 — PLANOS ALIMENTARES */}
      {/* ======================================================== */}
      {activeSection === 'planos' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Topo da Seção com Botão Visível */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Planos Nutricionais Personalizados
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gere cardápios e dietas calculadas baseadas na anamnese e histórico do paciente.
              </p>
            </div>

            {/* Botão Gerar Plano com IA */}
            <Button
              onClick={() => setIsGerarPlanoModalOpen(true)}
              className="h-11 px-5 text-xs sm:text-sm shadow-md shadow-emerald-600/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Sparkles className="w-4 h-4 mr-2 text-emerald-200" />
              ✨ Gerar Plano com IA
            </Button>
          </div>

          {/* Histórico de Planos Salvos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Histórico de Planos ({planos.length})
              </h4>
            </div>

            {planos.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">
                  Nenhum plano alimentar gerado ainda
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Utilize o botão "✨ Gerar Plano com IA" acima para criar a primeira prescrição dietética deste paciente.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {planos.map((plano) => {
                  const isExpanded = expandedPlanoId === plano.id;
                  return (
                    <div key={plano.id} className="p-5">
                      <div
                        onClick={() => setExpandedPlanoId(isExpanded ? null : plano.id)}
                        className="flex items-center justify-between cursor-pointer hover:text-emerald-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-slate-800">
                              {plano.titulo || 'Plano Alimentar Nutricional'}
                            </h5>
                            <span className="text-xs text-slate-400">
                              Gerado em {new Date(plano.created_at).toLocaleDateString('pt-BR')} às {new Date(plano.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                          <span>{isExpanded ? 'Ocultar detalhes' : 'Ver conteúdo'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Conteúdo completo ao clicar no plano */}
                      {isExpanded && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 animate-fadeIn">
                          {renderPlanoConteudo(plano.conteudo)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Nova Consulta */}
      <NovaConsultaModal
        pacienteId={pacienteId}
        isOpen={isConsultaModalOpen}
        onClose={() => setIsConsultaModalOpen(false)}
        onSuccess={handleConsultaSuccess}
      />

      {/* Modal de Edição/Exclusão de Consulta */}
      {consultaParaEditar && (
        <EditarConsultaModal
          consulta={consultaParaEditar}
          isOpen={!!consultaParaEditar}
          onClose={() => setConsultaParaEditar(null)}
          onUpdated={handleConsultaUpdated}
          onDeleted={handleConsultaDeleted}
        />
      )}

      {/* Modal de Geração de Plano Alimentar com IA */}
      {isGerarPlanoModalOpen && (
        <GerarPlanoModal
          paciente={paciente}
          isOpen={isGerarPlanoModalOpen}
          onClose={() => setIsGerarPlanoModalOpen(false)}
          onPlanoSalvo={handlePlanoSalvo}
        />
      )}
    </div>
  );
};
