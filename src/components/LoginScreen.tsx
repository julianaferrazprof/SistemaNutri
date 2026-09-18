import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { loginNutricionista, type Nutricionista } from '../services/auth';

interface LoginScreenProps {
  onSuccess: (nutri: Nutricionista) => void;
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = 'Informe seu e-mail.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Digite um e-mail válido.';
    }

    if (!password) {
      errs.password = 'Informe sua senha.';
    } else if (password.length < 9) {
      errs.password = 'A senha deve ter no mínimo 9 caracteres.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const nutri = await loginNutricionista(email, password);
      onSuccess(nutri);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao tentar fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Elementos visuais de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Topo com Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" className="mb-3" />
          <p className="text-slate-500 text-sm font-medium">
            Plataforma de gestão clínica para nutricionistas
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bem-vindo(a) de volta!</h1>
            <p className="text-slate-500 text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-700 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login-email"
              type="email"
              label="E-mail profissional"
              placeholder="exemplo@nutri.com.br"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }));
              }}
              error={validationErrors.email}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />

            <Input
              id="login-password"
              type="password"
              label="Senha"
              placeholder="Mínimo 9 caracteres"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: undefined }));
              }}
              error={validationErrors.password}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="w-full mt-2 font-semibold shadow-emerald-500/25"
              isLoading={isLoading}
            >
              Entrar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Não tem conta?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors ml-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded"
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </div>

        {/* Rodapé institucional */}
        <div className="text-center mt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} NutriSmart. Cuidado e precisão para sua prática clínica.
        </div>
      </div>
    </div>
  );
};
