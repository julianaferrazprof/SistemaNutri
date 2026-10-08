import React, { useState } from "react";
import {
  X,
  Sparkles,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Coffee,
  Apple,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "./ui/Button";
import { createPlanoAlimentar, type Paciente, type PlanoAlimentarItem } from "../services/pacientes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Refeicoes {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

interface DiaPlano {
  dia: string;
  refeicoes: Refeicoes;
}

interface PlanoSemanal {
  plano_semanal: DiaPlano[];
}

interface GerarPlanoModalProps {
  paciente: Paciente;
  isOpen: boolean;
  onClose: () => void;
  onPlanoSalvo: (novoPlano: PlanoAlimentarItem) => void;
}

// ─── Loading Messages ─────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Buscando dados do paciente...",
  "IA analisando perfil nutricional...",
  "Calculando necessidades calóricas...",
  "Montando cardápio semanal...",
  "Adaptando às restrições alimentares...",
  "Finalizando plano personalizado...",
];

// ─── Refeicao Config ──────────────────────────────────────────────────────────

const REFEICOES_CONFIG: {
  key: keyof Refeicoes;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: "cafe_da_manha", label: "Café da Manhã", icon: <Coffee className="w-4 h-4" />, color: "text-amber-600" },
  { key: "lanche_manha", label: "Lanche da Manhã", icon: <Apple className="w-4 h-4" />, color: "text-green-600" },
  { key: "almoco", label: "Almoço", icon: <UtensilsCrossed className="w-4 h-4" />, color: "text-emerald-700" },
  { key: "lanche_tarde", label: "Lanche da Tarde", icon: <Sun className="w-4 h-4" />, color: "text-orange-500" },
  { key: "jantar", label: "Jantar", icon: <Moon className="w-4 h-4" />, color: "text-indigo-600" },
];

// ─── Helper: Build patient context string ──────────────────────────────────────

function buildDadosPaciente(paciente: Paciente): string {
  const linhas: string[] = [];

  linhas.push(`Nome: ${paciente.nome}`);
  if (paciente.sexo) linhas.push(`Sexo: ${paciente.sexo}`);
  if (paciente.peso_inicial) linhas.push(`Peso: ${paciente.peso_inicial} kg`);
  if (paciente.altura) linhas.push(`Altura: ${paciente.altura} cm`);
  if (paciente.imc) linhas.push(`IMC: ${paciente.imc}`);
  if (paciente.nivel_atividade) linhas.push(`Nivel de atividade: ${paciente.nivel_atividade}`);

  if (paciente.objetivos && paciente.objetivos.length > 0) {
    linhas.push(`Objetivos: ${paciente.objetivos.join(", ")}`);
  }
  if (paciente.objetivo_texto) linhas.push(`Objetivo adicional: ${paciente.objetivo_texto}`);

  const patologias = [
    ...(paciente.patologias?.filter((p) => p !== "Nenhum") || []),
    ...(paciente.patologias_outras ? [paciente.patologias_outras] : []),
  ];
  if (patologias.length > 0) linhas.push(`Patologias/condicoes: ${patologias.join(", ")}`);

  const restricoes = [
    ...(paciente.restricoes?.filter((r) => r !== "Nenhum") || []),
    ...(paciente.restricoes_outras ? [paciente.restricoes_outras] : []),
  ];
  if (restricoes.length > 0) linhas.push(`Restricoes alimentares: ${restricoes.join(", ")}`);

  const alergias = [
    ...(paciente.alergias?.filter((a) => a !== "Nenhum") || []),
    ...(paciente.alergias_outras ? [paciente.alergias_outras] : []),
  ];
  if (alergias.length > 0) linhas.push(`Alergias alimentares: ${alergias.join(", ")}`);

  if (paciente.medicamentos) linhas.push(`Medicamentos: ${paciente.medicamentos}`);
  if (paciente.suplementos) linhas.push(`Suplementos: ${paciente.suplementos}`);
  if (paciente.refeicoes_dia) linhas.push(`Refeicoes por dia preferidas: ${paciente.refeicoes_dia}`);
  if (paciente.horario_acorda) linhas.push(`Horario que acorda: ${paciente.horario_acorda}`);
  if (paciente.horario_dorme) linhas.push(`Horario que dorme: ${paciente.horario_dorme}`);
  if (paciente.agua_litros) linhas.push(`Consumo de agua por dia: ${paciente.agua_litros} litros`);
  if (paciente.pratica_atividade && paciente.atividade_detalhes) {
    linhas.push(`Atividade fisica: ${paciente.atividade_detalhes}`);
  }
  if (paciente.observacoes) linhas.push(`Observacoes gerais: ${paciente.observacoes}`);

  return linhas.join("\n");
}

