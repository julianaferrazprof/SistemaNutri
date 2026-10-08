import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { Button } from './ui/Button';
import { createConsulta, type ConsultaItem } from '../services/pacientes';

interface NovaConsultaModalProps {
  pacienteId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (consulta: ConsultaItem) => void;
}

export const NovaConsultaModal: React.FC<NovaConsultaModalProps> = ({
  pacienteId,
  isOpen,
  onClose,
  onSuccess
}) => {
  // Data preenchida automaticamente com hoje no formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const [dataConsulta, setDataConsulta] = useState(todayStr);
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const pesoNum = peso ? parseFloat(peso.replace(',', '.')) : undefined;
    const cinturaNum = cintura ? parseFloat(cintura.replace(',', '.')) : undefined;
    const quadrilNum = quadril ? parseFloat(quadril.replace(',', '.')) : undefined;
    const gorduraNum = percentualGordura ? parseFloat(percentualGordura.replace(',', '.')) : undefined;

    if (!dataConsulta) {
      setErrorMessage('Por favor, informe a data da consulta.');
      return;
    }

    if (peso && (isNaN(pesoNum!) || pesoNum! <= 0)) {
      setErrorMessage('Por favor, informe um peso válido.');
      return;
    }

    setIsLoading(true);
    try {
      const novaConsulta = await createConsulta({
        paciente_id: pacienteId,
        data_consulta: dataConsulta,
        peso: pesoNum,
        cintura: cinturaNum,
        quadril: quadrilNum,
        percentual_gordura: gorduraNum,
        observacoes: observacoes.trim() || undefined,
        proximo_retorno: proximoRetorno || undefined
      });

      onSuccess(novaConsulta);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar consulta:', err);
      setErrorMessage(err.message || 'Erro ao registrar consulta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Nova Consulta
              </h2>
              <p className="text-xs text-slate-500">
                Registre as medições antropométricas e notas da consulta.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Data da Consulta */}
          <div className="space-y-1.5">
            <label htmlFor="consulta-data" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Data da consulta *
            </label>
            <input
              id="consulta-data"
              type="date"
              value={dataConsulta}
              onChange={(e) => setDataConsulta(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
              required
            />
          </div>

          {/* Peso e % Gordura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Peso */}
            <div className="space-y-1.5">
              <label htmlFor="consulta-peso" className="block text-xs font-semibold text-slate-700">
                Peso atual
              </label>
              <div className="relative">
                <input
                  id="consulta-peso"
                  type="text"
                  placeholder="Ex: 70.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>

            {/* % de Gordura */}
            <div className="space-y-1.5">
              <label htmlFor="consulta-gordura" className="block text-xs font-semibold text-slate-700">
                % de Gordura (opcional)
              </label>
              <div className="relative">
                <input
                  id="consulta-gordura"
                  type="text"
                  placeholder="Ex: 22.4"
                  value={percentualGordura}
                  onChange={(e) => setPercentualGordura(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Cintura e Quadril */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cintura */}
            <div className="space-y-1.5">
              <label htmlFor="consulta-cintura" className="block text-xs font-semibold text-slate-700">
                Cintura (opcional)
              </label>
              <div className="relative">
                <input
                  id="consulta-cintura"
                  type="text"
                  placeholder="Ex: 78"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            {/* Quadril */}
            <div className="space-y-1.5">
              <label htmlFor="consulta-quadril" className="block text-xs font-semibold text-slate-700">
                Quadril (opcional)
              </label>
              <div className="relative">
                <input
                  id="consulta-quadril"
                  type="text"
                  placeholder="Ex: 102"
                  value={quadril}
                  onChange={(e) => setQuadril(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>
          </div>

          {/* Próximo Retorno */}
          <div className="space-y-1.5">
            <label htmlFor="consulta-retorno" className="block text-xs font-semibold text-slate-700">
              Próximo retorno
            </label>
            <input
              id="consulta-retorno"
              type="date"
              value={proximoRetorno}
              onChange={(e) => setProximoRetorno(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label htmlFor="consulta-obs" className="block text-xs font-semibold text-slate-700">
              Observações e metas
            </label>
            <textarea
              id="consulta-obs"
              rows={3}
              placeholder="Evolução clínica, adesão ao plano, novas recomendações..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Rodapé com botões de ação */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 text-xs px-4"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="h-10 text-xs px-5 shadow-md shadow-emerald-600/20"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Salvar consulta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
