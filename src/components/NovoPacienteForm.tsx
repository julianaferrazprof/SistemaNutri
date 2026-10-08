import React, { useState, useMemo } from 'react';
import { 
  User, 
  Activity, 
  Clock, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Mail,
  Scale
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Nutricionista } from '../services/auth';
import { createPaciente, type Paciente } from '../services/pacientes';

interface NovoPacienteFormProps {
  user: Nutricionista;
  onSuccess: (paciente: Paciente) => void;
  onCancel: () => void;
}

type TabType = 'pessoal' | 'clinico' | 'habitos';

// Opções pré-definidas para as abas
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

export const NovoPacienteForm: React.FC<NovoPacienteFormProps> = ({
  user,
  onSuccess,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pessoal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // --- Aba 1: Pessoal ---
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<string>('Feminino');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // --- Aba 2: Clínico ---
  const [peso, setPeso] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
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

  // --- Aba 3: Hábitos ---
  const [refeicoesDia, setRefeicoesDia] = useState<string>('4');
  const [horarioAcordaInput, setHorarioAcordaInput] = useState('07:00');
  const [horarioDormeInput, setHorarioDormeInput] = useState('23:00');
  const [aguaLitros, setAguaLitros] = useState<string>('2.5');
  const [praticaAtividade, setPraticaAtividade] = useState<boolean>(false);
  const [atividadeDetalhes, setAtividadeDetalhes] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Cálculo de idade automático
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

  // Formatação de WhatsApp
  const handleWhatsappChange = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 11) {
      let formatted = raw;
      if (raw.length > 2) {
        formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
      }
      if (raw.length > 7) {
        formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
      }
      setWhatsapp(formatted);
    }
  };

  // Cálculo de IMC automático a partir de peso (kg) e altura (cm ou m)
  const imcCalculado = useMemo(() => {
    const p = parseFloat(peso.replace(',', '.'));
    let a = parseFloat(altura.replace(',', '.'));
    if (!p || !a || isNaN(p) || isNaN(a)) return null;

    // Se altura foi digitada em centímetros (ex: 175), converte para metros (1.75)
    if (a > 3) {
      a = a / 100;
    }
    if (a <= 0) return null;

    const imcValue = p / (a * a);
    return Number(imcValue.toFixed(2));
  }, [peso, altura]);

  const imcClassificacao = useMemo(() => {
    if (!imcCalculado) return null;
    if (imcCalculado < 18.5) return { label: 'Abaixo do peso', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (imcCalculado < 24.9) return { label: 'Peso ideal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (imcCalculado < 29.9) return { label: 'Sobrepeso', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (imcCalculado < 34.9) return { label: 'Obesidade Grau I', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    if (imcCalculado < 39.9) return { label: 'Obesidade Grau II', color: 'text-red-600 bg-red-50 border-red-200' };
    return { label: 'Obesidade Grau III', color: 'text-red-700 bg-red-100 border-red-300' };
  }, [imcCalculado]);

  // Conversão de números/textos em formato de horário (ex: 6 -> 06:00, 630 -> 06:30, 2230 -> 22:30)
  const formatTimeField = (input: string): string => {
    const cleaned = input.replace(/\D/g, '');
    if (!cleaned) return input;
    if (cleaned.length === 1) return `0${cleaned}:00`;
    if (cleaned.length === 2) {
      const num = parseInt(cleaned, 10);
      if (num < 24) return `${cleaned.padStart(2, '0')}:00`;
      return input;
    }
    if (cleaned.length === 3) {
      const h = cleaned.slice(0, 1).padStart(2, '0');
      const m = cleaned.slice(1, 3);
      return `${h}:${m}`;
    }
    if (cleaned.length === 4) {
      const h = cleaned.slice(0, 2);
      const m = cleaned.slice(2, 4);
      return `${h}:${m}`;
    }
    return input;
  };

  const toggleArrayItem = (list: string[], item: string, setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // O único campo obrigatório é o nome completo
    if (!nome.trim()) {
      setActiveTab('pessoal');
      setErrorMessage('Por favor, informe o nome completo do paciente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const pesoNum = peso ? parseFloat(peso.replace(',', '.')) : undefined;
      let alturaNum = altura ? parseFloat(altura.replace(',', '.')) : undefined;
      // Padroniza altura em cm se foi digitada como metros
      if (alturaNum && alturaNum < 3) {
        alturaNum = alturaNum * 100;
      }

      const aguaNum = aguaLitros ? parseFloat(aguaLitros.replace(',', '.')) : undefined;
      const refeicoesNum = refeicoesDia ? parseInt(refeicoesDia, 10) : undefined;

      const pacienteData: Omit<Paciente, 'id' | 'created_at'> = {
        nutricionista_id: user.id,
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
        horario_acorda: formatTimeField(horarioAcordaInput),
        horario_dorme: formatTimeField(horarioDormeInput),
        agua_litros: aguaNum,
        pratica_atividade: praticaAtividade,
        atividade_detalhes: praticaAtividade ? atividadeDetalhes.trim() : undefined,
        observacoes: observacoes.trim() || undefined
      };

      const savedPaciente = await createPaciente(pacienteData);
      setSuccessToast(true);

      // Redireciona para o perfil do paciente recém-cadastrado
      setTimeout(() => {
        onSuccess(savedPaciente);
      }, 700);

    } catch (err: any) {
      console.error('Erro ao salvar paciente:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao salvar o paciente. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Topo com Botão Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 px-3 text-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Novo Paciente
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Preencha os dados cadastrais, clínicos e hábitos do seu paciente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 px-4 text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="h-10 px-5 text-xs shadow-md shadow-emerald-600/20"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Salvar Paciente
          </Button>
        </div>
      </div>

      {/* Alerta de Sucesso */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="text-sm font-medium">
            Paciente cadastrado com sucesso! Redirecionando para o perfil...
          </div>
        </div>
      )}

      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="text-sm font-medium">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Formulário com Abas */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Navegação de Abas */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pessoal')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pessoal'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'pessoal' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>1. Pessoal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clinico')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'clinico'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Activity className={`w-4 h-4 ${activeTab === 'clinico' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>2. Clínico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('habitos')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'habitos'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === 'habitos' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>3. Hábitos</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* ======================================================== */}
          {/* ABA 1 — PESSOAL */}
          {/* ======================================================== */}
          {activeTab === 'pessoal' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-800">Informações Pessoais</h3>
                <p className="text-xs text-slate-500">Dados básicos de identificação e contato do paciente.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome Completo (Obrigatório) */}
                <div className="md:col-span-2">
                  <Input
                    id="paciente-nome"
                    label="Nome completo *"
                    placeholder="Ex: Maria Clara dos Santos"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    icon={<User className="w-4 h-4" />}
                    required
                  />
                </div>

                {/* Data de Nascimento & Idade */}
                <div className="space-y-1.5">
                  <label htmlFor="paciente-nascimento" className="block text-sm font-medium text-slate-700">
                    Data de nascimento
                  </label>
                  <div className="relative">
                    <input
                      id="paciente-nascimento"
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                  {idadeCalculada !== null && (
                    <p className="text-xs text-emerald-700 font-semibold mt-1 bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-100">
                      Idade: {idadeCalculada} anos
                    </p>
                  )}
                </div>

                {/* Sexo */}
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

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <Input
                    id="paciente-whatsapp"
                    label="WhatsApp"
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    icon={<Phone className="w-4 h-4" />}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Input
                    id="paciente-email"
                    type="email"
                    label="Email"
                    placeholder="paciente@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setActiveTab('clinico')}
                  className="h-10 text-xs"
                >
                  Avançar para Clínico
                  <Activity className="w-3.5 h-3.5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2 — CLÍNICO */}
          {/* ======================================================== */}
          {activeTab === 'clinico' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-800">Avaliação Clínica & Objetivos</h3>
                <p className="text-xs text-slate-500">Antropometria, patologias, restrições e objetivos nutricionais.</p>
              </div>

              {/* Antropometria & IMC */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  Antropometria Inicial
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Peso */}
                  <div className="space-y-1.5">
                    <label htmlFor="paciente-peso" className="block text-xs font-semibold text-slate-700">
                      Peso atual
                    </label>
                    <div className="relative">
                      <input
                        id="paciente-peso"
                        type="text"
                        placeholder="Ex: 72.5"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Altura */}
                  <div className="space-y-1.5">
                    <label htmlFor="paciente-altura" className="block text-xs font-semibold text-slate-700">
                      Altura
                    </label>
                    <div className="relative">
                      <input
                        id="paciente-altura"
                        type="text"
                        placeholder="Ex: 175"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  {/* IMC Calculado (Somente Leitura) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      IMC (Automático)
                    </label>
                    <div className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 flex items-center justify-between shadow-sm">
                      <span className="text-sm font-bold text-slate-800">
                        {imcCalculado !== null ? `${imcCalculado} kg/m²` : '—'}
                      </span>
                      {imcClassificacao && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${imcClassificacao.color}`}>
                          {imcClassificacao.label}
                        </span>
                      )}
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
                <div className="mt-2">
                  <Input
                    id="paciente-objetivo-texto"
                    placeholder="Outro objetivo ou observação específica sobre as metas..."
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                  />
                </div>
              </div>

              {/* Nível de Atividade Física */}
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

              {/* Patologias ou Condições de Saúde */}
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
                      placeholder="Adicionar outras patologias ou condições..."
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

              {/* Alergias Alimentares */}
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
                  <label htmlFor="paciente-medicamentos" className="block text-xs font-semibold text-slate-700">
                    Medicamentos contínuos
                  </label>
                  <textarea
                    id="paciente-medicamentos"
                    rows={2}
                    placeholder="Ex: Losartana 50mg (1x ao dia)..."
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="paciente-suplementos" className="block text-xs font-semibold text-slate-700">
                    Suplementos em uso
                  </label>
                  <textarea
                    id="paciente-suplementos"
                    rows={2}
                    placeholder="Ex: Creatina 5g, Vitamina D 2000UI..."
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('pessoal')}
                  className="h-10 text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                  Voltar para Pessoal
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('habitos')}
                  className="h-10 text-xs"
                >
                  Avançar para Hábitos
                  <Clock className="w-3.5 h-3.5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3 — HÁBITOS */}
          {/* ======================================================== */}
          {activeTab === 'habitos' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-800">Rotina & Hábitos Diários</h3>
                <p className="text-xs text-slate-500">Horários, consumo hídrico, atividades físicas e anotações gerais.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Refeições por dia */}
                <div className="space-y-1.5">
                  <label htmlFor="paciente-refeicoes" className="block text-xs font-semibold text-slate-700">
                    Refeições por dia
                  </label>
                  <input
                    id="paciente-refeicoes"
                    type="number"
                    min="1"
                    max="10"
                    value={refeicoesDia}
                    onChange={(e) => setRefeicoesDia(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  />
                </div>

                {/* Horário que acorda */}
                <div className="space-y-1.5">
                  <label htmlFor="paciente-acorda" className="block text-xs font-semibold text-slate-700">
                    Horário que acorda
                  </label>
                  <input
                    id="paciente-acorda"
                    type="text"
                    placeholder="Ex: 6 ou 06:30"
                    value={horarioAcordaInput}
                    onChange={(e) => setHorarioAcordaInput(e.target.value)}
                    onBlur={(e) => setHorarioAcordaInput(formatTimeField(e.target.value))}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  />
                </div>

                {/* Horário que dorme */}
                <div className="space-y-1.5">
                  <label htmlFor="paciente-dorme" className="block text-xs font-semibold text-slate-700">
                    Horário que dorme
                  </label>
                  <input
                    id="paciente-dorme"
                    type="text"
                    placeholder="Ex: 23 ou 23:30"
                    value={horarioDormeInput}
                    onChange={(e) => setHorarioDormeInput(e.target.value)}
                    onBlur={(e) => setHorarioDormeInput(formatTimeField(e.target.value))}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  />
                </div>

                {/* Quantidade de água */}
                <div className="space-y-1.5">
                  <label htmlFor="paciente-agua" className="block text-xs font-semibold text-slate-700">
                    Água por dia
                  </label>
                  <div className="relative">
                    <input
                      id="paciente-agua"
                      type="text"
                      placeholder="Ex: 2.5"
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

              {/* Pratica Atividade Física */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Pratica atividade física?</h4>
                    <p className="text-xs text-slate-500">Exercícios regulares, treinos ou esportes.</p>
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
                      id="paciente-atividade-detalhes"
                      label="Qual atividade e frequência semanal?"
                      placeholder="Ex: Musculação 4x na semana e corrida 2x..."
                      value={atividadeDetalhes}
                      onChange={(e) => setAtividadeDetalhes(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div className="space-y-1.5">
                <label htmlFor="paciente-observacoes" className="block text-sm font-semibold text-slate-800">
                  Observações gerais
                </label>
                <textarea
                  id="paciente-observacoes"
                  rows={4}
                  placeholder="Anotações adicionais sobre preferências, histórico familiar, estilo de vida..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('clinico')}
                  className="h-10 text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                  Voltar para Clínico
                </Button>

                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="h-10 px-6 text-xs shadow-md shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Paciente
                </Button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
