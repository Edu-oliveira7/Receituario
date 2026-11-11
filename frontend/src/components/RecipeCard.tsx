import React from 'react';
import { Recipe } from '../types';
import { getCategoryTheme } from '../utils/theme';
import { Clock, Bookmark, ArrowRight, Edit, Trash2 } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  showActions?: boolean;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  showActions = false,
  onEdit,
  onDelete,
}) => {
  const theme = getCategoryTheme(recipe.category.color_token || recipe.category.slug);

  return (
    <article
      onClick={() => onSelect(recipe)}
      className="group bg-white rounded-2xl border border-[#eae8e3] overflow-hidden shadow-xs hover:shadow-md hover:border-[#c0c9c0] transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Visual Category Banner Header with Photo Tag */}
        <div
          className="h-44 w-full flex flex-col items-center justify-center p-4 relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]"
          style={{ backgroundColor: theme.background }}
        >
          {/* Decorative watermark pattern */}
          <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none">
            <div
              className="w-24 h-24 rounded-full border-8"
              style={{ borderColor: theme.base }}
            />
          </div>

          {/* Central Photo Placeholder Chip */}
          <div className="bg-white/90 backdrop-blur-xs px-3.5 py-1 rounded-md shadow-xs border border-white/60 mb-1.5">
            <span
              className="font-display font-bold text-xs tracking-wider uppercase"
              style={{ color: theme.text }}
            >
              [FOTO DA RECEITA]
            </span>
          </div>

          <p
            className="text-xs italic text-center font-serif line-clamp-1 max-w-[85%]"
            style={{ color: theme.text }}
          >
            {recipe.photo_tag || recipe.category.name}
          </p>
        </div>

        {/* Card Content */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-2.5">
            {/* Category Chip */}
            <span
              className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: theme.badgeBg, color: theme.text }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.base }}
              />
              <span>{recipe.category.name}</span>
            </span>

            {/* Bookmark Icon (Inactive per instructions) */}
            <div className="text-[#a0a8a0] hover:text-[#003b21] transition-colors" title="Guardar receita">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>

          {/* Recipe Title */}
          <h3 className="font-display font-semibold text-lg text-[#1b1c19] group-hover:text-[#003b21] transition-colors line-clamp-1 mb-1.5">
            {recipe.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-[#414942] line-clamp-2 leading-relaxed mb-4">
            {recipe.description}
          </p>
        </div>
      </div>

      {/* Footer Meta & Author */}
      <div className="px-5 pb-5 pt-0">
        <div className="pt-3 border-t border-[#f0eee9] flex items-center justify-between text-xs text-[#717972]">
          <div className="flex items-center space-x-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#717972]" />
            <span>{recipe.prep_time_minutes} min · {recipe.servings}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-[#d3e5d8] text-[#0e2d1d] font-display font-bold text-[10px] flex items-center justify-center">
              {recipe.author.initials || 'AL'}
            </div>
            <span className="text-xs text-[#414942] font-medium hidden sm:inline">
              por {recipe.author.full_name}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#003b21] sm:hidden" />
          </div>
        </div>

        {/* Owner/Admin Action buttons (when rendered in My Recipes or Admin) */}
        {showActions && (
          <div className="mt-3 pt-3 border-t border-[#f0eee9] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(recipe);
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-semibold bg-[#f0eee9] hover:bg-[#e4e2dd] text-[#1b1c19] transition-colors"
                >
                  <Edit className="w-3 h-3 text-[#414942]" />
                  <span>Editar</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(recipe);
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#fce8e6] hover:bg-[#fbd3cf] text-[#ba1a1a] transition-colors"
                  title="Excluir receita"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Excluir</span>
                </button>
              )}
            </div>

            <span className="text-xs font-semibold text-[#003b21] flex items-center space-x-1">
              <span>Ver receita</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
