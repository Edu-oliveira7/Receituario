import { Category, Recipe, User } from '../types';
import { supabaseService } from './supabase';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Include credentials for HttpOnly cookie session if using local server proxy
  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMessage = data.detail || data.message || 'Ocorreu um erro na requisição.';
    if (typeof data === 'object' && !data.detail && !data.message) {
      const firstKey = Object.keys(data)[0];
      if (firstKey && Array.isArray(data[firstKey])) {
        errorMessage = data[firstKey][0];
      }
    }
    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<User | null> {
    if (supabaseService.isConfigured()) {
      try {
        return await supabaseService.getCurrentUser();
      } catch (e) {
        console.warn('Supabase auth check failed:', e);
      }
    }
    try {
      return await request<User>('/api/auth/me');
    } catch {
      return null;
    }
  },

  async login(username: string, password: string): Promise<{ message: string; user: User }> {
    if (supabaseService.isConfigured()) {
      return supabaseService.login(username, password);
    }
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async register(payload: {
    full_name: string;
    username: string;
    password: string;
    password_confirm: string;
    turma?: string;
  }): Promise<{ message: string; user: User }> {
    if (supabaseService.isConfigured()) {
      return supabaseService.register(payload);
    }
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async logout(): Promise<void> {
    if (supabaseService.isConfigured()) {
      return supabaseService.logout();
    }
    await request('/api/auth/logout', { method: 'POST' });
  },

  async updateProfile(payload: Partial<User>): Promise<User> {
    if (supabaseService.isConfigured()) {
      return supabaseService.updateProfile(payload);
    }
    return request('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (supabaseService.isConfigured()) {
      try {
        const supaCats = await supabaseService.getCategories();
        if (supaCats.length > 0) return supaCats;
      } catch (e) {
        console.warn('Supabase categories fetch failed, falling back to API:', e);
      }
    }
    return request<Category[]>('/api/categories/');
  },

  // Recipes
  async getRecipes(params?: { category?: string; search?: string }): Promise<{ count: number; results: Recipe[] }> {
    if (supabaseService.isConfigured()) {
      try {
        const supaRecipes = await supabaseService.getRecipes(params);
        return { count: supaRecipes.length, results: supaRecipes };
      } catch (e) {
        console.warn('Supabase recipes fetch failed, falling back to API:', e);
      }
    }

    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'todas') searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/api/recipes/${query}`);
  },

  async getRecipe(id: number | string): Promise<Recipe> {
    if (supabaseService.isConfigured()) {
      return supabaseService.getRecipe(id);
    }
    return request<Recipe>(`/api/recipes/${id}`);
  },

  async createRecipe(payload: any): Promise<Recipe> {
    if (supabaseService.isConfigured()) {
      return supabaseService.createRecipe(payload);
    }
    return request<Recipe>('/api/recipes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateRecipe(id: number | string, payload: any): Promise<Recipe> {
    if (supabaseService.isConfigured()) {
      return supabaseService.updateRecipe(id, payload);
    }
    return request<Recipe>(`/api/recipes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteRecipe(id: number | string): Promise<void> {
    if (supabaseService.isConfigured()) {
      return supabaseService.deleteRecipe(id);
    }
    await request(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
  },

  async getMyRecipes(): Promise<{
    published_count: number;
    drafts_count: number;
    saved_count: number;
    published: Recipe[];
    drafts: Recipe[];
  }> {
    if (supabaseService.isConfigured()) {
      return supabaseService.getMyRecipes();
    }
    return request('/api/me/recipes/');
  },

  // Admin
  async getAdminOverview(): Promise<any> {
    if (supabaseService.isConfigured()) {
      return supabaseService.getAdminOverview();
    }
    return request('/api/admin/overview/');
  },

  async getAdminRecipes(): Promise<{ count: number; results: Recipe[] }> {
    if (supabaseService.isConfigured()) {
      return supabaseService.getAdminRecipes();
    }
    return request('/api/admin/recipes/');
  },

  async toggleRecipeVisibility(id: number | string): Promise<{ id: number | string; is_hidden: boolean; status: string }> {
    if (supabaseService.isConfigured()) {
      return supabaseService.toggleRecipeVisibility(id);
    }
    return request(`/api/admin/recipes/${id}/toggle-visibility`, {
      method: 'PATCH',
    });
  },

  async getAdminUsers(): Promise<{ count: number; results: User[] }> {
    if (supabaseService.isConfigured()) {
      return supabaseService.getAdminUsers();
    }
    return request('/api/admin/users/');
  },

  async toggleUserActive(id: number | string): Promise<{ id: number | string; username: string; is_active: boolean }> {
    if (supabaseService.isConfigured()) {
      return supabaseService.toggleUserActive(id);
    }
    return request(`/api/admin/users/${id}/toggle-active`, {
      method: 'PATCH',
    });
  },

  async resetUserPassword(id: number | string, new_password: string): Promise<{ message: string }> {
    if (supabaseService.isConfigured()) {
      return supabaseService.resetUserPassword(id, new_password);
    }
    return request(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    });
  },
};
