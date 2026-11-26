import React, { useState, useEffect } from 'react';
import {
  Search,
  Trophy,
  Star,
  User,
  MapPin,
  Leaf,
  Store,
  Flag,
  MessageCircle,
  ExternalLink,
  Package,
} from 'lucide-react';
import { Product, Producer, AppUser, ProducerStory, ReviewItem, Order } from '../types';
import { UserAddressConfig, StorageService } from '../services/storage';
import { StoriesBar } from './StoriesBar';
import { StoryViewerModal } from './StoryViewerModal';
import { StoryPostModal } from './StoryPostModal';
import { RankingView } from './RankingView';

interface ConsumerViewProps {
  currentUser: AppUser;
  currentAddress: UserAddressConfig;
  onOpenAddressModal: () => void;
  products: Product[];
  producers: Producer[];
  reviews: ReviewItem[];
  orders?: Order[];
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
  onOpenProductDetail: (product: Product) => void;
  onOpenProducerProfile: (producer: Producer) => void;
  onReportProducer: (producer: Producer) => void;
}

export const ConsumerView: React.FC<ConsumerViewProps> = ({
  currentUser,
  currentAddress,
  onOpenAddressModal,
  products,
  producers,
  reviews,
  orders = [],
  favorites,
  onToggleFavorite,
  onOpenProductDetail,
  onOpenProducerProfile,
  onReportProducer,
}) => {
  const [activePill, setActivePill] = useState<'catalogo' | 'lojas' | 'ranking' | 'favorites' | 'profile'>('catalogo');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Stories state
  const [stories, setStories] = useState<ProducerStory[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isPostStoryOpen, setIsPostStoryOpen] = useState(false);

  const loadStories = () => {
    setStories(StorageService.getStories());
  };

  useEffect(() => {
    loadStories();
    const handleUpdate = () => loadStories();
    window.addEventListener('coneqta_stories_updated', handleUpdate);
    return () => window.removeEventListener('coneqta_stories_updated', handleUpdate);
  }, []);

  const categoriesList = [
    { id: 'todos', name: 'Todos' },
    { id: 'produtos_agricolas', name: 'Produtos agrícolas' },
    { id: 'gastronomia', name: 'Gastronomia' },
    { id: 'estetica_beleza', name: 'Estética e beleza' },
    { id: 'vestuario', name: 'Vestuário' },
    { id: 'artesanato', name: 'Artesanato' },
    { id: 'outros', name: 'Outros' },
  ];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'todos' && p.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchFarm = (p.producerFarm || p.producerName || '').toLowerCase().includes(q);
      const matchCustomCat = (p.customCategory || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchFarm && !matchCustomCat) return false;
    }
    return true;
  });

  const filteredProducers = producers.filter((prod) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (prod.farmName || '').toLowerCase().includes(q) ||
      (prod.name || '').toLowerCase().includes(q) ||
      (prod.specialty || '').toLowerCase().includes(q) ||
      (prod.location?.neighborhood || '').toLowerCase().includes(q)
    );
  });

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="space-y-6">
      {/* 1. Welcome Olive Banner (#4E553D) */}
      <div className="bg-[#4E553D] text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="text-[10px] font-extrabold tracking-widest uppercase text-lime-200">
            CATÁLOGO LOCAL DE QUEIMADOS
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
            Olá, {currentUser.name}!
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-stone-200">
            <MapPin className="w-3.5 h-3.5 text-lime-300 shrink-0" />
            <span>
              Sua região: <strong className="text-white">{currentAddress.address} • {currentAddress.neighborhood}</strong>
            </span>
          </div>
        </div>

        <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 flex flex-col items-start sm:items-end justify-center gap-1 relative z-10">
          <div className="text-[9px] font-bold tracking-widest text-stone-300 uppercase">
            ALTERAR LOCAL PARA RECALCULAR DISTÂNCIAS
          </div>
          <button
            type="button"
            onClick={onOpenAddressModal}
            className="px-3.5 py-1.5 bg-white text-[#4E553D] hover:bg-stone-100 font-bold text-xs rounded-xl shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{currentAddress.label}</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Pills Bar */}
      <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-2 border border-stone-200/80 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => setActivePill('catalogo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePill === 'catalogo'
                ? 'bg-[#4E553D] text-white shadow-2xs'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>Catálogo</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePill('lojas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePill === 'lojas'
                ? 'bg-[#4E553D] text-white shadow-2xs'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Vendedores & Lojas ({producers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePill('ranking')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePill === 'ranking'
                ? 'bg-[#4E553D] text-white shadow-2xs'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Ranking</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePill('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePill === 'favorites'
                ? 'bg-[#4E553D] text-white shadow-2xs'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Favoritos ({favoriteProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePill('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePill === 'profile'
                ? 'bg-[#4E553D] text-white shadow-2xs'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Meu Perfil</span>
          </button>
        </div>
      </div>

      {/* Stories Carousel Bar */}
      {activePill !== 'ranking' && (
        <StoriesBar
          stories={stories}
          currentUser={currentUser}
          onOpenStory={(idx) => setSelectedStoryIndex(idx)}
          onOpenPostStory={() => setIsPostStoryOpen(true)}
        />
      )}

      {/* VIEW: CATÁLOGO DE PRODUTOS E SERVIÇOS */}
      {activePill === 'catalogo' && (
        <div className="space-y-6">
          {/* Search & Category Bar */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar produtos, serviços ou vendedores de Queimados..."
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#4E553D]"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#4E553D] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-baseline justify-between border-b border-stone-200 pb-2">
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
              Catálogo de Produtos e Serviços
            </h3>
            <span className="text-xs text-stone-500 font-medium">{filteredProducts.length} item(ns)</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 space-y-3">
              <Package className="w-11 h-11 text-stone-300 mx-auto" />
              <div>
                <h4 className="font-bold text-stone-800 text-base">Nenhum item encontrado no catálogo</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Explore os perfis dos vendedores locais ou aguarde novos cadastros de produtos e serviços pelos comerciantes de Queimados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePill('lojas')}
                className="px-4 py-2 bg-[#4E553D] hover:bg-[#3E452E] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Ver Vendedores & Lojas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const isFav = favorites.includes(product.id);
                const seller = producers.find((pr) => pr.id === product.producerId) || null;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div
                      onClick={() => onOpenProductDetail(product)}
                      className="relative aspect-4/3 overflow-hidden bg-stone-100 cursor-pointer"
                    >
                      <img
                        src={
                          product.images?.[0] ||
                          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <div className="absolute top-3 left-3 bg-stone-900/75 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-xs">
                        {product.itemType === 'servico' ? 'Serviço' : 'Produto'}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(product.id);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-600 hover:text-amber-500 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                          {product.category}
                        </p>

                        <h4
                          onClick={() => onOpenProductDetail(product)}
                          className="font-bold text-base text-stone-900 cursor-pointer hover:text-[#4E553D] transition-colors leading-tight mt-0.5"
                        >
                          {product.title}
                        </h4>

                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          <button
                            type="button"
                            onClick={() => seller && onOpenProducerProfile(seller)}
                            className="text-xs text-stone-500 hover:text-[#4E553D] flex items-center gap-1 truncate cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-[#4E553D] shrink-0" />
                            <span className="truncate">{product.producerFarm || seller?.farmName || 'Loja Local'}</span>
                          </button>

                          <span className="flex items-center gap-0.5 text-xs font-bold text-amber-700 shrink-0">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {(product.rating || 0) > 0 ? (product.rating || 0).toFixed(1) : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-stone-100">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-lg font-extrabold text-stone-900">
                              R$ {(product.price || 0).toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-xs text-stone-500 font-normal"> / {product.unit}</span>
                          </div>
                          {seller && (
                            <button
                              type="button"
                              onClick={() => onReportProducer(seller)}
                              title="Denunciar vendedor"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenProductDetail(product)}
                          className="w-full py-2.5 bg-[#4E553D] hover:bg-[#3E452E] text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Ver Detalhes e Avaliar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: VENDEDORES & LOJAS */}
      {activePill === 'lojas' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold font-serif text-stone-900">Vendedores e Lojas de Queimados</h3>
              <p className="text-xs text-stone-500">
                Visite perfis, veja fotos das lojas, avalie com estrelas e fotos ou reporte atividades suspeitas.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar loja ou bairro..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProducers.map((producer) => {
              const storeReviews = reviews.filter((r) => r.producerId === producer.id);
              const avgRating =
                storeReviews.length > 0
                  ? (storeReviews.reduce((acc, r) => acc + r.rating, 0) / storeReviews.length).toFixed(1)
                  : (producer.rating || 5).toFixed(1);

              return (
                <div
                  key={producer.id}
                  className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-36 bg-stone-200 relative overflow-hidden">
                      <img src={producer.coverImage} alt={producer.farmName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <div className="bg-white/95 px-2.5 py-1 rounded-full text-xs font-bold text-stone-800 flex items-center gap-1 shadow-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{avgRating}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onReportProducer(producer)}
                          title="Denunciar vendedor por golpe ou atividade suspeita"
                          className="w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-xs cursor-pointer"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-4 flex items-center gap-3 text-white">
                        <img
                          src={producer.avatar}
                          alt={producer.name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
                        />
                        <div>
                          <h4 className="font-bold text-base font-serif leading-tight">{producer.farmName}</h4>
                          <p className="text-xs text-stone-200">{producer.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>
                          {producer.location.address ? `${producer.location.address} • ` : ''}
                          {producer.location.neighborhood || 'Queimados'}, {producer.location.city}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-2">{producer.bio}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center gap-2">
                    {producer.whatsapp && (
                      <a
                        href={`https://wa.me/${producer.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenProducerProfile(producer)}
                      className="flex-1 py-2 bg-[#4E553D] hover:bg-[#3E452E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Ver Loja, Fotos e Avaliar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: RANKING EMBEDDED */}
      {activePill === 'ranking' && (
        <RankingView
          producers={producers}
          products={products}
          reviews={reviews}
          orders={orders}
          onOpenProducerProfile={onOpenProducerProfile}
          onOpenProductDetail={onOpenProductDetail}
          onReportProducer={onReportProducer}
          onNavigateHome={() => setActivePill('catalogo')}
          onNavigateCatalog={() => setActivePill('catalogo')}
          isEmbedded
        />
      )}

      {/* VIEW: FAVORITES */}
      {activePill === 'favorites' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-xl font-bold font-serif text-stone-900">Seus Itens Favoritos</h3>
            <p className="text-xs text-stone-500">Produtos e serviços salvos do catálogo de Queimados.</p>
          </div>

          {favoriteProducts.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-2">
              <Star className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-xs">Nenhum item favoritado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {favoriteProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProductDetail(p)}
                  className="p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.images?.[0]} alt={p.title} className="w-14 h-14 object-cover rounded-xl shrink-0" />
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-stone-900 truncate">{p.title}</h5>
                      <p className="text-[10px] text-stone-500 truncate">{p.producerFarm}</p>
                      <p className="text-xs font-bold text-[#4E553D] mt-0.5">
                        R$ {p.price.toFixed(2).replace('.', ',')} /{p.unit}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#4E553D] shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: PROFILE */}
      {activePill === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6 shadow-2xs max-w-2xl mx-auto">
          <div className="flex items-center gap-4 pb-4 border-b border-stone-100">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#4E553D] text-white flex items-center justify-center text-xl font-bold font-serif">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-900">{currentUser.name}</h3>
              <p className="text-xs text-stone-500">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">
                  Consumidor Verificado
                </span>
                <span className="text-[11px] text-stone-500">Queimados, RJ</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl flex justify-between items-center">
              <span className="text-stone-500">CPF Cadastrado:</span>
              <span className="font-bold text-stone-800">{currentUser.cpf || 'Não informado'}</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl flex justify-between items-center">
              <span className="text-stone-500">Endereço de Referência:</span>
              <span className="font-bold text-stone-800">
                {currentAddress.address} • {currentAddress.neighborhood}
              </span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl flex justify-between items-center">
              <span className="text-stone-500">Telefone / WhatsApp:</span>
              <span className="font-bold text-stone-800">{currentUser.phone}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAddressModal}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Alterar Localização de Referência
            </button>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStoryIndex !== null && stories[selectedStoryIndex] && (
        <StoryViewerModal
          stories={stories}
          initialStoryIndex={selectedStoryIndex}
          currentUser={currentUser}
          onClose={() => setSelectedStoryIndex(null)}
          onStoryUpdated={loadStories}
        />
      )}

      {/* Story Post Modal */}
      {isPostStoryOpen && currentUser.producerId && (
        <StoryPostModal
          producer={producers.find((p) => p.id === currentUser.producerId) || producers[0]}
          currentUser={currentUser}
          onClose={() => setIsPostStoryOpen(false)}
          onStoryPosted={loadStories}
        />
      )}
    </div>
  );
};
