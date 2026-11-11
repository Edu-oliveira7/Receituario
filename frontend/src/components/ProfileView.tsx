import React, { useState, useEffect } from 'react';
import { Recipe, User } from '../types';
import { api } from '../services/api';
import { RecipeCard } from './RecipeCard';
import {
  Edit,
  Plus,
  BookOpen,
  Bookmark,
  FileText,
  Search,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  onSelectRecipe: (recipe: Recipe) => void;
  onOpenNewRecipe: () => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipe: Recipe) => void;
  onUpdateBio: (bio: string, turma: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onSelectRecipe,
  onOpenNewRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onUpdateBio,
}) => {
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'saved'>('published');
  const [searchTerm, setSearchTerm] = useState('');
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [userDrafts, setUserDrafts] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [bioInput, setBioInput] = useState(currentUser.bio || '');
  const [turmaInput, setTurmaInput] = useState(currentUser.turma || 'Turma 3B');

  const fetchMyRecipes = async () => {
    try {
      setLoading(true);
      const data = await api.getMyRecipes();
      setUserRecipes(data.published || []);
      setUserDrafts(data.drafts || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRecipes();
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile({ bio: bioInput, turma: turmaInput });
      onUpdateBio(bioInput, turmaInput);
      setIsEditingProfile(false);
    } catch {
      alert('Erro ao atualizar perfil.');
    }
  };

  const filteredRecipes = userRecipes.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Student Profile Card (Matching screen_155dc184.png) */}
      <div className="bg-white rounded-3xl p-6 sm:p-9 border border-[#eae8e3] shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5">
            {/* Avatar circle */}
            <div className="w-20 h-20 rounded-full bg-[#caec79] text-[#1e5236] font-display font-bold text-2xl flex items-center justify-center shrink-0 shadow-xs">
              {currentUser.initials || 'AL'}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1b1c19]">
                  {currentUser.full_name}
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#caec79] text-[#2d3b00]">
                  {currentUser.modulo || 'Turma de Gastronomia'}
                </span>
              </div>

              <p className="text-xs text-[#717972] mb-3">
                @{currentUser.username} · {currentUser.turma} · {userRecipes.length} receitas publicadas · {userDrafts.length} rascunhos
              </p>

              <p className="text-xs sm:text-sm text-[#414942] leading-relaxed max-w-2xl">
                {currentUser.bio || 'Aluno dedicado ao aprimoramento das artes gastronômicas e partilha coletiva.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#f0eee9] hover:bg-[#e4e2dd] text-[#1b1c19] transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-[#414942]" />
              <span>Editar perfil</span>
            </button>

            <button
              onClick={onOpenNewRecipe}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#003b21] hover:bg-[#1e5236] text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#8ec4a0]" />
              <span>Nova receita</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-8 pt-6 border-t border-[#f0eee9] bg-[#fbf9f4] rounded-2xl p-4 sm:p-6 grid grid-cols-3 text-center gap-2">
          <div>
            <div className="font-display font-bold text-2xl sm:text-3xl text-[#1b1c19]">
              {userRecipes.length}
            </div>
            <div className="text-[11px] font-semibold text-[#717972] uppercase tracking-wider mt-0.5">
              Pratos compartilhados
            </div>
          </div>

          <div className="border-x border-[#eae8e3]">
            <div className="font-display font-bold text-2xl sm:text-3xl text-[#1b1c19]">
              {userDrafts.length}
            </div>
            <div className="text-[11px] font-semibold text-[#717972] uppercase tracking-wider mt-0.5">
              Rascunhos de bancada
            </div>
          </div>

          <div>
            <div className="font-display font-bold text-2xl sm:text-3xl text-[#1b1c19]">
              {userRecipes.length > 0 ? userRecipes.length * 2 : 0}
            </div>
            <div className="text-[11px] font-semibold text-[#717972] uppercase tracking-wider mt-0.5">
              Guardadas por colegas
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#eae8e3] shadow-xl space-y-4"
          >
            <h3 className="font-display font-bold text-xl text-[#1b1c19]">Editar Perfil de Aluno</h3>
            <div>
              <label className="block text-xs font-bold text-[#1b1c19] mb-1">Turma</label>
              <input
                type="text"
                value={turmaInput}
                onChange={(e) => setTurmaInput(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-[#c0c9c0] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c19] mb-1">Biografia & Especialidades</label>
              <textarea
                rows={3}
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-[#c0c9c0] text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#f0eee9]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-xs font-bold bg-[#003b21] text-white"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'published'
                ? 'bg-[#1b1c19] text-white'
                : 'bg-[#f0eee9] text-[#414942] hover:bg-[#e4e2dd]'
            }`}
          >
            Minhas receitas ({userRecipes.length})
          </button>

          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'drafts'
                ? 'bg-[#1b1c19] text-white'
                : 'bg-[#f0eee9] text-[#414942] hover:bg-[#e4e2dd]'
            }`}
          >
            Rascunhos (2)
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-[#1b1c19] text-white'
                : 'bg-[#f0eee9] text-[#414942] hover:bg-[#e4e2dd]'
            }`}
          >
            Salvas / Favoritas (5)
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-[#717972] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar nas minhas receitas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-[#eae8e3] text-xs focus:outline-hidden focus:border-[#003b21]"
          />
        </div>
      </div>

      {/* Recipe Grid */}
      {activeTab === 'published' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={onSelectRecipe}
                  showActions={true}
                  onEdit={onEditRecipe}
                  onDelete={onDeleteRecipe}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#eae8e3]">
              <BookOpen className="w-12 h-12 text-[#717972] mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-[#1b1c19] mb-1">
                Nenhuma receita publicada ainda
              </h3>
              <p className="text-xs text-[#717972] max-w-sm mx-auto mb-4">
                Cadastre o primeiro prato que você preparou na bancada da turma.
              </p>
              <button
                onClick={onOpenNewRecipe}
                className="px-5 py-2.5 bg-[#8c1818] text-white text-xs font-bold rounded-full"
              >
                Cadastrar primeira receita
              </button>
            </div>
          )}
        </>
      )}

      {/* Rascunhos em andamento section - Only show if real drafts exist */}
      {userDrafts.length > 0 && (
        <div className="mt-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#caec79]" />
              <h2 className="font-display font-bold text-xl text-[#1b1c19]">
                Rascunhos em andamento ({userDrafts.length})
              </h2>
            </div>
            <p className="text-xs text-[#717972]">
              Salvos durante seus testes na cozinha
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-white rounded-3xl p-6 border border-[#eae8e3] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#caec79] text-[#2d3b00]">
                      {draft.category.name}
                    </span>
                    <span className="text-[11px] text-[#717972] flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{draft.prep_time_minutes} min</span>
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-base text-[#1b1c19] mb-2">
                    {draft.title}
                  </h4>

                  <p className="text-xs text-[#414942] leading-relaxed mb-6 line-clamp-2">
                    {draft.description || 'Rascunho de receita em elaboração.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#f0eee9]">
                  <span className="text-xs text-[#35684b] font-bold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#35684b]" />
                    <span>{draft.steps?.length || 0} passos cadastrados</span>
                  </span>

                  <button
                    onClick={() => onEditRecipe(draft)}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#003b21] hover:bg-[#1e5236] text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Continuar editando</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
