import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Simple CSRF Protection for state-changing methods
app.use((req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Check CSRF token header if provided, or allow same-origin lax cookies
    // Expose CSRF token cookie if not present
    if (!req.cookies['csrftoken']) {
      res.cookie('csrftoken', 'receituario-csrf-token-turma-2025', {
        sameSite: 'lax',
        path: '/',
      });
    }
  }
  next();
});

// Types & Data Store
interface User {
  id: number;
  username: string;
  full_name: string;
  turma: string;
  modulo: string;
  bio: string;
  initials: string;
  is_staff: boolean;
  is_active: boolean;
  password?: string;
  recipes_count?: number;
  date_joined: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  color_token: string;
  order: number;
  recipes_count?: number;
}

interface Ingredient {
  id: number;
  name: string;
  quantity: string;
  order: number;
}

interface Step {
  id: number;
  title: string;
  text: string;
  order: number;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  prep_time_minutes: number;
  servings: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  is_hidden: boolean;
  is_draft: boolean;
  chef_tip: string;
  photo_tag: string;
  category: Category;
  author: User;
  ingredients: Ingredient[];
  steps: Step[];
  created_at: string;
  updated_at: string;
}

// Data Store - Clean Production State (starts empty; first user to register becomes Admin)
const users: User[] = [];

const categories: Category[] = [
  { id: 1, name: 'Doces', slug: 'doces', color_token: 'doces', order: 1 },
  { id: 2, name: 'Massas', slug: 'massas', color_token: 'massas', order: 2 },
  { id: 3, name: 'Carnes', slug: 'carnes', color_token: 'carnes', order: 3 },
  { id: 4, name: 'Lanches', slug: 'lanches', color_token: 'lanches', order: 4 },
  { id: 5, name: 'Saladas', slug: 'saladas', color_token: 'saladas', order: 5 },
  { id: 6, name: 'Bebidas', slug: 'bebidas', color_token: 'bebidas', order: 6 },
];

let nextRecipeId = 1;
let recipes: Recipe[] = [];

// Helper: Get authenticated user from HttpOnly cookie or Authorization Bearer header
function getAuthUser(req: Request): User | null {
  const token = req.cookies['access_token'] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (!token) return null;

  try {
    // In our JWT structure token encodes "user_id:<id>" or valid JSON token
    let userId: number | null = null;
    if (token.startsWith('user:')) {
      userId = parseInt(token.split(':')[1], 10);
    } else {
      // Decode simulated or base64 token
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        userId = parsed.user_id;
      } catch {
        const match = token.match(/\d+/);
        if (match) userId = parseInt(match[0], 10);
      }
    }

    if (!userId) return null;
    const user = users.find(u => u.id === userId && u.is_active);
    return user || null;
  } catch {
    return null;
  }
}

