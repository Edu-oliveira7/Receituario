export interface User {
  id: number | string;
  username: string;
  full_name: string;
  turma: string;
  modulo: string;
  bio: string;
  initials: string;
  is_staff: boolean;
  is_active: boolean;
  recipes_count?: number;
  date_joined?: string;
}

export interface Category {
  id: number | string;
  name: string;
  slug: string;
  color_token: string;
  order: number;
  recipes_count?: number;
}

export interface Ingredient {
  id?: number | string;
  name: string;
  quantity: string;
  order?: number;
}

export interface Step {
  id?: number | string;
  title: string;
  text: string;
  order?: number;
}

export interface Recipe {
  id: number | string;
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

export interface AdminStats {
  total_users: number;
  published_recipes: number;
  new_this_week: number;
  hidden_recipes: number;
  total_categories: number;
}

export interface CategoryBreakdown {
  id: number;
  name: string;
  slug: string;
  count: number;
  percentage: number;
  color_token: string;
}
