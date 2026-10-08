import React, { useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { ConsultaItem } from '../services/pacientes';

interface EvolucaoPesoChartProps {
  consultas: ConsultaItem[];
  pesoInicial?: number;
}

interface PointData {
  label: string;
  data: string;
  peso: number;
}

export const EvolucaoPesoChart: React.FC<EvolucaoPesoChartProps> = ({ consultas, pesoInicial }) => {
  // Ordena da consulta mais antiga para a mais recente para o gráfico temporal da esquerda para a direita
  const dataPoints: PointData[] = useMemo(() => {
    const valid = consultas
      .filter(c => typeof c.peso === 'number' && !isNaN(c.peso) && c.peso > 0)
      .map(c => ({
        label: new Date(c.data_consulta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        data: c.data_consulta,
        peso: Number(c.peso)
      }))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    return valid;
  }, [consultas]);

  if (dataPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <TrendingDown className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700">Nenhuma consulta registrada ainda</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Registre a primeira consulta do paciente para começar a visualizar a linha de evolução de peso e metas atingidas.
        </p>
      </div>
    );
  }

  // Cálculos de variação de peso
  const primeiroPeso = pesoInicial || dataPoints[0].peso;
  const ultimoPeso = dataPoints[dataPoints.length - 1].peso;
  const diferenca = ultimoPeso - primeiroPeso;
  const isLoss = diferenca < 0;
  const isGain = diferenca > 0;

  // Min / Max para escalonamento SVG
  const pesos = dataPoints.map(p => p.peso);
  const minPeso = Math.floor(Math.min(...pesos) - 2);
  const maxPeso = Math.ceil(Math.max(...pesos) + 2);
  const range = maxPeso - minPeso || 1;

  // Dimensões SVG
  const width = 600;
  const height = 220;
  const paddingX = 45;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingX * 2;

  // Coordenadas dos pontos
  const coords = dataPoints.map((pt, idx) => {
    const x = dataPoints.length === 1 
      ? width / 2 
      : paddingX + (idx / (dataPoints.length - 1)) * chartWidth;
    const y = height - paddingBottom - ((pt.peso - minPeso) / range) * chartHeight;
    return { ...pt, x, y };
  });

  // Linha e área de gradiente SVG
  const pathD = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = coords.length > 0
    ? `${pathD} L ${coords[coords.length - 1].x} ${height - paddingBottom} L ${coords[0].x} ${height - paddingBottom} Z`
    : '';

  // Guias horizontais (3 linhas de referência)
  const gridLines = [
    { value: maxPeso, y: paddingTop },
    { value: Number(((maxPeso + minPeso) / 2).toFixed(1)), y: paddingTop + chartHeight / 2 },
    { value: minPeso, y: height - paddingBottom }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Topo com Estatísticas de Destaque */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            Evolução de Peso
          </h3>
          <p className="text-xs text-slate-500">Histórico de pesagem registrada nas consultas.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">Atual:</span>
            <span className="text-xs font-bold text-slate-800">{ultimoPeso} kg</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs ${
            isLoss 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : isGain 
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            {isLoss && <TrendingDown className="w-3.5 h-3.5" />}
            {isGain && <TrendingUp className="w-3.5 h-3.5" />}
            {!isLoss && !isGain && <Minus className="w-3.5 h-3.5" />}
            <span>
              {diferenca > 0 ? `+${diferenca.toFixed(1)}` : diferenca.toFixed(1)} kg
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico SVG Responsivo */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
            <defs>
              {/* Gradiente da área abaixo da linha */}
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Linhas de Grade e Valores no Eixo Y */}
            {gridLines.map((line, idx) => (
              <g key={idx}>
                <line
                  x1={paddingX - 10}
                  y1={line.y}
                  x2={width - paddingX + 10}
                  y2={line.y}
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                  strokeDasharray={idx === 1 ? "4 4" : "0"}
                />
                <text
                  x={paddingX - 15}
                  y={line.y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  {line.value} kg
                </text>
              </g>
            ))}

            {/* Área Sombreada */}
            {coords.length > 1 && (
              <path d={areaD} fill="url(#weightGradient)" />
            )}

            {/* Linha Principal */}
            {coords.length > 1 && (
              <path
                d={pathD}
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Pontos de dados interativos com etiquetas */}
            {coords.map((pt, idx) => (
              <g key={idx} className="group cursor-pointer">
                {/* Halo do Ponto no Hover */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="8"
                  fill="#10b981"
                  fillOpacity="0.2"
                  className="transition-all group-hover:r-10"
                />
                {/* Ponto Central */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#059669"
                  strokeWidth="3"
                />

                {/* Badge com o Valor do Peso acima do ponto */}
                <g transform={`translate(${pt.x}, ${pt.y - 12})`}>
                  <rect
                    x="-20"
                    y="-18"
                    width="40"
                    height="16"
                    rx="4"
                    fill="#0f172a"
                    className="opacity-90"
                  />
                  <text
                    x="0"
                    y="-6"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#ffffff"
                  >
                    {pt.peso}k
                  </text>
                </g>

                {/* Data no Eixo X */}
                <text
                  x={pt.x}
                  y={height - paddingBottom + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#64748b"
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