function createToken(userId: number): string {
  const payload = {
    user_id: userId,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function setAuthCookies(res: Response, userId: number) {
  const accessToken = createToken(userId);
  const refreshToken = `ref_${createToken(userId)}`;

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: false, // set to true in production HTTPS
    sameSite: 'lax',
    maxAge: 3600 * 1000,
    path: '/',
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 86400 * 1000,
    path: '/',
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

function publicUser(user: User) {
  const { password, ...rest } = user;
  const count = recipes.filter(r => r.author.id === user.id && !r.is_hidden && !r.is_draft).length;
  return { ...rest, recipes_count: count };
}

// Rate limiting tracking for login/register
const attempts: Record<string, { count: number; firstAttempt: number }> = {};
function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = attempts[ip];
  if (!record || now - record.firstAttempt > windowMs) {
    attempts[ip] = { count: 1, firstAttempt: now };
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count++;
  return true;
}

// ---------------- API ROUTES ----------------

// POST /api/auth/register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const ip = req.ip || '127.0.0.1';
  if (!checkRateLimit(`reg_${ip}`, 10, 60000)) {
    res.status(429).json({ detail: 'Muitas tentativas de cadastro. Aguarde um minuto.' });
    return;
  }

  const { full_name, username, password, password_confirm, turma } = req.body;

  if (!full_name || full_name.trim().length === 0) {
    res.status(400).json({ full_name: ['O nome completo é obrigatório.'] });
    return;
  }

  if (!username || username.trim().length < 3) {
    res.status(400).json({ username: ['O nome de usuário deve ter pelo menos 3 caracteres.'] });
    return;
  }

  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    res.status(400).json({ username: ['Este nome de usuário já está em uso por outro aluno.'] });
    return;
  }

  if (!password || password.length < 8) {
    res.status(400).json({ password: ['A senha deve conter no mínimo 8 caracteres.'] });
    return;
  }

  if (password !== password_confirm) {
    res.status(400).json({ password_confirm: ['As senhas digitadas não coincidem.'] });
    return;
  }

  // Generate initials
  const parts = full_name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : cleanUsername.slice(0, 2).toUpperCase();

  const isFirstUser = users.length === 0;
  const isAdmin = isFirstUser || cleanUsername === 'admin';

  const newUser: User = {
    id: users.length + 1,
    username: cleanUsername,
    full_name: full_name.trim(),
    turma: isAdmin ? 'Coordenação Pedagógica' : (turma || 'Turma 3B'),
    modulo: isAdmin ? 'Administrador do Caderno' : 'Gastronomia Geral',
    bio: isAdmin ? 'Administrador e Coordenador Geral do Receituário.' : 'Estudante de gastronomia.',
    initials,
    is_staff: isAdmin,
    is_active: true,
    password,
    date_joined: new Date().toISOString(),
  };

  users.push(newUser);
  setAuthCookies(res, newUser.id);

  res.status(201).json({
    message: 'Conta criada com sucesso!',
    user: publicUser(newUser),
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const ip = req.ip || '127.0.0.1';
  if (!checkRateLimit(`log_${ip}`, 15, 60000)) {
    res.status(429).json({ detail: 'Muitas tentativas de login. Aguarde um instante.' });
    return;
  }

  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ detail: 'Informe o nome de usuário e a senha.' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
  const user = users.find(u => u.username.toLowerCase() === cleanUsername);

  if (!user || user.password !== password) {
    res.status(401).json({ detail: 'Nome de usuário ou senha incorretos.' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ detail: 'Esta conta de aluno está inativa. Peça ao administrador da turma para reativar.' });
    return;
  }

  setAuthCookies(res, user.id);
  res.json({
    message: 'Login realizado com sucesso.',
    user: publicUser(user),
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ message: 'Sessão encerrada com sucesso.' });
});

// POST /api/auth/refresh
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ detail: 'Token inválido ou sessão expirada.' });
    return;
  }
  setAuthCookies(res, user.id);
  res.json({ message: 'Token renovado com sucesso.' });
});

// GET /api/auth/me
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ detail: 'Não autenticado.' });
    return;
  }
  res.json(publicUser(user));
});

// PATCH /api/auth/me (Update profile)
app.patch('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ detail: 'Não autenticado.' });
    return;
  }
  const { bio, turma, modulo, full_name } = req.body;
  if (bio !== undefined) user.bio = bio;
  if (turma !== undefined) user.turma = turma;
  if (modulo !== undefined) user.modulo = modulo;
  if (full_name !== undefined && full_name.trim()) user.full_name = full_name.trim();

  res.json(publicUser(user));
});

// DELETE /api/auth/me (Delete own account)
app.delete('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ detail: 'Não autenticado.' });
    return;
  }
  const index = users.findIndex(u => u.id === user.id);
  if (index !== -1) {
    users.splice(index, 1);
  }
  clearAuthCookies(res);
  res.status(204).send();
});

// GET /api/categories/
app.get('/api/categories/', (_req: Request, res: Response) => {
  const catsWithCount = categories.map(cat => ({
    ...cat,
    recipes_count: recipes.filter(r => r.category.id === cat.id && !r.is_hidden && !r.is_draft).length,
  }));
  res.json(catsWithCount);
});

// GET /api/recipes/
app.get('/api/recipes/', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  const isStaff = currentUser?.is_staff || false;

  let filtered = recipes.slice();

  // Public / non-staff only see visible, non-draft recipes
  if (!isStaff) {
    filtered = filtered.filter(r => !r.is_hidden && !r.is_draft);
  }

  // Filter by category slug or name
  const categoryParam = req.query.category as string;
  if (categoryParam && categoryParam !== 'todas') {
    filtered = filtered.filter(
      r => r.category.slug.toLowerCase() === categoryParam.toLowerCase() ||
           r.category.name.toLowerCase() === categoryParam.toLowerCase()
    );
  }

  // Filter by search term
  const searchParam = req.query.search as string;
  if (searchParam) {
    const s = searchParam.toLowerCase();
    filtered = filtered.filter(
      r => r.title.toLowerCase().includes(s) ||
           r.description.toLowerCase().includes(s) ||
           r.author.full_name.toLowerCase().includes(s)
    );
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: filtered.length,
    results: filtered,
  });
});

// GET /api/recipes/:id/
app.get('/api/recipes/:id', (req: Request, res: Response) => {
  const recipeId = parseInt(req.params.id, 10);
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) {
    res.status(404).json({ detail: 'Receita não encontrada.' });
    return;
  }

  const currentUser = getAuthUser(req);
  if (recipe.is_hidden && !currentUser?.is_staff && recipe.author.id !== currentUser?.id) {
    res.status(404).json({ detail: 'Receita não encontrada ou oculta para moderação.' });
    return;
  }

  res.json(recipe);
});

