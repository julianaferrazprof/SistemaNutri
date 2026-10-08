import React, { useState } from 'react';
import {
  X,
  Calendar,
  Save,
  AlertCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button } from './ui/Button';
import { updateConsulta, deleteConsulta, type ConsultaItem } from '../services/pacientes';

interface EditarConsultaModalProps {
  consulta: ConsultaItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: ConsultaItem) => void;
  onDeleted: (id: string) => void;
}

export const EditarConsultaModal: React.FC<EditarConsultaModalProps> = ({
  consulta,
  isOpen,
  onClose,
  onUpdated,
  onDeleted
}) => {
  const [dataConsulta, setDataConsulta] = useState(consulta.data_consulta);
  const [peso, setPeso] = useState(consulta.peso !== undefined ? String(consulta.peso) : '');
  const [cintura, setCintura] = useState(consulta.cintura !== undefined ? String(consulta.cintura) : '');
  const [quadril, setQuadril] = useState(consulta.quadril !== undefined ? String(consulta.quadril) : '');
  const [percentualGordura, setPercentualGordura] = useState(
    consulta.percentual_gordura !== undefined ? String(consulta.percentual_gordura) : ''
  );
  const [observacoes, setObservacoes] = useState(consulta.observacoes || '');
  const [proximoRetorno, setProximoRetorno] = useState(consulta.proximo_retorno || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!dataConsulta) {
      setErrorMessage('Por favor, informe a data da consulta.');
      return;
    }

    const pesoNum = peso ? parseFloat(peso.replace(',', '.')) : undefined;
    if (peso && (isNaN(pesoNum!) || pesoNum! <= 0)) {
      setErrorMessage('Informe um peso válido.');
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        data_consulta: dataConsulta,
        peso: pesoNum,
        cintura: cintura ? parseFloat(cintura.replace(',', '.')) : undefined,
        quadril: quadril ? parseFloat(quadril.replace(',', '.')) : undefined,
        percentual_gordura: percentualGordura ? parseFloat(percentualGordura.replace(',', '.')) : undefined,
        observacoes: observacoes.trim() || undefined,
        proximo_retorno: proximoRetorno || undefined
      };
      const updated = await updateConsulta(consulta.id, updates);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConsulta(consulta.id);
      onDeleted(consulta.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao excluir consulta. Tente novamente.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Editar Consulta</h2>
              <p className="text-xs text-slate-500">
                {new Date(consulta.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
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

          {/* Confirmação de exclusão inline */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs font-semibold">Confirmar exclusão desta consulta?</p>
              </div>
              <p className="text-xs text-red-600">
                Esta ação é irreversível. Todos os dados desta consulta serão removidos permanentemente.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-9 text-xs"
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 h-9 px-4 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white border border-red-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {isDeleting ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Sim, excluir
                </button>
              </div>
            </div>
          )}

          {/* Data da Consulta */}
          <div className="space-y-1.5">
            <label htmlFor="edit-consulta-data" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Data da consulta *
            </label>
            <input
              id="edit-consulta-data"
              type="date"
              value={dataConsulta}
              onChange={(e) => setDataConsulta(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
              required
            />
          </div>

          {/* Peso e % Gordura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-consulta-peso" className="block text-xs font-semibold text-slate-700">
                Peso atual
              </label>
              <div className="relative">
                <input
                  id="edit-consulta-peso"
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

            <div className="space-y-1.5">
              <label htmlFor="edit-consulta-gordura" className="block text-xs font-semibold text-slate-700">
                % de Gordura (opcional)
              </label>
              <div className="relative">
                <input
                  id="edit-consulta-gordura"
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
            <div className="space-y-1.5">
              <label htmlFor="edit-consulta-cintura" className="block text-xs font-semibold text-slate-700">
                Cintura (opcional)
              </label>
              <div className="relative">
                <input
                  id="edit-consulta-cintura"
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

            <div className="space-y-1.5">
              <label htmlFor="edit-consulta-quadril" className="block text-xs font-semibold text-slate-700">
                Quadril (opcional)
              </label>
              <div className="relative">
                <input
                  id="edit-consulta-quadril"
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
            <label htmlFor="edit-consulta-retorno" className="block text-xs font-semibold text-slate-700">
              Próximo retorno
            </label>
            <input
              id="edit-consulta-retorno"
              type="date"
              value={proximoRetorno}
              onChange={(e) => setProximoRetorno(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label htmlFor="edit-consulta-obs" className="block text-xs font-semibold text-slate-700">
              Observações e metas
            </label>
            <textarea
              id="edit-consulta-obs"
              rows={3}
              placeholder="Evolução clínica, adesão ao plano, novas recomendações..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Rodapé */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {/* Excluir à esquerda */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={showDeleteConfirm || isSaving}
              className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir consulta
            </button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
                className="h-10 text-xs px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isSaving}
                className="h-10 text-xs px-5 shadow-md shadow-emerald-600/20"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Salvar alterações
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
