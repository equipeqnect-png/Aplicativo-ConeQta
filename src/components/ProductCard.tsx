import React from 'react';
import {
  Leaf,
  MapPin,
  Clock,
  Star,
  ExternalLink,
} from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
}) => {
  return (
    <div className="group bg-white rounded-3xl border border-stone-200 hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Image & Badges */}
      <div
        className="relative aspect-4/3 overflow-hidden bg-stone-100 cursor-pointer"
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={
            product.images[0] ||
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
          }
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          <span className="inline-flex items-center gap-1 bg-stone-900/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs uppercase">
            {product.itemType === 'servico' ? 'Serviço' : 'Produto'}
          </span>
          {product.category === 'outros' && product.customCategory && (
            <span className="inline-flex items-center gap-1 bg-orange-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
              {product.customCategory}
            </span>
          )}
          {product.organic && (
            <span className="inline-flex items-center gap-1 bg-emerald-700/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
              <Leaf className="w-3 h-3" />
              Local Artesanal
            </span>
          )}
        </div>

        {/* Availability Badge */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5">
          <div className="bg-stone-900/75 backdrop-blur-xs text-emerald-300 text-[11px] font-medium px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-xs">
            <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{product.harvestDate}</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span
              className="font-medium text-emerald-800 hover:underline cursor-pointer truncate max-w-[170px]"
              onClick={() => onOpenDetails(product)}
            >
              {product.producerFarm || product.producerName}
            </span>
            {product.producerDistanceKm !== undefined && (
              <span className="flex items-center gap-0.5 text-stone-400 shrink-0 text-[11px]">
                <MapPin className="w-3 h-3 text-stone-400" />
                {product.producerDistanceKm} km
              </span>
            )}
          </div>

          <h3
            className="font-bold text-stone-900 text-base leading-snug group-hover:text-emerald-800 transition-colors cursor-pointer line-clamp-1 mb-1.5"
            onClick={() => onOpenDetails(product)}
          >
            {product.title}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Catalog View Section */}
        <div className="pt-3 border-t border-stone-100 mt-auto">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Valor de Ref.</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-stone-900">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs text-stone-500 font-medium">/ {product.unit}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenDetails(product)}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver e Avaliar</span>
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
            <span className="flex items-center gap-1 font-bold text-amber-700">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {(product.rating || 0) > 0 ? `${(product.rating || 0).toFixed(1)} (${product.reviewCount || 0})` : 'Sem avaliações'}
            </span>
            <span>{product.ordersCount || 0} vendas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
