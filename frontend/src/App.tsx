import React, { useState, useEffect } from 'react';
import { Category, Recipe, User } from './types';
import { api, ApiError } from './services/api';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { RecipeCard } from './components/RecipeCard';
import { ChefTips } from './components/ChefTips';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeFormModal } from './components/RecipeFormModal';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { CookingModeModal } from './components/CookingModeModal';
import { CATEGORY_THEMES } from './utils/theme';
import { Search, Sparkles, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Navigation states
  const [activeView, setActiveView] = useState<'home' | 'my-recipes' | 'admin' | 'recipe-detail'>('home');
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [recipeFormOpen, setRecipeFormOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check current session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
      } catch {
        // Not logged in; visitor view
        setCurrentUser(null);
      }
    };
    initAuth();
  }, []);

  // Fetch categories and public recipes
  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, recsData] = await Promise.all([
        api.getCategories(),
        api.getRecipes({ category: selectedCategory, search: searchTerm }),
      ]);
      setCategories(cats);
      setRecipes(recsData.results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, searchTerm]);

  // URL Routing and Browser History Sync
  const navigateTo = (view: 'home' | 'my-recipes' | 'admin' | 'recipe-detail', recipe?: Recipe | null, replace = false) => {
    setActiveView(view);
    if (recipe !== undefined) {
      setActiveRecipe(recipe);
    }

    let path = '/';
    if (view === 'my-recipes') path = '/minhas-receitas';
    else if (view === 'admin') path = '/admin';
    else if (view === 'recipe-detail') {
      const recId = recipe ? recipe.id : activeRecipe?.id;
      if (recId) path = `/receita/${recId}`;
    }

    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      const stateObj = { view, recipeId: recipe ? recipe.id : activeRecipe?.id };
      if (replace) {
        window.history.replaceState(stateObj, '', path);
      } else {
        window.history.pushState(stateObj, '', path);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync route from URL on mount & back/forward navigation
  useEffect(() => {
    const syncRouteFromUrl = async () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      // Check if path is /receita/:id or /receitas/:id or ?recipe=:id
      const recipeMatch = pathname.match(/^\/receitas?\/([^/?#]+)/i);
      const recipeQuery = searchParams.get('recipe');
      const targetId = recipeMatch ? recipeMatch[1] : recipeQuery;

      if (targetId) {
        try {
          const rec = await api.getRecipe(targetId);
          setActiveRecipe(rec);
          setActiveView('recipe-detail');
          return;
        } catch (err) {
          console.warn('Receita não encontrada a partir da URL:', err);
        }
      }

      if (pathname === '/minhas-receitas' || searchParams.get('view') === 'my-recipes') {
        setActiveView('my-recipes');
      } else if (pathname === '/admin' || searchParams.get('view') === 'admin') {
        setActiveView('admin');
      } else if (pathname === '/entrar') {
        setAuthInitialTab('login');
        setAuthModalOpen(true);
      } else if (pathname === '/cadastro') {
        setAuthInitialTab('register');
        setAuthModalOpen(true);
      } else {
        setActiveView('home');
      }
    };

    syncRouteFromUrl();

    const handlePopState = () => {
      syncRouteFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth actions
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Bem-vindo(a), ${user.full_name}!`);
    loadData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      navigateTo('home', null, true);
      showToast('Sessão encerrada com sucesso.');
      loadData();
    } catch {
      setCurrentUser(null);
      navigateTo('home', null, true);
    }
  };

  // Recipe actions
  const handleOpenNewRecipe = () => {
    if (!currentUser) {
      setAuthInitialTab('login');
      setAuthModalOpen(true);
      return;
    }
    setRecipeToEdit(null);
    setRecipeFormOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    if (!currentUser) {
      setAuthInitialTab('login');
      setAuthModalOpen(true);
      return;
    }
    // Check permission UX (server validates strictly)
    if (recipe.author.id !== currentUser.id && !currentUser.is_staff) {
      showToast('Você só pode editar suas próprias receitas.');
      return;
    }
    setRecipeToEdit(recipe);
    setRecipeFormOpen(true);
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    try {
      await api.deleteRecipe(recipe.id);
      showToast('Receita removida com sucesso.');
      if (activeView === 'recipe-detail') {
        navigateTo('home', null, true);
      }
      loadData();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        showToast('Erro de permissão: você não pode excluir a receita de outro aluno.');
      } else {
        showToast('Não foi possível excluir a receita.');
      }
    }
  };

  const handleRecipeSaved = (saved: Recipe) => {
    showToast(`Receita "${saved.title}" salva com sucesso!`);
    loadData();
    if (activeRecipe && activeRecipe.id === saved.id) {
      setActiveRecipe(saved);
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    navigateTo('recipe-detail', recipe);
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#1b1c19] flex flex-col selection:bg-[#caec79] selection:text-[#003b21]">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#1b1c19] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#caec79]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation (Only show outside of Admin view) */}
      {activeView !== 'admin' && (
        <Navbar
          currentUser={currentUser}
          activeView={activeView}
          onNavigate={(view) => navigateTo(view)}
          onOpenNewRecipe={handleOpenNewRecipe}
          onOpenAuth={(tab = 'login') => {
            setAuthInitialTab(tab);
            setAuthModalOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* VIEW: ADMIN DASHBOARD */}
      {activeView === 'admin' && currentUser?.is_staff && (
        <AdminDashboard
          currentUser={currentUser}
          onExit={() => navigateTo('home')}
          onSelectRecipe={handleSelectRecipe}
          onOpenNewRecipe={handleOpenNewRecipe}
        />
      )}

      {/* VIEW: RECIPE DETAIL */}
      {activeView === 'recipe-detail' && activeRecipe && (
        <RecipeDetail
          recipe={activeRecipe}
          currentUser={currentUser}
          onBack={() => navigateTo('home')}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
          onStartCookingMode={(rec) => setCookingRecipe(rec)}
        />
      )}

      {/* VIEW: STUDENT PROFILE & MY RECIPES */}
      {activeView === 'my-recipes' && currentUser && (
        <ProfileView
          currentUser={currentUser}
          onSelectRecipe={handleSelectRecipe}
          onOpenNewRecipe={handleOpenNewRecipe}
          onEditRecipe={handleEditRecipe}
          onDeleteRecipe={handleDeleteRecipe}
          onUpdateBio={(bio, turma) => {
            setCurrentUser({ ...currentUser, bio, turma });
            showToast('Perfil acadêmico atualizado.');
          }}
        />
      )}

      {/* VIEW: HOME (CATALOG & EDITORIAL) */}
      {activeView === 'home' && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
          {/* Hero Banner (Faithfully matches screen_2a2f4467.png & screen_6dbd58ec.png) */}
          <section className="mb-10">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#35684b] uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#35684b]" />
              <span>EDIÇÃO COLETIVA · TURMA DE GASTRONOMIA 2025</span>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-[#1b1c19] tracking-tight max-w-3xl leading-tight mb-4">
              Receitas feitas pela turma, com o clima de cada prato.
            </h1>

            <p className="text-sm md:text-base text-[#414942] max-w-2xl leading-relaxed mb-8">
              Um caderno coletivo onde cada receita ganha vida e cor. Explore pratos preparados com técnica,
              afeto e memória pelos alunos da turma.
            </p>

            {/* Category Filter Bar */}
            <div id="category-filter-section" className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#717972]">
                  FILTRAR POR CATEGORIA
                </span>

                <span className="text-xs text-[#717972] font-semibold">
                  {recipes.length} receitas exibidas
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {/* Todas */}
                <button
                  onClick={() => setSelectedCategory('todas')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === 'todas'
                      ? 'bg-[#8c1818] text-white shadow-xs'
                      : 'bg-white border border-[#eae8e3] text-[#414942] hover:bg-[#f5f3ee]'
                  }`}
                >
                  • Todas
                </button>

                {/* Dynamic Categories */}
                {categories.map((cat) => {
                  const theme = CATEGORY_THEMES[cat.color_token] || CATEGORY_THEMES.doces;
                  const isSelected = selectedCategory.toLowerCase() === cat.slug.toLowerCase();

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#1b1c19] text-white shadow-xs'
                          : 'bg-white border border-[#eae8e3] text-[#414942] hover:bg-[#f5f3ee]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: theme.base }}
                      />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Recipe Grid */}
          <section className="mb-12">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-80 bg-white rounded-3xl border border-[#eae8e3] animate-pulse" />
                ))}
              </div>
            ) : recipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onSelect={handleSelectRecipe}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#eae8e3]">
                <BookOpen className="w-12 h-12 text-[#717972] mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg text-[#1b1c19] mb-1">
                  Nenhuma receita cadastrada ainda
                </h3>
                <p className="text-xs text-[#717972] max-w-sm mx-auto mb-4">
                  {currentUser
                    ? 'Seja o primeiro a compartilhar uma receita com a turma!'
                    : 'Acesse sua conta para começar a catalogar suas receitas na turma.'}
                </p>
                {currentUser ? (
                  <button
                    onClick={handleOpenNewRecipe}
                    className="px-5 py-2.5 bg-[#8c1818] hover:bg-[#721111] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Cadastrar receita
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthInitialTab('login');
                      setAuthModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#003b21] hover:bg-[#1e5236] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Entrar na Cozinha
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Chef Tutor Tip & Next Workshop Static Sections */}
          <ChefTips />

          {/* Mobile Bottom Banner Callout - ONLY visible when logged in */}
          {currentUser && (
            <div className="md:hidden mt-8 mb-6 p-4 bg-[#f8faf1] border border-[#e4ebc9] rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">🧑‍🍳</span>
                <div>
                  <p className="text-xs font-bold text-[#1b1c19]">Inspirou-se hoje?</p>
                  <p className="text-[11px] text-[#414942]">Compartilhe sua criação com o grupo.</p>
                </div>
              </div>
              <button
                onClick={handleOpenNewRecipe}
                className="px-4 py-2 bg-[#8c1818] text-white text-xs font-bold rounded-full"
              >
                Nova receita
              </button>
            </div>
          )}
        </main>
      )}

      {/* Editorial Footer */}
      {activeView !== 'admin' && <Footer />}

      {/* Mobile Navigation Bar */}
      {activeView !== 'admin' && (
        <BottomNav
          currentUser={currentUser}
          activeView={activeView}
          onNavigate={(view) => navigateTo(view)}
          onOpenNewRecipe={handleOpenNewRecipe}
          onOpenAuth={() => {
            setAuthInitialTab('login');
            setAuthModalOpen(true);
          }}
        />
      )}

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialTab={authInitialTab}
      />

      {/* Recipe Create & Edit Modal */}
      <RecipeFormModal
        isOpen={recipeFormOpen}
        onClose={() => {
          setRecipeFormOpen(false);
          setRecipeToEdit(null);
        }}
        onSuccess={handleRecipeSaved}
        categories={categories}
        recipeToEdit={recipeToEdit}
      />

      {/* Kitchen Station Cooking Mode */}
      {cookingRecipe && (
        <CookingModeModal
          recipe={cookingRecipe}
          onClose={() => setCookingRecipe(null)}
        />
      )}
    </div>
  );
}
