import React from 'react';
import { User } from '../types';
import { BookOpen, Plus, Shield, User as UserIcon, LogOut, LogIn } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeView: 'home' | 'my-recipes' | 'admin' | 'recipe-detail';
  onNavigate: (view: 'home' | 'my-recipes' | 'admin') => void;
  onOpenNewRecipe: () => void;
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenNewRecipe,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#fbf9f4]/95 backdrop-blur-md border-b border-[#eae8e3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-left group transition-transform active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-[#003b21] text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-[#8ec4a0]" />
            </div>
            <div>
              <span className="font-display font-bold text-2xl tracking-tight text-[#1b1c19] group-hover:text-[#003b21] transition-colors">
                Receituário
              </span>
            </div>
          </button>

          {/* Admin badge if user is staff */}
          {currentUser?.is_staff && (
            <button
              onClick={() => onNavigate('admin')}
              className={`hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors ${
                activeView === 'admin'
                  ? 'bg-[#003b21] text-[#8ec4a0]'
                  : 'bg-[#e4e2dd] text-[#414942] hover:bg-[#d8d6d0]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>PAINEL ADMIN</span>
            </button>
          )}
        </div>

        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex items-center space-x-6">
          <button
            onClick={() => onNavigate('home')}
            className={`text-sm font-semibold transition-colors ${
              activeView === 'home'
                ? 'text-[#003b21] border-b-2 border-[#003b21] pb-1'
                : 'text-[#414942] hover:text-[#1b1c19]'
            }`}
          >
            Receitas
          </button>

          {currentUser ? (
            <button
              onClick={() => onNavigate('my-recipes')}
              className={`text-sm font-semibold transition-colors ${
                activeView === 'my-recipes'
                  ? 'text-[#003b21] border-b-2 border-[#003b21] pb-1'
                : 'text-[#414942] hover:text-[#1b1c19]'
              }`}
            >
              Minhas receitas
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="text-sm font-semibold text-[#414942] hover:text-[#1b1c19] transition-colors"
            >
              Minhas receitas
            </button>
          )}

          {/* New Recipe button in rich brand wine/burgundy - ONLY visible when logged in */}
          {currentUser && (
            <button
              onClick={onOpenNewRecipe}
              className="inline-flex items-center space-x-2 bg-[#8c1818] hover:bg-[#721111] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nova receita</span>
            </button>
          )}

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-[#e4e2dd]">
              <button
                onClick={() => onNavigate('my-recipes')}
                title={`Perfil de ${currentUser.full_name}`}
                className="w-10 h-10 rounded-full bg-[#d3e5d8] text-[#0e2d1d] font-display font-bold text-sm flex items-center justify-center hover:ring-2 hover:ring-[#003b21] transition-all"
              >
                {currentUser.initials || 'AL'}
              </button>
              <button
                onClick={onLogout}
                title="Sair da conta"
                className="p-2 text-[#717972] hover:text-[#ba1a1a] transition-colors rounded-full hover:bg-[#eae8e3]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="inline-flex items-center space-x-2 border border-[#c0c9c0] bg-white hover:bg-[#f5f3ee] text-[#1b1c19] px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            >
              <LogIn className="w-4 h-4 text-[#003b21]" />
              <span>Entrar</span>
            </button>
          )}
        </div>

        {/* Mobile top actions */}
        <div className="flex md:hidden items-center space-x-2">
          {currentUser?.is_staff && (
            <button
              onClick={() => onNavigate('admin')}
              className="p-2 text-[#003b21] hover:bg-[#e4e2dd] rounded-full"
              title="Painel Admin"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}
          {currentUser ? (
            <button
              onClick={() => onNavigate('my-recipes')}
              className="w-9 h-9 rounded-full bg-[#d3e5d8] text-[#0e2d1d] font-display font-bold text-xs flex items-center justify-center"
            >
              {currentUser.initials || 'AL'}
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="w-9 h-9 rounded-full bg-[#e4e2dd] text-[#1b1c19] flex items-center justify-center"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
