export interface CategoryTheme {
  base: string;          // Primary category accent dot & borders
  background: string;    // Soft card image placeholder & pill
  text: string;          // Deep contrasting readable text
  badgeBg: string;       // Background for category chip
  pageBg: string;        // Full page tint for Recipe Detail
  lightTag: string;
  name: string;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  doces: {
    base: '#E8772E',
    background: '#FFE2C6',
    text: '#7A3E0A',
    badgeBg: '#FFF0E3',
    pageBg: '#FAF4EC',
    lightTag: '#FFF5EB',
    name: 'Doces & Sobremesas',
  },
  massas: {
    base: '#E3B23C',
    background: '#FFF1CC',
    text: '#6B4E00',
    badgeBg: '#FFF9E8',
    pageBg: '#FAF7EE',
    lightTag: '#FFF9E6',
    name: 'Massas & Molhos Artesanais',
  },
  carnes: {
    base: '#C7381F',
    background: '#F6D5CF',
    text: '#8C2A1C',
    badgeBg: '#FCECE9',
    pageBg: '#FAF3F2',
    lightTag: '#FDEEED',
    name: 'Proteínas & Assados',
  },
  lanches: {
    base: '#7C9A2A',
    background: '#E4EBC9',
    text: '#4B5E12',
    badgeBg: '#F2F6E6',
    pageBg: '#F8FAF2',
    lightTag: '#EDF3D9',
    name: 'Sanduíches & Panificação',
  },
  saladas: {
    base: '#4C9A47',
    background: '#D8EBD3',
    text: '#2F6B2A',
    badgeBg: '#EEF7EC',
    pageBg: '#F4FAF3',
    lightTag: '#E8F4E6',
    name: 'Hortaliças & Grãos Frescos',
  },
  bebidas: {
    base: '#3A8DBF',
    background: '#D3E6F2',
    text: '#1F5F86',
    badgeBg: '#ECF4F9',
    pageBg: '#F3F8FC',
    lightTag: '#E6F2FA',
    name: 'Infusões, Sucos & Fermentados',
  },
};

export function getCategoryTheme(slugOrToken: string): CategoryTheme {
  const key = (slugOrToken || '').toLowerCase();
  return CATEGORY_THEMES[key] || CATEGORY_THEMES.doces;
}
