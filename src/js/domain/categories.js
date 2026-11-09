const CATEGORIES = {
  expense: [
    { name: 'Alimentação & Mercado', icon: 'bi-cart4', color: '#ef4444', bg: '#fef2f2' },
    { name: 'Moradia & Contas', icon: 'bi-house-heart', color: '#f97316', bg: '#fff7ed' },
    {
      name: 'Transporte & Combustível',
      icon: 'bi-car-front-fill',
      color: '#eab308',
      bg: '#fefce8',
    },
    { name: 'Saúde & Farmácia', icon: 'bi-heart-pulse-fill', color: '#ec4899', bg: '#fdf2f8' },
    { name: 'Lazer & Viagens', icon: 'bi-cup-straw', color: '#8b5cf6', bg: '#f5f3ff' },
    { name: 'Compras & Vestuário', icon: 'bi-bag-heart-fill', color: '#06b6d4', bg: '#ecfeff' },
    { name: 'Educação & Cursos', icon: 'bi-book-half', color: '#3b82f6', bg: '#eff6ff' },
    { name: 'Outros Gastos', icon: 'bi-receipt', color: '#64748b', bg: '#f1f5f9' },
  ],
  investment: [
    {
      name: 'Renda Fixa (CDB / Tesouro)',
      icon: 'bi-shield-lock-fill',
      color: '#4f46e5',
      bg: '#eef2ff',
    },
    { name: 'FIIs & FI-Infra', icon: 'bi-buildings-fill', color: '#7c3aed', bg: '#f3e8ff' },
    { name: 'Ações & ETFs', icon: 'bi-graph-up-arrow', color: '#2563eb', bg: '#dbeafe' },
    { name: 'Reserva & Caixinha', icon: 'bi-safe2-fill', color: '#0d9488', bg: '#ccfbf1' },
    { name: 'Criptomoedas', icon: 'bi-currency-bitcoin', color: '#d97706', bg: '#fef3c7' },
    { name: 'Outros Investimentos', icon: 'bi-piggy-bank-fill', color: '#9333ea', bg: '#fae8ff' },
  ],
  income: [
    { name: 'Salário & Pró-labore', icon: 'bi-cash-stack', color: '#10b981', bg: '#ecfdf5' },
    { name: 'Serviços & Freelance', icon: 'bi-briefcase-fill', color: '#059669', bg: '#d1fae5' },
    { name: 'Vendas & Comércio', icon: 'bi-shop', color: '#0d9488', bg: '#ccfbf1' },
    { name: 'Rendimentos & Dividendos', icon: 'bi-graph-up', color: '#16a34a', bg: '#dcfce7' },
    { name: 'Outras Entradas', icon: 'bi-wallet-fill', color: '#22c55e', bg: '#f0fdf4' },
  ],
};

export { CATEGORIES };
