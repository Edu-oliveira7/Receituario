import React from 'react';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';

export const ChefTips: React.FC = () => {
  return (
    <section className="mt-14 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chef Tutor Practical Tip (takes 2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-7 md:p-9 border border-[#eae8e3] shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#35684b] mb-3">
              <Sparkles className="w-4 h-4 text-[#4d6700]" />
              <span>DICA DO CHEF TUTOR · AULA PRÁTICA</span>
            </div>

            <blockquote className="font-display font-bold text-xl md:text-2xl text-[#1b1c19] leading-snug mb-3">
              &ldquo;A temperatura dos ingredientes transforma uma massa comum em perfeição.&rdquo;
            </blockquote>

            <p className="text-sm text-[#414942] leading-relaxed max-w-2xl mb-6">
              Nesta semana, os alunos trabalharam técnicas de aeração em massas amanteigadas e a
              emulsão correta para coberturas espelhadas. Acompanhe as anotações completas de cada bancada.
            </p>
          </div>

          <div>
            <button
              onClick={() => {
                const el = document.getElementById('category-filter-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center space-x-2 text-sm font-bold text-[#8c1818] hover:text-[#721111] transition-colors group cursor-pointer"
            >
              <span>Ver técnicas da bancada</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Next Workshop Box */}
        <div className="bg-white rounded-3xl p-7 border border-[#eae8e3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#717972]">
                PRÓXIMA OFICINA
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#caec79] text-[#2d3b00]">
                Quinta-feira
              </span>
            </div>

            <h4 className="font-display font-bold text-lg text-[#1b1c19] mb-2">
              Pães de Fermentação Natural
            </h4>

            <p className="text-xs text-[#414942] leading-relaxed mb-6">
              Hidratação a 75%, dobras de reforço e cocção em panela de ferro fundido.
            </p>
          </div>

          <div className="pt-4 border-t border-[#f0eee9] flex items-center justify-between text-xs text-[#717972]">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#003b21]" />
              <span className="font-medium">Instrutora: Profa. Helena Vaz</span>
            </div>
            <span className="font-bold text-[#1b1c19]">14h às 18h</span>
          </div>
        </div>
      </div>
    </section>
  );
};
