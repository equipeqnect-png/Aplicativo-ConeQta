import { Producer, Product, AppUser, SealItem, ReviewItem, CategoryDef, Order, ChatMessage, SeasonalBasket, ProducerStory } from '../types';

export const INITIAL_PRODUCERS: Producer[] = [];

// No invented products or prices
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr_admin',
    name: 'Admin ConeQta',
    email: 'admin@coneqta.app',
    password: '123456',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    phone: '(21) 99999-0000',
    verified: true,
    createdAt: '2026-01-01',
  }
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_SEALS: SealItem[] = [
  {
    id: 'familiar',
    title: 'Comércio Familiar Local',
    badge: 'FAMILIAR',
    description: 'Empreendimento familiar de Queimados com geração de renda e fortalecimento comunitário.',
    icon: 'Users',
    color: 'amber',
    activeCount: 0,
  },
  {
    id: 'artesanal',
    title: 'Produção Artesanal',
    badge: 'ARTESANAL',
    description: 'Processamento caseiro e tradicional sem aditivos industriais.',
    icon: 'Sparkles',
    color: 'orange',
    activeCount: 0,
  },
  {
    id: 'selo_verde',
    title: 'Selo Verde Queimados',
    badge: 'SELO VERDE',
    description: 'Certificação municipal do Desafio Liga Jovem • Equipe Q-NECT para sustentabilidade e comércio local.',
    icon: 'Award',
    color: 'green',
    activeCount: 0,
  }
];

export const INITIAL_CATEGORIES: CategoryDef[] = [
  { id: 'todos', name: 'Todos', icon: 'Grid', count: 0, color: '#4E553D' },
  { id: 'produtos_agricolas', name: 'Produtos agrícolas', icon: 'Sprout', count: 0, color: '#16A34A' },
  { id: 'gastronomia', name: 'Gastronomia', icon: 'Utensils', count: 0, color: '#D97706' },
  { id: 'estetica_beleza', name: 'Estética e beleza', icon: 'Sparkles', count: 0, color: '#EC4899' },
  { id: 'vestuario', name: 'Vestuário', icon: 'Shirt', count: 0, color: '#6366F1' },
  { id: 'artesanato', name: 'Artesanato', icon: 'Palette', count: 0, color: '#8B5CF6' },
  { id: 'outros', name: 'Outros', icon: 'Tag', count: 0, color: '#64748B' },
];

export const INITIAL_REVIEWS: ReviewItem[] = [];

export const INITIAL_STORIES: ProducerStory[] = [];

export const INITIAL_CHATS: ChatMessage[] = [];

export const SEASONAL_BASKETS: SeasonalBasket[] = [];

