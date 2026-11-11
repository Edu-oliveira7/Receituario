import React from 'react';
import { BookOpen, Plus, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface BottomNavProps {
  currentUser: User | null;
  activeView: 'home' | 'my-recipes' | 'admin' | 'recipe-detail';
  onNavigate: (view: 'home' | 'my-recipes') => void;
  onOpenNewRecipe: () => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenNewRecipe,
  onOpenAuth,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fbf9f4]/95 backdrop-blur-md border-t border-[#eae8e3] py-2 px-6 flex items-center justify-around shadow-lg">
      {/* Receitas */}
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center space-y-1 transition-colors ${
          activeView === 'home' ? 'text-[#003b21]' : 'text-[#717972]'
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-[11px] font-semibold">Receitas</span>
      </button>

      {/* Prominent Nova (+) Button - ONLY visible when logged in */}
      {currentUser && (
        <button
          onClick={onOpenNewRecipe}
          className="w-12 h-12 -mt-5 rounded-full bg-[#8c1818] hover:bg-[#721111] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
          title="Nova receita"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Perfil */}
      <button
        onClick={() => {
          if (currentUser) {
            onNavigate('my-recipes');
          } else {
            onOpenAuth();
          }
        }}
        className={`flex flex-col items-center space-y-1 transition-colors ${
          activeView === 'my-recipes' ? 'text-[#003b21]' : 'text-[#717972]'
        }`}
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[11px] font-semibold">Perfil</span>
      </button>
    </nav>
  );
};
