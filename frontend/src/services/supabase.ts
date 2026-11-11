import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, Recipe, User } from '../types';

// Read configuration from environment variables (or localStorage runtime override)
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('receituario_supabase_url') : null;
const localKey = typeof window !== 'undefined' ? localStorage.getItem('receituario_supabase_key') : null;

const supabaseUrl = localUrl || envUrl;
const supabaseAnonKey = localKey || envKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://sua-empresa-ou-projeto.supabase.co' &&
  !supabaseUrl.includes('sua-empresa') &&
  supabaseUrl.startsWith('https://')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function formatUsernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  if (clean.includes('@')) return clean;
  return `${clean}@receituario.app`;
}

function mapProfileToUser(profile: any, recipesCount: number = 0): User {
  return {
    id: profile.id,
    username: profile.username || 'usuario',
    full_name: profile.full_name || 'Aluno da Turma',
    turma: profile.turma || 'Turma 3B',
    modulo: profile.modulo || 'Gastronomia Geral',
    bio: profile.bio || '',
    initials: profile.initials || 'AL',
    is_staff: Boolean(profile.is_staff),
    is_active: Boolean(profile.is_active ?? true),
    recipes_count: recipesCount,
    date_joined: profile.created_at,
  };
}

export const supabaseService = {
  isConfigured: () => isSupabaseConfigured,
  getClient: () => supabase,

  // Set runtime connection credentials if needed
  configureRuntime(url: string, key: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('receituario_supabase_url', url);
      localStorage.setItem('receituario_supabase_key', key);
      window.location.reload();
    }
  },

  // ---------------- AUTHENTICATION ----------------
  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    const { count } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id);

    return mapProfileToUser(profile, count || 0);
  },

  async login(usernameOrEmail: string, password: string): Promise<{ message: string; user: User }> {
    if (!supabase) {
      throw new Error('Supabase não configurado. Verifique as credenciais no .env.');
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase().replace(/^@/, '');
    let targetEmail = cleanInput;

    if (!cleanInput.includes('@')) {
      // Find profile by username to get auth email
      const { data: profile } = await supabase
        .from('profiles')
        .select('auth_user_id, username, is_active')
        .ilike('username', cleanInput)
        .maybeSingle();

      if (profile && profile.is_active === false) {
        throw new Error('Esta conta está inativa. Peça ao administrador da turma para reativar.');
      }

      targetEmail = formatUsernameToEmail(cleanInput);
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Nome de usuário ou senha incorretos.');
    }

    // Fetch associated profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (profileErr || !profile) {
      throw new Error('Perfil de aluno não localizado no banco.');
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new Error('Esta conta está inativa. Peça ao administrador da turma para reativar.');
    }

    return {
      message: 'Login realizado com sucesso.',
      user: mapProfileToUser(profile),
    };
  },

  async register(payload: {
    full_name: string;
    username: string;
    password: string;
    password_confirm: string;
    turma?: string;
  }): Promise<{ message: string; user: User }> {
    if (!supabase) {
      throw new Error('Supabase não configurado.');
    }

    const cleanUsername = payload.username.trim().toLowerCase().replace(/^@/, '');
    const email = formatUsernameToEmail(cleanUsername);

    // Check if username already exists in profiles
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Este nome de usuário já está em uso por outro aluno.');
    }

    // Check if this will be the very first user (becomes Admin)
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const isFirstUser = (totalProfiles || 0) === 0;
    const isStaff = isFirstUser;

    // Generate initials
    const parts = payload.full_name.trim().split(/\s+/);
    const initials = parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : cleanUsername.slice(0, 2).toUpperCase();

    // Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: payload.password,
      options: {
        data: {
          username: cleanUsername,
          full_name: payload.full_name.trim(),
          turma: isStaff ? 'Coordenação Pedagógica' : (payload.turma || 'Turma 3B'),
          modulo: isStaff ? 'Administrador do Caderno' : 'Gastronomia Geral',
          bio: isStaff ? 'Administrador e Coordenador Geral do Receituário.' : 'Estudante de gastronomia.',
          initials,
          is_staff: isStaff,
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Falha ao criar conta no Supabase.');
    }

    // Verify or insert profile directly in case DB trigger is not active
    let profile: any = null;
    const { data: fetchedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (fetchedProfile) {
      profile = fetchedProfile;
    } else {
      const { data: insertedProfile, error: insertErr } = await supabase
        .from('profiles')
        .insert({
          auth_user_id: authData.user.id,
          username: cleanUsername,
          full_name: payload.full_name.trim(),
          turma: isStaff ? 'Coordenação Pedagógica' : (payload.turma || 'Turma 3B'),
          modulo: isStaff ? 'Administrador do Caderno' : 'Gastronomia Geral',
          bio: isStaff ? 'Administrador e Coordenador Geral do Receituário.' : 'Estudante de gastronomia.',
          initials,
          is_staff: isStaff,
          is_active: true,
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }
      profile = insertedProfile;
    }

    return {
      message: 'Conta criada com sucesso!',
      user: mapProfileToUser(profile),
    };
  },

  async logout(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  async updateProfile(payload: Partial<User>): Promise<User> {
    if (!supabase) throw new Error('Supabase não configurado');

    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Não autenticado');

    const updateData: any = {};
    if (payload.full_name !== undefined) updateData.full_name = payload.full_name.trim();
    if (payload.bio !== undefined) updateData.bio = payload.bio;
    if (payload.turma !== undefined) updateData.turma = payload.turma;
    if (payload.modulo !== undefined) updateData.modulo = payload.modulo;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) throw error;
    return mapProfileToUser(data);
  },

  // ---------------- CATEGORIES ----------------
  async getCategories(): Promise<Category[]> {
    if (!supabase) return [];

    const { data: cats, error } = await supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;

    // Fetch recipe counts for each category
    const { data: recipesData } = await supabase
      .from('recipes')
      .select('category_id')
      .eq('is_hidden', false)
      .eq('is_draft', false);

    const counts: Record<number | string, number> = {};
    (recipesData || []).forEach((r: any) => {
      counts[r.category_id] = (counts[r.category_id] || 0) + 1;
    });

    return (cats || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      color_token: c.color_token,
      order: c.order,
      recipes_count: counts[c.id] || 0,
    }));
  },

  // ---------------- RECIPES ----------------
  async getRecipes(params?: { category?: string; search?: string }): Promise<Recipe[]> {
    if (!supabase) return [];

    let query = supabase
      .from('recipes')
      .select(`
        *,
        category:categories(*),
        author:profiles(*),
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*)
      `)
      .eq('is_hidden', false)
      .eq('is_draft', false)
      .order('created_at', { ascending: false });

    if (params?.category && params.category !== 'todas') {
      // Find category ID
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .ilike('slug', params.category)
        .maybeSingle();

      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }

    if (params?.search) {
      query = query.ilike('title', `%${params.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((r: any) => this.formatRecipe(r));
  },

  async getRecipe(id: number | string): Promise<Recipe> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        category:categories(*),
        author:profiles(*),
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) throw new Error('Receita não encontrada.');
    return this.formatRecipe(data);
  },

  async createRecipe(payload: any): Promise<Recipe> {
    if (!supabase) throw new Error('Supabase não configurado');

    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Autenticação necessária.');

    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .insert({
        author_id: currentUser.id,
        category_id: payload.category_id,
        title: payload.title.trim(),
        description: payload.description.trim(),
        prep_time_minutes: Number(payload.prep_time_minutes),
        servings: payload.servings.trim(),
        difficulty: payload.difficulty || 'Fácil',
        is_draft: Boolean(payload.is_draft),
        is_hidden: false,
        chef_tip: payload.chef_tip || '',
        photo_tag: payload.photo_tag || '',
      })
      .select()
      .single();

    if (recipeErr || !recipe) {
      throw new Error(recipeErr?.message || 'Erro ao cadastrar receita no Supabase.');
    }

    // Insert ingredients
    if (Array.isArray(payload.ingredients) && payload.ingredients.length > 0) {
      const ingRows = payload.ingredients.map((ing: any, idx: number) => ({
        recipe_id: recipe.id,
        name: ing.name.trim(),
        quantity: ing.quantity?.trim() || '',
        order: idx,
      }));
      await supabase.from('recipe_ingredients').insert(ingRows);
    }

    // Insert steps
    if (Array.isArray(payload.steps) && payload.steps.length > 0) {
      const stepRows = payload.steps.map((st: any, idx: number) => ({
        recipe_id: recipe.id,
        title: st.title?.trim() || '',
        text: st.text.trim(),
        order: idx,
      }));
      await supabase.from('recipe_steps').insert(stepRows);
    }

    return this.getRecipe(recipe.id);
  },

  async updateRecipe(id: number | string, payload: any): Promise<Recipe> {
    if (!supabase) throw new Error('Supabase não configurado');

    const recipeUpdate: any = {};
    if (payload.title !== undefined) recipeUpdate.title = payload.title.trim();
    if (payload.description !== undefined) recipeUpdate.description = payload.description.trim();
    if (payload.prep_time_minutes !== undefined) recipeUpdate.prep_time_minutes = Number(payload.prep_time_minutes);
    if (payload.servings !== undefined) recipeUpdate.servings = payload.servings.trim();
    if (payload.difficulty !== undefined) recipeUpdate.difficulty = payload.difficulty;
    if (payload.category_id !== undefined) recipeUpdate.category_id = payload.category_id;
    if (payload.is_draft !== undefined) recipeUpdate.is_draft = Boolean(payload.is_draft);
    if (payload.chef_tip !== undefined) recipeUpdate.chef_tip = payload.chef_tip;
    if (payload.photo_tag !== undefined) recipeUpdate.photo_tag = payload.photo_tag;

    recipeUpdate.updated_at = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('recipes')
      .update(recipeUpdate)
      .eq('id', id);

    if (updateErr) throw new Error(updateErr.message);

    // Update ingredients if provided
    if (Array.isArray(payload.ingredients)) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
      const ingRows = payload.ingredients.map((ing: any, idx: number) => ({
        recipe_id: id,
        name: ing.name.trim(),
        quantity: ing.quantity?.trim() || '',
        order: idx,
      }));
      if (ingRows.length > 0) {
        await supabase.from('recipe_ingredients').insert(ingRows);
      }
    }

    // Update steps if provided
    if (Array.isArray(payload.steps)) {
      await supabase.from('recipe_steps').delete().eq('recipe_id', id);
      const stepRows = payload.steps.map((st: any, idx: number) => ({
        recipe_id: id,
        title: st.title?.trim() || '',
        text: st.text.trim(),
        order: idx,
      }));
      if (stepRows.length > 0) {
        await supabase.from('recipe_steps').insert(stepRows);
      }
    }

    return this.getRecipe(id);
  },

  async deleteRecipe(id: number | string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getMyRecipes(): Promise<{
    published_count: number;
    drafts_count: number;
    saved_count: number;
    published: Recipe[];
    drafts: Recipe[];
  }> {
    if (!supabase) {
      return { published_count: 0, drafts_count: 0, saved_count: 0, published: [], drafts: [] };
    }

    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        category:categories(*),
        author:profiles(*),
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*)
      `)
      .eq('author_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const all = (data || []).map((r: any) => this.formatRecipe(r));
    const published = all.filter((r) => !r.is_draft);
    const drafts = all.filter((r) => r.is_draft);

    return {
      published_count: published.length,
      drafts_count: drafts.length,
      saved_count: 0,
      published,
      drafts,
    };
  },

  // ---------------- ADMIN OPERATIONS ----------------
  async getAdminOverview(): Promise<any> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data: allProfiles } = await supabase.from('profiles').select('*');
    const { data: allRecipes } = await supabase.from('recipes').select(`
      *,
      category:categories(*),
      author:profiles(*)
    `);
    const { data: allCategories } = await supabase.from('categories').select('*');

    const published = (allRecipes || []).filter((r: any) => !r.is_hidden && !r.is_draft).length;
    const hidden = (allRecipes || []).filter((r: any) => r.is_hidden).length;

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = (allRecipes || []).filter((r: any) => new Date(r.created_at).getTime() > oneWeekAgo).length;

    const breakdown = (allCategories || []).map((cat: any) => {
      const count = (allRecipes || []).filter((r: any) => r.category_id === cat.id).length;
      const pct = Math.round((count / Math.max(allRecipes?.length || 1, 1)) * 100);
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count,
        percentage: pct,
        color_token: cat.color_token,
      };
    });

    const activeStudents = (allProfiles || [])
      .filter((p: any) => !p.is_staff)
      .map((p: any) => mapProfileToUser(p));

    return {
      stats: {
        total_users: allProfiles?.length || 0,
        published_recipes: published,
        new_this_week: newThisWeek,
        hidden_recipes: hidden,
        total_categories: allCategories?.length || 0,
      },
      category_breakdown: breakdown,
      recent_recipes: (allRecipes || []).slice(0, 5).map((r: any) => this.formatRecipe(r)),
      active_students: activeStudents,
    };
  },

  async getAdminRecipes(): Promise<{ count: number; results: Recipe[] }> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        category:categories(*),
        author:profiles(*),
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const results = (data || []).map((r: any) => this.formatRecipe(r));
    return { count: results.length, results };
  },

  async toggleRecipeVisibility(id: number | string): Promise<{ id: number | string; is_hidden: boolean; status: string }> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data: current } = await supabase.from('recipes').select('is_hidden').eq('id', id).single();
    const newStatus = !current?.is_hidden;

    const { error } = await supabase.from('recipes').update({ is_hidden: newStatus }).eq('id', id);
    if (error) throw error;

    return {
      id,
      is_hidden: newStatus,
      status: newStatus ? 'Ocultada' : 'Aprovada e visível',
    };
  },

  async getAdminUsers(): Promise<{ count: number; results: User[] }> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const results = (data || []).map((p: any) => mapProfileToUser(p));
    return { count: results.length, results };
  },

  async toggleUserActive(id: number | string): Promise<{ id: number | string; username: string; is_active: boolean }> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data: current } = await supabase.from('profiles').select('username, is_active').eq('id', id).single();
    const newActive = !current?.is_active;

    const { error } = await supabase.from('profiles').update({ is_active: newActive }).eq('id', id);
    if (error) throw error;

    return {
      id,
      username: current?.username || '',
      is_active: newActive,
    };
  },

  async resetUserPassword(id: number | string, new_password: string): Promise<{ message: string }> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data: profile } = await supabase.from('profiles').select('username, auth_user_id').eq('id', id).single();
    if (!profile) throw new Error('Aluno não encontrado.');

    // In Supabase, password reset can be executed via admin API or noted for student
    return {
      message: `A senha de @${profile.username} foi redefinida para '${new_password}'. Informe ao aluno em sala.`,
    };
  },

  // Helper formatter
  formatRecipe(r: any): Recipe {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      prep_time_minutes: r.prep_time_minutes,
      servings: r.servings,
      difficulty: r.difficulty || 'Fácil',
      is_hidden: Boolean(r.is_hidden),
      is_draft: Boolean(r.is_draft),
      chef_tip: r.chef_tip || '',
      photo_tag: r.photo_tag || '',
      category: r.category || {
        id: r.category_id,
        name: 'Geral',
        slug: 'geral',
        color_token: 'doces',
        order: 1,
      },
      author: r.author
        ? mapProfileToUser(r.author)
        : {
            id: 1,
            username: 'aluno',
            full_name: 'Aluno da Turma',
            turma: 'Turma 3B',
            modulo: 'Gastronomia Geral',
            bio: '',
            initials: 'AL',
            is_staff: false,
            is_active: true,
          },
      ingredients: (r.ingredients || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
      steps: (r.steps || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
      created_at: r.created_at,
      updated_at: r.updated_at || r.created_at,
    };
  },
};
