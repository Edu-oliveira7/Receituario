import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-[#eae8e3] bg-[#fbf9f4] pt-12 pb-20 md:pb-12 text-[#414942]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-[#eae8e3]">
          <div>
            <h3 className="font-display font-bold text-xl text-[#1b1c19] mb-1">
              Receituário
            </h3>
            <p className="text-xs text-[#717972]">
              Livro colaborativo de culinária e afetos da turma de gastronomia.
            </p>
          </div>

          <nav className="flex items-center space-x-6 text-xs font-semibold text-[#414942]">
            <a href="#catalogo" className="hover:text-[#003b21] transition-colors">
              Acervo Coletivo
            </a>
            <a href="#pessoal" className="hover:text-[#003b21] transition-colors">
              Caderno Pessoal
            </a>
            <a href="#comunidade" className="hover:text-[#003b21] transition-colors">
              Comunidade
            </a>
          </nav>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#717972] gap-3">
          <p>© 2025 Receituário Coletivo. Feito à mão para cozinhar juntos.</p>
          <p className="font-medium text-[#1b1c19]">Organizado pela Turma Gastronômica</p>
        </div>
      </div>
    </footer>
  );
};
