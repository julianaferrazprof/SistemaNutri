import React, { useEffect, useState } from 'react';
import { getSession, clearSession, type Nutricionista } from './services/auth';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { Dashboard } from './components/Dashboard';
import { PacientesScreen } from './components/PacientesScreen';
import { Sidebar } from './components/Sidebar';

type Screen = 'login' | 'register' | 'app';
type AppTab = 'dashboard' | 'pacientes';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Nutricionista | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Verifica sessão ativa ao carregar a aplicação
    const activeSession = getSession();
    if (activeSession) {
      setCurrentUser(activeSession);
      setCurrentScreen('app');
    } else {
      setCurrentScreen('login');
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (nutri: Nutricionista) => {
    setCurrentUser(nutri);
    setCurrentScreen('app');
    setCurrentTab('dashboard');
  };

  const handleRegisterSuccess = (nutri: Nutricionista) => {
    setCurrentUser(nutri);
    setCurrentScreen('app');
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setCurrentScreen('login');
    setSelectedPacienteId(null);
  };

  const handleSelectPaciente = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setCurrentTab('pacientes');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se o usuário estiver logado, exibe o Layout com Sidebar Fixa e Conteúdo
  if (currentUser && currentScreen === 'app') {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        {/* Menu Lateral Fixo */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab !== 'pacientes') {
              setSelectedPacienteId(null);
            }
          }}
          user={currentUser}
          onLogout={handleLogout}
        />

        {/* Área Principal com espaçamento para Sidebar e Navbar Mobile */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
            {currentTab === 'dashboard' ? (
              <Dashboard
                user={currentUser}
                onNavigateToPacientes={() => {
                  setSelectedPacienteId(null);
                  setCurrentTab('pacientes');
                }}
                onSelectPaciente={handleSelectPaciente}
              />
            ) : (
              <PacientesScreen
                user={currentUser}
                selectedPacienteId={selectedPacienteId}
                onClearSelectedPaciente={() => setSelectedPacienteId(null)}
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, exibe a tela de Login ou Cadastro
  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onSuccess={handleRegisterSuccess}
        onNavigateToLogin={() => setCurrentScreen('login')}
      />
    );
  }

  return (
    <LoginScreen
      onSuccess={handleLoginSuccess}
      onNavigateToRegister={() => setCurrentScreen('register')}
    />
  );
};

export default App;
