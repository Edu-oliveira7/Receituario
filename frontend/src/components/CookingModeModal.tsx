import React, { useState } from 'react';
import { Recipe } from '../types';
import { getCategoryTheme } from '../utils/theme';
import { X, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';

interface CookingModeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const CookingModeModal: React.FC<CookingModeModalProps> = ({ recipe, onClose }) => {
  const theme = getCategoryTheme(recipe.category.color_token || recipe.category.slug);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = recipe.steps;
  const currentStep = steps[currentStepIndex];
  const progressPct = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#1b1c19] text-[#fbf9f4] flex flex-col justify-between p-6 sm:p-10 select-none animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: theme.base }}
          />
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Modo Cozinha: {recipe.title}
            </h2>
            <p className="text-xs text-white/60">
              Passo {currentStepIndex + 1} de {steps.length} · {progressPct}% concluído
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Sair do Modo Cozinha"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progressPct}%`, backgroundColor: theme.base }}
        />
      </div>

      {/* Center Big Typography Instruction */}
      <div className="max-w-3xl mx-auto my-auto py-10 text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-full font-display font-bold text-2xl text-white mb-6 shadow-md"
          style={{ backgroundColor: theme.base }}
        >
          {currentStepIndex + 1}
        </div>

        {currentStep.title && (
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4">
            {currentStep.title}
          </h3>
        )}

        <p className="text-lg sm:text-2xl text-white/90 font-serif leading-relaxed sm:leading-loose">
          &ldquo;{currentStep.text}&rdquo;
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="border-t border-white/10 pt-6 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button
          onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentStepIndex === 0}
          className="px-6 py-3 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Passo Anterior</span>
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-white/60">
          <Clock className="w-4 h-4" />
          <span>Tempo total sugerido: {recipe.prep_time_minutes} min</span>
        </div>

        {currentStepIndex < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
            className="px-6 py-3 rounded-full text-sm font-bold text-white flex items-center space-x-2 transition-transform active:scale-95 shadow-md cursor-pointer"
            style={{ backgroundColor: theme.base }}
          >
            <span>Próximo Passo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-full text-sm font-bold bg-[#8ec4a0] text-[#002110] flex items-center space-x-2 transition-transform active:scale-95 shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Concluir Receita!</span>
          </button>
        )}
      </div>
    </div>
  );
};