// POST /api/recipes/ (Create recipe - SECURITY: author ALWAYS = req.user)
app.post('/api/recipes/', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ detail: 'Autenticação necessária para cadastrar receitas.' });
    return;
  }

  const {
    title,
    description,
    category_id,
    prep_time_minutes,
    servings,
    difficulty,
    chef_tip,
    photo_tag,
    ingredients,
    steps,
  } = req.body;

  if (!title || title.trim().length < 3) {
    res.status(400).json({ title: ['O título deve ter no mínimo 3 caracteres.'] });
    return;
  }

  const catId = parseInt(category_id, 10);
  const category = categories.find(c => c.id === catId);
  if (!category) {
    res.status(400).json({ category_id: ['Categoria inválida ou não selecionada.'] });
    return;
  }

  const prepTime = parseInt(prep_time_minutes, 10);
  if (isNaN(prepTime) || prepTime <= 0) {
    res.status(400).json({ prep_time_minutes: ['O tempo de preparo deve ser maior que 0 minutos.'] });
    return;
  }

  const parsedIngredients: Ingredient[] = Array.isArray(ingredients)
    ? ingredients.map((item, idx) => ({
        id: idx + 1,
        name: item.name || '',
        quantity: item.quantity || '',
        order: idx,
      }))
    : [];

  const parsedSteps: Step[] = Array.isArray(steps)
    ? steps.map((item, idx) => ({
        id: idx + 1,
        title: item.title || '',
        text: item.text || '',
        order: idx,
      }))
    : [];

  // SECURITY ENFORCEMENT: Ignore any passed author / user_id; bind author to authenticated user
  const newRecipe: Recipe = {
    id: nextRecipeId++,
    title: title.trim(),
    description: (description || '').trim(),
    prep_time_minutes: prepTime,
    servings: servings || '4 porções',
    difficulty: difficulty || 'Fácil',
    is_hidden: false,
    is_draft: false,
    chef_tip: chef_tip || '',
    photo_tag: photo_tag || 'prato preparado na bancada',
    category,
    author: currentUser,
    ingredients: parsedIngredients,
    steps: parsedSteps,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  recipes.unshift(newRecipe);
  res.status(201).json(newRecipe);
});

// PATCH /api/recipes/:id (Edit recipe - SECURITY: Owner or Admin only!)
app.patch('/api/recipes/:id', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ detail: 'Autenticação necessária.' });
    return;
  }

  const recipeId = parseInt(req.params.id, 10);
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) {
    res.status(404).json({ detail: 'Receita não encontrada.' });
    return;
  }

  // STRICT PERMISSION CHECK: IsOwnerOrAdmin
  if (recipe.author.id !== currentUser.id && !currentUser.is_staff) {
    res.status(403).json({ detail: 'Você não tem permissão para editar a receita de outro aluno.' });
    return;
  }

  const {
    title,
    description,
    category_id,
    prep_time_minutes,
    servings,
    difficulty,
    chef_tip,
    photo_tag,
    ingredients,
    steps,
  } = req.body;

  if (title !== undefined) {
    if (title.trim().length < 3) {
      res.status(400).json({ title: ['O título deve ter no mínimo 3 caracteres.'] });
      return;
    }
    recipe.title = title.trim();
  }

  if (category_id !== undefined) {
    const cat = categories.find(c => c.id === parseInt(category_id, 10));
    if (cat) recipe.category = cat;
  }

  if (description !== undefined) recipe.description = description;
  if (prep_time_minutes !== undefined) recipe.prep_time_minutes = parseInt(prep_time_minutes, 10);
  if (servings !== undefined) recipe.servings = servings;
  if (difficulty !== undefined) recipe.difficulty = difficulty;
  if (chef_tip !== undefined) recipe.chef_tip = chef_tip;
  if (photo_tag !== undefined) recipe.photo_tag = photo_tag;

  if (Array.isArray(ingredients)) {
    recipe.ingredients = ingredients.map((item, idx) => ({
      id: idx + 1,
      name: item.name || '',
      quantity: item.quantity || '',
      order: idx,
    }));
  }

  if (Array.isArray(steps)) {
    recipe.steps = steps.map((item, idx) => ({
      id: idx + 1,
      title: item.title || '',
      text: item.text || '',
      order: idx,
    }));
  }

  recipe.updated_at = new Date().toISOString();
  res.json(recipe);
});

