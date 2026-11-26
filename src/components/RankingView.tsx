import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Star,
  Store,
  Package,
  ArrowLeft,
  Leaf,
  MapPin,
  Flag,
  TrendingUp,
  Award,
  MessageSquare,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Producer, Product, ReviewItem } from '../types';

interface RankingViewProps {
  producers: Producer[];
  products: Product[];
  reviews: ReviewItem[];
  onOpenProducerProfile: (producer: Producer) => void;
  onOpenProductDetail: (product: Product) => void;
  onReportProducer: (producer: Producer) => void;
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
  onNavigateLogin?: () => void;
  isEmbedded?: boolean;
}

export const RankingView: React.FC<RankingViewProps> = ({
  producers,
  products,
  reviews,
  onOpenProducerProfile,
  onOpenProductDetail,
  onReportProducer,
  onNavigateHome,
  onNavigateCatalog,
  onNavigateLogin,
  isEmbedded = false,
}) => {
  const [filterTab, setFilterTab] = useState<'todos' | 'lojas' | 'produtos'>('todos');

  // Compute live store ranking using live reviews + stored producer ratings
  const rankedStores = useMemo(() => {
    return producers
      .map((producer) => {
        const storeReviews = reviews.filter((r) => r.producerId === producer.id);
        const reviewCount = storeReviews.length > 0 ? storeReviews.length : producer.reviewCount || 0;
        const avgRating =
          storeReviews.length > 0
            ? Number((storeReviews.reduce((acc, r) => acc + r.rating, 0) / storeReviews.length).toFixed(1))
            : Number((producer.rating || 0).toFixed(1));
        const storeProductsCount = products.filter((p) => p.producerId === producer.id).length;

        return {
          producer,
          avgRating,
          reviewCount,
          storeProductsCount,
        };
      })
      .sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return b.reviewCount - a.reviewCount;
      });
  }, [producers, products, reviews]);

  // Compute best-selling products ranking
  const rankedProducts = useMemo(() => {
    return products
      .map((product) => {
        const prodReviews = reviews.filter((r) => r.productId === product.id);
        const reviewCount = prodReviews.length > 0 ? prodReviews.length : product.reviewCount || 0;
        const avgRating =
          prodReviews.length > 0
            ? Number((prodReviews.reduce((acc, r) => acc + r.rating, 0) / prodReviews.length).toFixed(1))
            : Number((product.rating || 0).toFixed(1));
        const salesCount = product.ordersCount || 0;
        const clicksCount = product.clicksCount || 0;
        const seller = producers.find((p) => p.id === product.producerId) || null;

        return {
          product,
          avgRating,
          reviewCount,
          salesCount,
          clicksCount,
          seller,
        };
      })
      .sort((a, b) => {
        if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return b.clicksCount - a.clicksCount;
      });
  }, [products, reviews, producers]);

  const getRankBadgeStyle = (index: number) => {
    if (index === 0) return 'bg-amber-400 text-stone-950 border-amber-500 shadow-sm';
    if (index === 1) return 'bg-stone-300 text-stone-900 border-stone-400';
    if (index === 2) return 'bg-orange-300 text-stone-950 border-orange-400';
    return 'bg-stone-100 text-stone-700 border-stone-200';
  };

  const content = (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#1F6B38] via-[#276E3E] to-[#164A27] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-lime-200 border border-white/20">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Destaques da Comunidade • Queimados, RJ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight">
              Ranking ConeQta: Melhores Lojas e Mais Vendidos
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Acompanhe em tempo real as lojas mais bem avaliadas pelos moradores e os produtos e serviços mais procurados do catálogo local.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/15 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setFilterTab('todos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'todos' ? 'bg-white text-[#1F6B38] shadow-xs' : 'text-white/85 hover:bg-white/10'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('lojas')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'lojas' ? 'bg-white text-[#1F6B38] shadow-xs' : 'text-white/85 hover:bg-white/10'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Lojas ({rankedStores.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('produtos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'produtos' ? 'bg-white text-[#1F6B38] shadow-xs' : 'text-white/85 hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Produtos ({rankedProducts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: LOJAS MAIS BEM AVALIADAS */}
      {(filterTab === 'todos' || filterTab === 'lojas') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-stone-900">
                  Lojas Mais Bem Avaliadas
                </h2>
                <p className="text-xs text-stone-500">
                  Classificação calculada pelas notas (1 a 5 estrelas) e avaliações da comunidade.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-500">
              {rankedStores.length} vendedor(es) ativo(s)
            </span>
          </div>

          {rankedStores.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 text-stone-500 text-xs">
              Nenhuma loja cadastrada ainda no catálogo.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rankedStores.map(({ producer, avgRating, reviewCount, storeProductsCount }, idx) => (
                <div
                  key={producer.id}
                  className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-black text-sm shrink-0 ${getRankBadgeStyle(
                          idx
                        )}`}
                      >
                        #{idx + 1}
                      </div>

                      {/* Avatar */}
                      <img
                        src={producer.avatar}
                        alt={producer.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shrink-0 bg-stone-100"
                      />

                      <div className="min-w-0">
                        <h3 className="font-bold text-stone-900 text-base font-serif truncate">
                          {producer.farmName}
                        </h3>
                        <p className="text-xs text-stone-600 truncate">{producer.name}</p>
                        <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>
                            {producer.location?.neighborhood || 'Queimados'}, {producer.location?.city || 'Queimados'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Rating & Report Icon */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-extrabold text-amber-900">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{avgRating.toFixed(1)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onReportProducer(producer)}
                        title="Denunciar vendedor por golpe ou atividade suspeita"
                        aria-label={`Denunciar ${producer.farmName}`}
                        className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 text-xs">
                    <div className="flex items-center gap-3 text-stone-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <strong className="text-stone-800">{reviewCount}</strong>{' '}
                        {reviewCount === 1 ? 'avaliação' : 'avaliações'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-stone-400" />
                        <strong className="text-stone-800">{storeProductsCount}</strong> itens no catálogo
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenProducerProfile(producer)}
                      className="px-3.5 py-1.5 bg-[#1F6B38] hover:bg-[#18532B] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Ver Loja e Avaliar</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: PRODUTOS E SERVIÇOS MAIS VENDIDOS */}
      {(filterTab === 'todos' || filterTab === 'produtos') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-stone-900">
                  Produtos & Serviços Mais Vendidos
                </h2>
                <p className="text-xs text-stone-500">
                  Itens de destaque ordenados por volume de vendas realizadas e avaliações dos consumidores.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-500">
              {rankedProducts.length} item(ns) no ranking
            </span>
          </div>

          {rankedProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 space-y-3">
              <Package className="w-11 h-11 text-stone-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-stone-800 text-base">
                  Nenhum produto ou serviço cadastrado ainda
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Assim que os vendedores de Queimados cadastrarem seus produtos e serviços reais no Painel do Vendedor, os mais vendidos e mais avaliados aparecerão automaticamente neste ranking.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {rankedProducts.map(({ product, avgRating, reviewCount, salesCount, clicksCount, seller }, idx) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 ${getRankBadgeStyle(
                        idx
                      )}`}
                    >
                      #{idx + 1}
                    </div>

                    <img
                      src={
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={product.title}
                      referrerPolicy="no-referrer"
                      onClick={() => onOpenProductDetail(product)}
                      className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shrink-0 cursor-pointer bg-stone-100"
                    />

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                          {product.itemType === 'servico' ? 'Serviço' : 'Produto'}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold truncate">
                          {product.producerFarm || seller?.farmName || 'Vendedor Local'}
                        </span>
                      </div>
                      <h4
                        onClick={() => onOpenProductDetail(product)}
                        className="font-bold text-stone-900 text-sm sm:text-base truncate cursor-pointer hover:text-[#1F6B38]"
                      >
                        {product.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        <span className="font-extrabold text-emerald-800">
                          R$ {(product.price || 0).toFixed(2).replace('.', ',')} / {product.unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <strong className="text-stone-800">{avgRating > 0 ? avgRating.toFixed(1) : 'Sem nota'}</strong>
                          <span>({reviewCount})</span>
                        </span>
                        <span>
                          <strong className="text-stone-800">{salesCount}</strong> vendas •{' '}
                          <strong className="text-stone-800">{clicksCount}</strong> visualizações
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {seller && (
                      <button
                        type="button"
                        onClick={() => onReportProducer(seller)}
                        title="Denunciar vendedor"
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 transition-colors cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenProductDetail(product)}
                      className="px-4 py-2 bg-[#1F6B38] hover:bg-[#18532B] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Ver e Avaliar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-stone-800 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-[#1F6B38] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Início</span>
            </button>

            <div onClick={onNavigateHome} className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-wider uppercase">CONEQTA</span>
                <span className="text-[10px] block text-emerald-200 font-medium">Ranking Oficial • Queimados</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onNavigateCatalog}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full border border-white/20 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Catálogo</span>
            </button>
            {onNavigateLogin && (
              <button
                type="button"
                onClick={onNavigateLogin}
                className="bg-white text-[#1F6B38] hover:bg-stone-100 text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                Entrar / Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content}
      </main>
    </div>
  );
};
