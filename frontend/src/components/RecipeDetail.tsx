import React, { useState } from 'react';
import { Recipe, User } from '../types';
import { getCategoryTheme } from '../utils/theme';
import {
  ArrowLeft,
  Clock,
  Users,
  Award,
  Star,
  Printer,
  CheckCircle2,
  Edit3,
  Trash2,
  Lightbulb,
  ChefHat,
  Bookmark,
  Share2,
} from 'lucide-react';

interface RecipeDetailProps {
  recipe: Recipe;
  currentUser: User | null;
  onBack: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onStartCookingMode: (recipe: Recipe) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  currentUser,
  onBack,
  onEdit,
  onDelete,
  onStartCookingMode,
}) => {
  const theme = getCategoryTheme(recipe.category.color_token || recipe.category.slug);

  // Mise en place interactive checkboxes
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const totalIngredients = recipe.ingredients.length;
  const readyIngredients = Object.values(checkedIngredients).filter(Boolean).length;

  const isAuthor = currentUser?.id === recipe.author.id;
  const isAdmin = currentUser?.is_staff || false;
  const canModify = isAuthor || isAdmin;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="min-h-screen py-8 md:py-12 transition-colors duration-300"
      style={{ backgroundColor: theme.pageBg }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navigation & Actions Bar */}
        <div className="flex items-center justify-between mb-6 no-print">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-sm font-bold text-[#1b1c19] hover:text-[#003b21] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para Receitas</span>
          </button>

          <div className="flex items-center space-x-3">
            {canModify && (
              <div className="flex items-center space-x-2 mr-2">
                <button
                  onClick={() => onEdit(recipe)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#f5f3ee] text-[#1b1c19] border border-[#c0c9c0] shadow-2xs transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#003b21]" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#fce8e6] hover:bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Link copiado para o caderno!');
              }}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#f0eee9] border border-[#c0c9c0] text-[#414942] flex items-center justify-center transition-colors"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              className="w-9 h-9 rounded-full bg-white hover:bg-[#f0eee9] border border-[#c0c9c0] text-[#414942] flex items-center justify-center transition-colors"
              title="Guardar"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#eae8e3] shadow-xl text-center">
              <div className="w-12 h-12 rounded-full bg-[#fce8e6] text-[#ba1a1a] flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-[#1b1c19] mb-2">
                Excluir receita?
              </h3>
              <p className="text-xs text-[#414942] mb-6">
                Tem certeza que deseja remover <strong>&ldquo;{recipe.title}&rdquo;</strong> do caderno coletivo?
                {isAdmin && !isAuthor && ' (Como administrador, esta ação removerá o prato da turma.)'}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f0eee9] text-[#1b1c19] hover:bg-[#e4e2dd]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete(recipe);
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#ba1a1a] text-white hover:bg-[#93000a]"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Header Grid (Title & Hero Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          {/* Left Title & Metadata */}
          <div className="lg:col-span-7">
            {/* Category and Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: theme.background, color: theme.text }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.base }} />
                <span>{recipe.category.name}</span>
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#414942] border border-[#eae8e3]">
                {recipe.difficulty}
              </span>

              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#414942] border border-[#eae8e3]">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>4.9 (38 avaliações)</span>
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4 leading-tight"
              style={{ color: '#1b1c19' }}
            >
              {recipe.title}
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base text-[#414942] leading-relaxed mb-6 max-w-2xl">
              {recipe.description}
            </p>

            {/* Metadata Badges (3 pill cards) */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mb-8">
              <div className="bg-white rounded-2xl p-3 sm:p-4 text-center border border-[#eae8e3] shadow-2xs">
                <div className="text-[11px] font-bold text-[#717972] uppercase tracking-wide flex items-center justify-center space-x-1 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Preparo</span>
                </div>
                <div className="font-display font-bold text-base sm:text-lg text-[#1b1c19]">
                  {recipe.prep_time_minutes} min
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3 sm:p-4 text-center border border-[#eae8e3] shadow-2xs">
                <div className="text-[11px] font-bold text-[#717972] uppercase tracking-wide flex items-center justify-center space-x-1 mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Rendimento</span>
                </div>
                <div className="font-display font-bold text-base sm:text-lg text-[#1b1c19]">
                  {recipe.servings}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3 sm:p-4 text-center border border-[#eae8e3] shadow-2xs">
                <div className="text-[11px] font-bold text-[#717972] uppercase tracking-wide flex items-center justify-center space-x-1 mb-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>Dificuldade</span>
                </div>
                <div className="font-display font-bold text-base sm:text-lg text-[#1b1c19]">
                  {recipe.difficulty}
                </div>
              </div>
            </div>

            {/* Author Block */}
            <div className="flex items-center space-x-3.5 pt-4 border-t border-[#eae8e3]">
              <div className="w-12 h-12 rounded-full bg-[#d3e5d8] text-[#0e2d1d] font-display font-bold text-base flex items-center justify-center shadow-xs">
                {recipe.author.initials || 'AL'}
              </div>
              <div>
                <p className="text-xs text-[#717972]">Adicionada por</p>
                <p className="text-sm font-bold text-[#1b1c19]">{recipe.author.full_name}</p>
                <p className="text-xs text-[#414942]">{recipe.author.turma} · Turma de Gastronomia</p>
              </div>
            </div>
          </div>

          {/* Right Editorial Hero Card */}
          <div className="lg:col-span-5">
            <div
              className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md flex flex-col justify-between min-h-[340px]"
              style={{ backgroundColor: theme.base }}
            >
              {/* Decorative waves */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="flex items-center justify-between relative z-10">
                <span className="text-[11px] font-bold tracking-widest uppercase bg-black/20 px-3 py-1 rounded-full">
                  CADERNO AFETIVO
                </span>
                <span className="text-xs font-mono opacity-80">
                  Nº {typeof recipe.id === 'number' ? recipe.id * 7 + 1 : String(recipe.id).slice(0, 6).toUpperCase()}
                </span>
              </div>

              {/* Photo placeholder label in center */}
              <div className="my-8 text-center relative z-10">
                <div className="inline-block bg-white text-[#1b1c19] px-5 py-2.5 rounded-xl font-display font-bold text-xs tracking-wider uppercase shadow-md mb-3">
                  [FOTO DO PRATO]
                </div>
                <p className="text-xs text-white/90 italic font-serif max-w-xs mx-auto">
                  &ldquo;{recipe.photo_tag || recipe.title}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-white/90 relative z-10 pt-4 border-t border-white/20">
                <span className="font-serif italic">Receita da bancada</span>
                <span className="font-bold">{recipe.author.turma}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Content: 2 Columns on Desktop, 1 Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column 1: Ingredients (takes 5 cols on lg) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#eae8e3] shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#f0eee9]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.base }} />
                <h2 className="font-display font-bold text-xl text-[#1b1c19]">Ingredientes</h2>
              </div>

              {/* Mise en place counter */}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e7f2e9] text-[#286342]">
                {readyIngredients} de {totalIngredients} prontos
              </span>
            </div>

            <p className="text-xs text-[#717972] mb-4">
              Toque nos itens para riscar conforme separa na bancada (mise en place):
            </p>

            <ul className="space-y-3">
              {recipe.ingredients.map((item, idx) => {
                const isChecked = !!checkedIngredients[idx];
                return (
                  <li
                    key={idx}
                    onClick={() => toggleIngredient(idx)}
                    className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-[#fbf9f4] cursor-pointer transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by li onClick
                      className="mt-1 w-4 h-4 rounded text-[#003b21] focus:ring-[#003b21] cursor-pointer"
                    />
                    <div className="flex-1 text-xs sm:text-sm">
                      <span
                        className={`transition-all ${
                          isChecked ? 'line-through text-[#717972]' : 'text-[#1b1c19] font-medium'
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.quantity && (
                        <span className="ml-2 font-mono text-[11px] text-[#717972] font-semibold">
                          ({item.quantity})
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Chef Tip Callout */}
            {recipe.chef_tip && (
              <div className="mt-8 p-4 rounded-2xl bg-[#f8faf1] border border-[#e4ebc9] flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-[#4d6700] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#4d6700] mb-1">
                    Dica de Bancada ({recipe.author.full_name}):
                  </p>
                  <p className="text-xs text-[#414942] italic leading-relaxed">
                    &ldquo;{recipe.chef_tip}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Preparation Steps (takes 7 cols on lg) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#eae8e3] shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#f0eee9]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.base }} />
                <h2 className="font-display font-bold text-xl text-[#1b1c19]">Modo de preparo</h2>
              </div>
              <span className="text-xs text-[#717972] font-medium">Passo a passo simples</span>
            </div>

            <div className="space-y-6">
              {recipe.steps.map((step, idx) => {
                const isDone = !!completedSteps[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className="flex items-start space-x-4 group cursor-pointer"
                  >
                    {/* Numbered Circle badge */}
                    <div
                      className={`w-8 h-8 rounded-full font-display font-bold text-xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isDone ? 'bg-[#286342] text-white' : 'text-white'
                      }`}
                      style={{ backgroundColor: isDone ? '#286342' : theme.base }}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex-1">
                      {step.title && (
                        <h4
                          className={`font-display font-semibold text-sm mb-1 transition-colors ${
                            isDone ? 'text-[#717972] line-through' : 'text-[#1b1c19]'
                          }`}
                        >
                          {step.title}
                        </h4>
                      )}
                      <p
                        className={`text-xs sm:text-sm leading-relaxed ${
                          isDone ? 'text-[#717972]' : 'text-[#414942]'
                        }`}
                      >
                        {step.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Execution Bar */}
            <div className="mt-10 pt-6 border-t border-[#f0eee9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[#717972] flex items-center space-x-1.5 font-medium">
                <Clock className="w-4 h-4 text-[#003b21]" />
                <span>Tempo total estimado: {recipe.prep_time_minutes} minutos</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold bg-[#f0eee9] hover:bg-[#e4e2dd] text-[#1b1c19] flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir ficha</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartCookingMode(recipe)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#003b21] hover:bg-[#1e5236] text-white flex items-center space-x-1.5 transition-transform active:scale-95 shadow-xs"
                >
                  <ChefHat className="w-4 h-4 text-[#8ec4a0]" />
                  <span>Iniciar Modo Cozinha</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