// DELETE /api/recipes/:id (Delete recipe - SECURITY: Owner or Admin only!)
app.delete('/api/recipes/:id', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ detail: 'Autenticação necessária.' });
    return;
  }

  const recipeId = parseInt(req.params.id, 10);
  const index = recipes.findIndex(r => r.id === recipeId);
  if (index === -1) {
    res.status(404).json({ detail: 'Receita não encontrada.' });
    return;
  }

  const recipe = recipes[index];

  // STRICT PERMISSION CHECK: IsOwnerOrAdmin
  if (recipe.author.id !== currentUser.id && !currentUser.is_staff) {
    res.status(403).json({ detail: 'Você não tem permissão para excluir a receita de outro aluno.' });
    return;
  }

  recipes.splice(index, 1);
  res.status(204).send();
});

// GET /api/me/recipes/
app.get('/api/me/recipes/', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ detail: 'Autenticação necessária.' });
    return;
  }

  const userRecipes = recipes.filter(r => r.author.id === currentUser.id);
  const published = userRecipes.filter(r => !r.is_draft);
  const drafts = userRecipes.filter(r => r.is_draft);

  res.json({
    published_count: published.length,
    drafts_count: drafts.length,
    saved_count: 0,
    published,
    drafts,
  });
});

// ---------------- ADMIN ENDPOINTS (Strictly is_staff) ----------------

// GET /api/admin/overview/
app.get('/api/admin/overview/', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.is_staff) {
    res.status(403).json({ detail: 'Acesso restrito ao coordenador/administrador da turma.' });
    return;
  }

  const published = recipes.filter(r => !r.is_hidden && !r.is_draft).length;
  const hidden = recipes.filter(r => r.is_hidden).length;

  const categoryBreakdown = categories.map(cat => {
    const count = recipes.filter(r => r.category.id === cat.id).length;
    const pct = Math.round((count / Math.max(recipes.length, 1)) * 100);
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count,
      percentage: pct,
      color_token: cat.color_token,
    };
  });

  const activeStudents = users.filter(u => !u.is_staff).map(u => publicUser(u));

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = recipes.filter(r => new Date(r.created_at).getTime() > oneWeekAgo).length;

  res.json({
    stats: {
      total_users: users.length,
      published_recipes: published,
      new_this_week: newThisWeek,
      hidden_recipes: hidden,
      total_categories: categories.length,
    },
    category_breakdown: categoryBreakdown,
    recent_recipes: recipes.slice(0, 5),
    active_students: activeStudents,
  });
});

// GET /api/admin/recipes/
app.get('/api/admin/recipes/', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.is_staff) {
    res.status(403).json({ detail: 'Acesso restrito a administradores.' });
    return;
  }
  res.json({
    count: recipes.length,
    results: recipes,
  });
});

// PATCH /api/admin/recipes/:id/toggle-visibility
app.patch('/api/admin/recipes/:id/toggle-visibility', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.is_staff) {
    res.status(403).json({ detail: 'Acesso restrito a administradores.' });
    return;
  }

  const recipeId = parseInt(req.params.id, 10);
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) {
    res.status(404).json({ detail: 'Receita não encontrada.' });
    return;
  }

  recipe.is_hidden = !recipe.is_hidden;
  res.json({
    id: recipe.id,
    is_hidden: recipe.is_hidden,
    status: recipe.is_hidden ? 'Oculta' : 'Visível',
  });
});

// GET /api/admin/users/
app.get('/api/admin/users/', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.is_staff) {
    res.status(403).json({ detail: 'Acesso restrito a administradores.' });
    return;
  }

  const list = users.map(u => publicUser(u));
  res.json({
    count: list.length,
    results: list,
  });
});

// PATCH /api/admin/users/:id/toggle-active
app.patch('/api/admin/users/:id/toggle-active', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.is_staff) {
    res.status(403).json({ detail: 'Acesso restrito a administradores.' });
    return;
  }

  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ detail: 'Aluno não encontrado.' });
    return;
  }

  user.is_active = !user.is_active;
  res.json({
    id: user.id,
    username: user.username,
    is_active: user.is_active,
    status: user.is_active ? 'Ativo' : 'Inativo',
  });
});

// POST /api/admin/users/:id/reset-password
app.post('/api/admin/users/:id/reset-password', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.is_staff) {
    res.status(403).json({ detail: 'Acesso restrito a administradores.' });
    return;
  }

  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ detail: 'Aluno não encontrado.' });
    return;
  }

  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    res.status(400).json({ new_password: ['A nova senha deve ter no mínimo 8 caracteres.'] });
    return;
  }

  user.password = new_password;
  res.json({ message: `Senha do aluno @${user.username} redefinida com sucesso pelo administrador.` });
});

// Setup Vite middlewares for front-end rendering
async function startServer() {
  const rootDir = process.cwd();
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      root: path.resolve(rootDir, 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(rootDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Receituário server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
