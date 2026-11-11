import React, { useState, useEffect } from 'react';
import { Recipe, User } from '../types';
import { api } from '../services/api';
import { CATEGORY_THEMES, getCategoryTheme } from '../utils/theme';
import {
  LayoutDashboard,
  Users,
  Utensils,
  Palette,
  ArrowLeft,
  Search,
  CheckCircle2,
  EyeOff,
  Eye,
  Trash2,
  KeyRound,
  ShieldAlert,
  Download,
  BookOpen,
  Calendar,
  AlertTriangle,
  UserCheck,
  UserX,
  Plus,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onExit: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onOpenNewRecipe: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onExit,
  onSelectRecipe,
  onOpenNewRecipe,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'users' | 'categories'>('overview');
  const [overviewData, setOverviewData] = useState<any>(null);
  const [adminRecipes, setAdminRecipes] = useState<Recipe[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for moderation
  const [modFilter, setModFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [modSearch, setModSearch] = useState('');

  // Password reset modal
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('Senha12345!');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [overview, recipesData, usersData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminRecipes(),
        api.getAdminUsers(),
      ]);
      setOverviewData(overview);
      setAdminRecipes(recipesData.results);
      setAdminUsers(usersData.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleVisibility = async (recipeId: number | string) => {
    try {
      const res = await api.toggleRecipeVisibility(recipeId);
      setAdminRecipes(prev =>
        prev.map(r => (r.id === recipeId ? { ...r, is_hidden: res.is_hidden } : r))
      );
    } catch {
      alert('Erro ao alterar visibilidade da receita.');
    }
  };

  const handleDeleteRecipe = async (recipeId: number | string) => {
    if (!confirm('Tem certeza que deseja remover permanentemente esta receita do caderno coletivo?')) {
      return;
    }
    try {
      await api.deleteRecipe(recipeId);
      setAdminRecipes(prev => prev.filter(r => r.id !== recipeId));
    } catch {
      alert('Erro ao remover receita.');
    }
  };

  const handleToggleUserActive = async (userId: number | string) => {
    try {
      const res = await api.toggleUserActive(userId);
      setAdminUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, is_active: res.is_active } : u))
      );
    } catch {
      alert('Erro ao alterar status do aluno.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    try {
      const res = await api.resetUserPassword(resetModalUser.id, newPasswordInput);
      setResetSuccessMsg(res.message);
      setTimeout(() => {
        setResetSuccessMsg(null);
        setResetModalUser(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Erro ao redefinir senha');
    }
  };

  // Filter recipes for moderation table
  const filteredModRecipes = adminRecipes.filter(r => {
    if (modFilter === 'visible' && r.is_hidden) return false;
    if (modFilter === 'hidden' && !r.is_hidden) return false;
    if (modSearch) {
      const s = modSearch.toLowerCase();
      return (
        r.title.toLowerCase().includes(s) ||
        r.author.full_name.toLowerCase().includes(s) ||
        r.category.name.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col md:flex-row">
      {/* Dark Green Left Sidebar */}
      <aside className="w-full md:w-64 bg-[#002715] text-white p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Admin Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#8ec4a0]" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight block">
                Receituário
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/15 text-[#8ec4a0]">
                PAINEL ADMIN
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                activeTab === 'overview'
                  ? 'bg-white/15 text-[#8ec4a0]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Visão geral</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                activeTab === 'users'
                  ? 'bg-white/15 text-[#8ec4a0]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuários da Turma</span>
            </button>

            <button
              onClick={() => setActiveTab('moderation')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                activeTab === 'moderation'
                  ? 'bg-white/15 text-[#8ec4a0]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Moderação de Receitas</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                activeTab === 'categories'
                  ? 'bg-white/15 text-[#8ec4a0]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Categorias & Temas</span>
            </button>
          </nav>
        </div>

        {/* Exit back to site */}
        <div className="pt-6 border-t border-white/15 mt-8">
          <button
            onClick={onExit}
            className="flex items-center space-x-2 text-xs font-bold text-white/70 hover:text-[#8ec4a0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao site público</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#003b21]" />
            <span className="text-xs font-bold text-[#717972] uppercase tracking-wider">
              PAINEL PEDAGÓGICO · TURMA DE GASTRONOMIA 2025
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#caec79] text-[#2d3b00]">
              Turma Ativa 2025
            </span>

            <button
              onClick={onOpenNewRecipe}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#003b21] hover:bg-[#1e5236] text-white flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#8ec4a0]" />
              <span>Nova Receita</span>
            </button>

            <div className="w-9 h-9 rounded-full bg-[#caec79] text-[#1e5236] font-display font-bold text-xs flex items-center justify-center">
              AD
            </div>
          </div>
        </div>

        {/* Password Reset Modal */}
        {resetModalUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#eae8e3] shadow-xl">
              <div className="w-12 h-12 rounded-full bg-[#f0eee9] text-[#003b21] flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-[#1b1c19] mb-1">
                Redefinir Senha do Aluno
              </h3>
              <p className="text-xs text-[#717972] mb-4">
                Redefinindo credenciais para <strong>{resetModalUser.full_name}</strong> (@{resetModalUser.username}).
              </p>

              {resetSuccessMsg ? (
                <div className="p-4 bg-[#e7f2e9] text-[#286342] rounded-2xl text-xs font-bold text-center">
                  {resetSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1b1c19] mb-1">
                      Nova Senha Temporária (mínimo 8 caracteres)
                    </label>
                    <input
                      type="text"
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-[#c0c9c0] text-xs bg-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setResetModalUser(null)}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-[#f0eee9]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full text-xs font-bold bg-[#003b21] text-white"
                    >
                      Confirmar Nova Senha
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1: VISÃO GERAL (Matching screen_6ce50658.png) */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="font-display font-bold text-3xl text-[#1b1c19] mb-1">
                Visão geral
              </h1>
              <p className="text-xs text-[#717972]">
                Acompanhamento do acervo gastronômico e engajamento da turma.
              </p>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] shadow-xs">
                <span className="text-xs font-bold text-[#717972] uppercase tracking-wider block mb-2">
                  USUÁRIOS
                </span>
                <div className="font-display font-bold text-4xl text-[#1b1c19] mb-2">
                  {adminUsers.length || 28}
                </div>
                <div className="text-xs font-medium text-[#286342] flex items-center space-x-1">
                  <span>↑ +4 novos alunos este mês</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] shadow-xs">
                <span className="text-xs font-bold text-[#717972] uppercase tracking-wider block mb-2">
                  RECEITAS PUBLICADAS
                </span>
                <div className="font-display font-bold text-4xl text-[#1b1c19] mb-2">
                  {adminRecipes.filter(r => !r.is_hidden).length}
                </div>
                <div className="text-xs font-medium text-[#717972]">
                  6 categorias ativas no acervo
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] shadow-xs">
                <span className="text-xs font-bold text-[#717972] uppercase tracking-wider block mb-2">
                  NOVAS ESTA SEMANA
                </span>
                <div className="font-display font-bold text-4xl text-[#1b1c19] mb-2">
                  07
                </div>
                <div className="text-xs font-medium text-[#286342]">
                  +15% em relação à anterior
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] shadow-xs">
                <span className="text-xs font-bold text-[#717972] uppercase tracking-wider block mb-2">
                  RECEITAS OCULTAS
                </span>
                <div className="font-display font-bold text-4xl text-[#1b1c19] mb-2">
                  {adminRecipes.filter(r => r.is_hidden).length}
                </div>
                <div className="text-xs font-medium text-amber-700">
                  Aguardando revisão ou moderação
                </div>
              </div>
            </div>

            {/* Split row: Categorias distribution & Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Category Breakdown */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#eae8e3] shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-bold text-lg text-[#1b1c19]">
                    Receitas por categoria
                  </h3>
                  <span className="text-xs text-[#717972] font-semibold">
                    Total: {adminRecipes.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {overviewData?.category_breakdown?.map((cat: any) => {
                    const theme = getCategoryTheme(cat.color_token);
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                          <span className="flex items-center space-x-2 text-[#1b1c19]">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.base }} />
                            <span>{cat.name}</span>
                          </span>
                          <span className="text-[#717972]">
                            {cat.count} receitas <strong className="text-[#1b1c19]">{cat.percentage}%</strong>
                          </span>
                        </div>
                        <div className="w-full bg-[#f0eee9] h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(cat.percentage, 5)}%`,
                              backgroundColor: theme.base,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Active Students List */}
                <div className="mt-8 pt-6 border-t border-[#f0eee9]">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display font-bold text-sm text-[#1b1c19]">
                      Alunos mais ativos
                    </h4>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="text-xs font-bold text-[#003b21] hover:underline"
                    >
                      Ver todos
                    </button>
                  </div>

                  <div className="space-y-3">
                    {adminUsers.slice(0, 4).map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#fbf9f4]">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#caec79] text-[#1e5236] font-display font-bold text-xs flex items-center justify-center">
                            {student.initials || 'AL'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1b1c19]">{student.full_name}</p>
                            <p className="text-[10px] text-[#717972]">{student.turma}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setResetModalUser(student)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#f0eee9] hover:bg-[#e4e2dd] text-[#1b1c19]"
                        >
                          Redefinir senha
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Recipes Table */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#eae8e3] shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#1b1c19]">
                      Receitas recentes
                    </h3>
                    <p className="text-xs text-[#717972]">Últimas submissões realizadas pela turma</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('moderation')}
                    className="text-xs font-bold text-[#003b21] hover:underline"
                  >
                    Filtrar todas
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#f0eee9] text-[#717972] uppercase font-bold text-[10px]">
                        <th className="pb-3">Receita</th>
                        <th className="pb-3">Categoria</th>
                        <th className="pb-3">Autor</th>
                        <th className="pb-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0eee9]">
                      {adminRecipes.slice(0, 6).map((r) => {
                        const theme = getCategoryTheme(r.category.color_token);
                        return (
                          <tr key={r.id} className="hover:bg-[#fbf9f4]">
                            <td className="py-3">
                              <p className="font-bold text-[#1b1c19]">{r.title}</p>
                              <p className="text-[10px] text-[#717972]">{r.prep_time_minutes} min</p>
                            </td>
                            <td className="py-3">
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ backgroundColor: theme.background, color: theme.text }}
                              >
                                {r.category.name}
                              </span>
                            </td>
                            <td className="py-3 font-medium text-[#414942]">
                              {r.author.full_name}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => onSelectRecipe(r)}
                                className="text-xs font-bold text-[#003b21] hover:underline"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Scheduled Practical Assessment Announcement */}
                <div className="mt-8 p-4 bg-[#f4faf3] border border-[#d8ebd3] rounded-2xl flex items-center space-x-3 text-xs text-[#2f6b2a]">
                  <Calendar className="w-5 h-5 shrink-0 text-[#4c9a47]" />
                  <div>
                    <span className="font-bold block">Avaliação prática agendada:</span>
                    <span>As receitas publicadas até 28 de outubro farão parte da edição impressa do Livro da Turma 2025.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MODERAÇÃO DE RECEITAS (Matching screen_8d43731f.png) */}
        {activeTab === 'moderation' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="font-display font-bold text-3xl text-[#1b1c19] mb-1">
                Moderação de Receitas
              </h1>
              <p className="text-xs text-[#717972]">
                Revise, gerencie visibilidade e organize as receitas enviadas pelos alunos com curadoria editorial e carinho artesanal.
              </p>
            </div>

            {/* Filter Pills and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setModFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    modFilter === 'all'
                      ? 'bg-[#1b1c19] text-white'
                      : 'bg-white border border-[#eae8e3] text-[#414942]'
                  }`}
                >
                  Todas ({adminRecipes.length})
                </button>
                <button
                  onClick={() => setModFilter('visible')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    modFilter === 'visible'
                      ? 'bg-[#1b1c19] text-white'
                      : 'bg-white border border-[#eae8e3] text-[#414942]'
                  }`}
                >
                  • Visíveis ({adminRecipes.filter(r => !r.is_hidden).length})
                </button>
                <button
                  onClick={() => setModFilter('hidden')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    modFilter === 'hidden'
                      ? 'bg-[#1b1c19] text-white'
                      : 'bg-white border border-[#eae8e3] text-[#414942]'
                  }`}
                >
                  • Ocultas ({adminRecipes.filter(r => r.is_hidden).length})
                </button>
              </div>

              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-[#717972] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por título ou autor..."
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-[#eae8e3] text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {/* Moderation Table */}
            <div className="bg-white rounded-3xl border border-[#eae8e3] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbf9f4] border-b border-[#eae8e3] text-[10px] text-[#717972] uppercase font-bold">
                    <tr>
                      <th className="py-3 px-6">Receita</th>
                      <th className="py-3 px-6">Aluno / Turma</th>
                      <th className="py-3 px-6">Categoria</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eae8e3]">
                    {filteredModRecipes.map((r) => {
                      const theme = getCategoryTheme(r.category.color_token);
                      return (
                        <tr key={r.id} className="hover:bg-[#fbf9f4] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-[10px] shrink-0 uppercase shadow-2xs"
                                style={{ backgroundColor: theme.background, color: theme.text }}
                              >
                                FOTO
                              </div>
                              <div>
                                <p className="font-bold text-[#1b1c19]">{r.title}</p>
                                <p className="text-[11px] text-[#717972]">{r.photo_tag || 'Prato cadastrado'} · {r.prep_time_minutes} min</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-[#d3e5d8] text-[#0e2d1d] font-display font-bold text-[10px] flex items-center justify-center">
                                {r.author.initials || 'AL'}
                              </div>
                              <div>
                                <span className="font-medium text-[#1b1c19] block">{r.author.full_name}</span>
                                <span className="text-[10px] text-[#717972]">{r.author.turma}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                              style={{ backgroundColor: theme.background, color: theme.text }}
                            >
                              {r.category.name}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            {r.is_hidden ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fff1d9] text-[#87521b]">
                                <EyeOff className="w-3 h-3" />
                                <span>Oculta</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e7f2e9] text-[#286342]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Visível</span>
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => onSelectRecipe(r)}
                              className="px-2.5 py-1 text-xs font-semibold text-[#1b1c19] hover:underline"
                            >
                              Ver
                            </button>

                            <button
                              onClick={() => handleToggleVisibility(r.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                r.is_hidden
                                  ? 'bg-[#003b21] text-white hover:bg-[#1e5236]'
                                  : 'bg-[#f0eee9] text-[#414942] hover:bg-[#e4e2dd]'
                              }`}
                            >
                              {r.is_hidden ? 'Publicar' : 'Ocultar'}
                            </button>

                            <button
                              onClick={() => handleDeleteRecipe(r.id)}
                              className="px-2 py-1 text-xs font-semibold text-[#ba1a1a] hover:underline"
                              title="Remover receita"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Moderation Guidelines Note */}
            <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-[#4d6700] shrink-0 mt-0.5" />
                <div className="text-xs text-[#414942]">
                  <strong className="text-[#1b1c19] block mb-0.5">
                    Diretrizes de Moderação Gastronômica
                  </strong>
                  Receitas marcadas como <em>Ocultas</em> permanecem editáveis pelo aluno autor no portal do estudante,
                  mas não aparecem nas buscas nem na compilação do livro digital até revisão da coordenação.
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => alert('Manual de Normas Pedagógicas carregado.')}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-[#f0eee9] hover:bg-[#e4e2dd]"
                >
                  Manual de Normas
                </button>
                <button
                  onClick={() => alert('Relatório exportado em formato PDF/Ficha técnica.')}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-[#003b21] text-white flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Relatório</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: USUÁRIOS DA TURMA (Matching screen_e331511c.png) */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="font-display font-bold text-3xl text-[#1b1c19] mb-1">
                Usuários da Turma
              </h1>
              <p className="text-xs text-[#717972]">
                Gerencie o acesso de alunos e professores colaboradores, acompanhe a produção culinária e mantenha os registros acadêmicos atualizados.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#eae8e3] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbf9f4] border-b border-[#eae8e3] text-[10px] text-[#717972] uppercase font-bold">
                    <tr>
                      <th className="py-3 px-6">Nome</th>
                      <th className="py-3 px-6">Usuário</th>
                      <th className="py-3 px-6">Turma & Módulo</th>
                      <th className="py-3 px-6">Receitas</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eae8e3]">
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#fbf9f4]">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#d3e5d8] text-[#0e2d1d] font-display font-bold text-xs flex items-center justify-center">
                              {u.initials || 'AL'}
                            </div>
                            <div>
                              <p className="font-bold text-[#1b1c19]">{u.full_name}</p>
                              <p className="text-[10px] text-[#717972]">{u.username}@gastronomia.edu.br</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono font-medium text-[#414942]">
                          @{u.username}
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-medium text-[#1b1c19] block">{u.turma}</span>
                          <span className="text-[10px] text-[#717972]">{u.modulo}</span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-bold text-sm text-[#1b1c19]">{u.recipes_count ?? 0}</span>
                          <span className="text-[10px] text-[#717972] block uppercase tracking-wider">Publicações</span>
                        </td>

                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleToggleUserActive(u.id)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                              u.is_active
                                ? 'bg-[#e7f2e9] text-[#286342] hover:bg-[#d8ebd3]'
                                : 'bg-[#eae8e3] text-[#717972] hover:bg-[#dbdad5]'
                            }`}
                          >
                            <span>{u.is_active ? '• Ativo' : '• Inativo'}</span>
                          </button>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setResetModalUser(u)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#c0c9c0] hover:bg-[#f0eee9] text-[#1b1c19] transition-colors"
                          >
                            Redefinir senha
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: CATEGORIAS E TEMAS VISUAIS (Matching screen_8709160f.png) */}
        {activeTab === 'categories' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-[#4d6700] uppercase tracking-wider mb-1">
                <span>MANUAL DE IDENTIDADE VISUAL</span>
              </div>
              <h1 className="font-display font-bold text-3xl text-[#1b1c19] mb-1">
                Categorias e Temas Visuais
              </h1>
              <p className="text-xs text-[#717972] max-w-3xl">
                Visualização das 6 categorias cromáticas do sistema gastronômico. As cores e temas são definidos pelo caderno pedagógico e aplicados automaticamente a cada prato cadastrado.
              </p>
            </div>

            {/* 6 Category Palette Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(CATEGORY_THEMES).map(([slug, theme]) => {
                const count = adminRecipes.filter(r => r.category.slug === slug).length;
                return (
                  <div
                    key={slug}
                    className="bg-white rounded-3xl p-6 border border-[#eae8e3] shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Preview Banner */}
                      <div
                        className="rounded-2xl p-4 text-xs font-bold mb-4 flex items-center justify-between shadow-2xs"
                        style={{ backgroundColor: theme.background, color: theme.text }}
                      >
                        <span>{theme.name}</span>
                        <span className="font-mono text-[10px] bg-white/70 px-2 py-0.5 rounded-md">
                          {theme.base}
                        </span>
                      </div>

                      {/* Title and stats */}
                      <div className="flex items-baseline justify-between mb-4">
                        <h3 className="font-display font-bold text-2xl text-[#1b1c19] capitalize">
                          {slug}
                        </h3>
                        <span className="text-xs text-[#717972] font-semibold">
                          {count} receitas no acervo
                        </span>
                      </div>

                      {/* Color Tokens Swatches */}
                      <div className="space-y-2 mb-6">
                        <span className="text-[10px] font-bold text-[#717972] uppercase tracking-wider block">
                          TOKENS CROMÁTICOS
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                          <div className="p-2 rounded-xl border border-[#eae8e3]">
                            <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: theme.base }} />
                            <span className="font-bold text-[#1b1c19] block">Base</span>
                            <span className="font-mono text-[#717972]">{theme.base}</span>
                          </div>

                          <div className="p-2 rounded-xl border border-[#eae8e3]">
                            <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: theme.background }} />
                            <span className="font-bold text-[#1b1c19] block">Fundo</span>
                            <span className="font-mono text-[#717972]">{theme.background}</span>
                          </div>

                          <div className="p-2 rounded-xl border border-[#eae8e3]">
                            <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: theme.text }} />
                            <span className="font-bold text-[#1b1c19] block">Texto</span>
                            <span className="font-mono text-[#717972]">{theme.text}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#f0eee9] text-[11px] text-[#717972] italic font-serif">
                      Aplica-se à capa, cabeçalho e passos de preparo.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
