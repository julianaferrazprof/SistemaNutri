import React, { useState } from 'react';
import { Logo } from './Logo';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import type { Nutricionista } from '../services/auth';

interface SidebarProps {
  currentTab: 'dashboard' | 'pacientes';
  onSelectTab: (tab: 'dashboard' | 'pacientes') => void;
  user: Nutricionista;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined
    },
    {
      id: 'pacientes' as const,
      label: 'Pacientes',
      icon: Users,
      badge: undefined
    }
  ];

  return (
    <>
      {/* Botão Hambúrguer Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 px-4 flex items-center justify-between">
        <Logo size="sm" />
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop Mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Menu Lateral Fixo */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Topo com Logo */}
        <div className="h-20 px-6 flex items-center border-b border-slate-100">
          <Logo size="md" />
        </div>

        {/* Navegação Principal */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navegação Principal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full group flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'
                  }`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-200" />}
              </button>
            );
          })}
        </div>

        {/* Card Pro / Status da Prática */}
        <div className="p-4 mx-4 mb-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-100 text-left">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sistema Nutri</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Gestão clínica inteligente e conexão em tempo real com Neon Database.
          </p>
        </div>

        {/* Perfil e Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'N'}
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-semibold text-slate-800 truncate" title={user.nome}>
                  {user.nome}
                </p>
                <p className="text-[11px] text-slate-500 truncate" title={user.email}>
                  {user.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Encerrar sessão"
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0 focus:outline-none"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