// ─── Component ────────────────────────────────────────────────────────────────

export const GerarPlanoModal: React.FC<GerarPlanoModalProps> = ({
  paciente,
  isOpen,
  onClose,
  onPlanoSalvo,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [planoGerado, setPlanoGerado] = useState<PlanoSemanal | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Manual / Fallback Plan Generator ─────────────────────────────────────

  const handleCriarPlanoManual = () => {
    const DIAS = [
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
      "Domingo",
    ];

    const planoManual: PlanoSemanal = {
      plano_semanal: DIAS.map((dia) => ({
        dia,
        refeicoes: {
          cafe_da_manha: [
            "1 fatia de pão integral com ovos mexidos",
            "1 xícara de café preto ou chá sem açúcar",
            "1 porção de fruta da estação (mamão, maçã ou banana)",
            "1 copo de iogurte natural desnatado",
            "1 colher de sopa de sementes de chia ou aveia",
          ],
          lanche_manha: [
            "1 fruta fresca da época",
            "1 punhado pequeno de castanhas ou nozes (15g)",
            "1 copo de água de coco natural",
            "1 fatia de queijo branco magro",
            "1 xícara de chá verde ou camomila",
          ],
          almoco: [
            "1 prato de salada crua variada (alface, tomate, cenoura ralada)",
            "3 colheres de sopa de arroz integral ou tubérculo cozido",
            "1 concha pequena de feijão carioca ou lentilha",
            "1 filé de peito de frango grelhado ou peixe (120g)",
            "Legumes refogados com azeite de oliva extra virgem",
          ],
          lanche_tarde: [
            "1 pote de iogurte natural com 1 colher de farelo de aveia",
            "1 fatia de pão integral com pasta de ricota e orégano",
            "1 porção de frutas vermelhas ou maçã picada com canela",
            "1 xícara de café com leite desnatado ou vegetal",
            "Mix de castanha-de-caju e uvas passas",
          ],
          jantar: [
            "1 prato fundo de sopa de legumes com frango desfiado",
            "Salada de folhas verdes com azeite e gotas de limão",
            "1 omelete de 2 ovos com tomate picado, manjericão e espinafre",
            "1 porção de purê de abóbora cabotiá com carne moída magra",
            "Legumes cozidos no vapor temperados com ervas finas",
          ],
        },
      })),
    };

    setPlanoGerado(planoManual);
    setActiveDayIndex(0);
    showToast("success", "Plano alimentar estruturado criado para edição manual!");
  };

  // ── Gerar Plano ────────────────────────────────────────────────────────────

  const handleGerarPlano = async () => {
    setIsGenerating(true);
    setPlanoGerado(null);
    setActiveDayIndex(0);

    // Cycling loading messages
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[msgIndex]);
    }, 2200);

    try {
      const dados_do_paciente = buildDadosPaciente(paciente);

      const response = await fetch("/api/gerar-plano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dados_do_paciente }),
        signal: AbortSignal.timeout(120000), // 2min timeout
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro desconhecido na API.");
      }

      const data: PlanoSemanal = await response.json();

      // Validate JSON structure
      if (!data.plano_semanal || !Array.isArray(data.plano_semanal)) {
        throw new Error("Resposta da IA fora do formato esperado.");
      }

      setPlanoGerado(data);
    } catch (err: any) {
      clearInterval(interval);
      showToast(
        "error",
        "Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?"
      );
      console.error("[GerarPlanoModal] Erro:", err);
    } finally {
      setIsGenerating(false);
      setLoadingMessage(LOADING_MESSAGES[0]);
    }
  };

  // ── Edit handler ───────────────────────────────────────────────────────────

  const handleEditItem = (
    dayIndex: number,
    refeicaoKey: keyof Refeicoes,
    itemIndex: number,
    value: string
  ) => {
    if (!planoGerado) return;
    const updated = { ...planoGerado };
    updated.plano_semanal = [...updated.plano_semanal];
    updated.plano_semanal[dayIndex] = {
      ...updated.plano_semanal[dayIndex],
      refeicoes: {
        ...updated.plano_semanal[dayIndex].refeicoes,
        [refeicaoKey]: updated.plano_semanal[dayIndex].refeicoes[refeicaoKey].map((item, i) =>
          i === itemIndex ? value : item
        ),
      },
    };
    setPlanoGerado(updated);
  };

  // ── Save Plan ──────────────────────────────────────────────────────────────

  const handleSalvarPlano = async () => {
    if (!planoGerado) return;
    setIsSaving(true);
    try {
      const conteudo = JSON.stringify(planoGerado, null, 2);
      const titulo = `Plano Alimentar IA - ${new Date().toLocaleDateString("pt-BR")}`;
      const saved = await createPlanoAlimentar(paciente.id, conteudo, titulo);
      onPlanoSalvo(saved);
      showToast("success", "Plano alimentar salvo com sucesso!");
      setTimeout(() => {
        onClose();
        setPlanoGerado(null);
      }, 1500);
    } catch (err: any) {
      showToast("error", "Erro ao salvar o plano. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Close ──────────────────────────────────────────────────────────────────

  const handleClose = () => {
    if (isGenerating || isSaving) return;
    onClose();
    setTimeout(() => {
      setPlanoGerado(null);
      setActiveDayIndex(0);
    }, 300);
  };

  if (!isOpen) return null;

  const activeDay = planoGerado?.plano_semanal[activeDayIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-4 flex flex-col">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gerador de Plano Alimentar com IA</h2>
              <p className="text-emerald-100 text-xs mt-0.5">
                Paciente: <strong>{paciente.nome}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating || isSaving}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        {toast && (
          <div
            className={`mx-6 mt-4 p-4 rounded-xl flex items-center justify-between gap-3 animate-fadeIn border ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-xs font-medium leading-relaxed">{toast.message}</p>
            </div>
            {toast.type === "error" && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleGerarPlano}
                  className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold transition-colors"
                >
                  Tentar novamente
                </button>
                <button
                  type="button"
                  onClick={handleCriarPlanoManual}
                  className="px-3 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Plano Manual
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Loading State ─────────────────────────────────────────────── */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-20 px-8 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-slate-800 animate-pulse">{loadingMessage}</p>
                <p className="text-xs text-slate-500">
                  A IA está analisando os dados de <strong>{paciente.nome}</strong> para criar um cardápio personalizado...
                </p>
              </div>
              <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
              </div>
            </div>
          )}

          {/* ── Initial State (no plan yet) ────────────────────────────────── */}
          {!isGenerating && !planoGerado && (
            <div className="p-8 space-y-6">
              {/* Patient Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dados que serão utilizados pela IA
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {paciente.objetivos && paciente.objetivos.length > 0 && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <span className="text-slate-400 block font-medium mb-1">Objetivos</span>
                      <strong className="text-slate-800">{paciente.objetivos.join(", ")}</strong>
                    </div>
                  )}
                  {paciente.peso_inicial && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <span className="text-slate-400 block font-medium mb-1">Peso</span>
                      <strong className="text-slate-800">{paciente.peso_inicial} kg</strong>
                    </div>
                  )}
                  {paciente.nivel_atividade && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <span className="text-slate-400 block font-medium mb-1">Atividade</span>
                      <strong className="text-slate-800">{paciente.nivel_atividade}</strong>
                    </div>
                  )}
                  {paciente.alergias && paciente.alergias.filter((a) => a !== "Nenhum").length > 0 && (
                    <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                      <span className="text-rose-400 block font-medium mb-1">Alergias</span>
                      <strong className="text-rose-700">{paciente.alergias.filter((a) => a !== "Nenhum").join(", ")}</strong>
                    </div>
                  )}
                  {paciente.restricoes && paciente.restricoes.filter((r) => r !== "Nenhum").length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <span className="text-amber-400 block font-medium mb-1">Restrições</span>
                      <strong className="text-amber-700">{paciente.restricoes.filter((r) => r !== "Nenhum").join(", ")}</strong>
                    </div>
                  )}
                  {paciente.patologias && paciente.patologias.filter((p) => p !== "Nenhum").length > 0 && (
                    <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                      <span className="text-teal-400 block font-medium mb-1">Patologias</span>
                      <strong className="text-teal-700">{paciente.patologias.filter((p) => p !== "Nenhum").join(", ")}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center py-4 space-y-4">
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Clique no botão abaixo para que a IA gere um plano alimentar semanal completo e personalizado para <strong>{paciente.nome}</strong>.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={handleGerarPlano}
                    className="h-12 px-8 text-sm shadow-lg shadow-emerald-600/25 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Plano com IA
                  </Button>
                  <button
                    type="button"
                    onClick={handleCriarPlanoManual}
                    className="h-12 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Criar Plano Manual
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Plan Editor ────────────────────────────────────────────────── */}
          {!isGenerating && planoGerado && (
            <div className="p-6 space-y-5">
              {/* Day Tabs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDayIndex((i) => Math.max(0, i - 1))}
                  disabled={activeDayIndex === 0}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 overflow-x-auto">
                  <div className="flex gap-1.5 min-w-max">
                    {planoGerado.plano_semanal.map((dia, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveDayIndex(idx)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                          activeDayIndex === idx
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {dia.dia}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveDayIndex((i) => Math.min(planoGerado.plano_semanal.length - 1, i + 1))}
                  disabled={activeDayIndex === planoGerado.plano_semanal.length - 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Active Day Meals */}
              {activeDay && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-800">{activeDay.dia}</h3>
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      Editavel - ajuste conforme necessario
                    </span>
                  </div>

                  {REFEICOES_CONFIG.map((refeicaoConfig) => {
                    const items = activeDay.refeicoes[refeicaoConfig.key] || [];
                    return (
                      <div
                        key={refeicaoConfig.key}
                        className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-slate-200/80 flex items-center gap-2 bg-white">
                          <span className={refeicaoConfig.color}>{refeicaoConfig.icon}</span>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                            {refeicaoConfig.label}
                          </h4>
                        </div>
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {itemIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) =>
                                  handleEditItem(activeDayIndex, refeicaoConfig.key, itemIdx, e.target.value)
                                }
                                className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Regenerate option */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleGerarPlano}
                  className="text-xs text-slate-500 hover:text-emerald-700 font-medium underline underline-offset-2 transition-colors"
                >
                  Nao gostou? Gerar novo plano com IA
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 p-5 flex items-center justify-between gap-3 bg-white">
          <button
            type="button"
            onClick={handleClose}
            disabled={isGenerating || isSaving}
            className="h-10 px-5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          {planoGerado && (
            <Button
              onClick={handleSalvarPlano}
              isLoading={isSaving}
              className="h-10 px-6 text-xs shadow-md shadow-emerald-600/20"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Plano Alimentar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
