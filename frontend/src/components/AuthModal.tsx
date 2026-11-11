import React, { useState } from 'react';
import { User } from '../types';
import { api, ApiError } from '../services/api';
import { BookOpen, Eye, EyeOff, Info, ArrowRight, X, UserCheck, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regTurma, setRegTurma] = useState('Turma 3B');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(loginUsername, loginPassword);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível conectar ao servidor. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({
        full_name: regFullName,
        username: regUsername,
        password: regPassword,
        password_confirm: regPasswordConfirm,
        turma: regTurma,
      });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Erro ao criar conta de aluno. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-[#eae8e3]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#414942] flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner Header */}
        <div className="bg-gradient-to-br from-[#002715] to-[#003b21] p-7 md:p-8 text-white relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#8ec4a0]" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">Receituário</span>
            </div>

            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/15 text-[#8ec4a0]">
              CADERNO COLETIVO
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-2">
            Cada prato tem seu clima.
          </h2>
          <p className="text-xs sm:text-sm text-[#8ec4a0]">
            {activeTab === 'login'
              ? 'Acesse sua bancada e compartilhe novas receitas com a turma.'
              : 'Cadastre-se para catalogar e cozinhar coletivamente.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="p-6 md:p-8">
          <div className="bg-[#f0eee9] p-1 rounded-full flex max-w-xs mx-auto mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                activeTab === 'login'
                  ? 'bg-[#003b21] text-white shadow-xs'
                  : 'text-[#414942] hover:text-[#1b1c19]'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                activeTab === 'register'
                  ? 'bg-[#003b21] text-white shadow-xs'
                  : 'text-[#414942] hover:text-[#1b1c19]'
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-[#fce8e6] border border-[#ffdad6] text-[#ba1a1a] rounded-xl text-xs font-medium animate-shake">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#1b1c19]">Nome de usuário</label>
                  <span className="text-[11px] text-[#717972]">obrigatório</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="seu.usuario ou @usuario"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] outline-hidden text-sm bg-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#1b1c19]">Senha</label>
                  <span className="text-[11px] text-[#717972]">mínimo 8 dígitos</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] outline-hidden text-sm bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717972] hover:text-[#1b1c19]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 bg-[#003b21] hover:bg-[#1e5236] text-white rounded-full font-bold text-sm flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
              >
                <span>{loading ? 'Entrando...' : 'Entrar na Cozinha'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Password assistance callout */}
              <div className="mt-4 p-3.5 bg-[#f5f3ee] rounded-2xl flex items-start space-x-2.5 text-xs text-[#414942]">
                <Info className="w-4 h-4 text-[#003b21] shrink-0 mt-0.5" />
                <p>
                  Esqueceu a senha? Peça ao <strong>administrador da turma</strong> para redefinir.
                </p>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beatriz Albuquerque"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] outline-hidden text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                    Nome de usuário
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@beatriz.albuquerque"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] outline-hidden text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                    Turma de Gastronomia
                  </label>
                  <input
                    type="text"
                    placeholder="Turma 3B"
                    value={regTurma}
                    onChange={(e) => setRegTurma(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] outline-hidden text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                  Senha (mínimo 8 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] outline-hidden text-sm bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717972] hover:text-[#1b1c19]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Repita sua senha"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c0c9c0] focus:border-[#003b21] focus:ring-1 focus:ring-[#003b21] outline-hidden text-sm bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717972] hover:text-[#1b1c19]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 bg-[#003b21] hover:bg-[#1e5236] text-white rounded-full font-bold text-sm flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
              >
                <span>{loading ? 'Cadastrando...' : 'Criar conta'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-[#717972] text-center mt-2 leading-relaxed">
                Ao se cadastrar, você concorda com o respeito às receitas autorais compartilhadas na comunidade acadêmica.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
