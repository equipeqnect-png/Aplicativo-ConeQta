import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Leaf,
  MapPin,
  Clock,
  MessageCircle,
  Star,
  Flag,
  Camera,
  Upload,
  Send,
  CheckCircle2,
  Store,
  MessageSquare,
} from 'lucide-react';
import { Product, Producer, ReviewItem, AppUser } from '../types';
import { StorageService } from '../services/storage';

interface ProductDetailModalProps {
  product: Product | null;
  producer?: Producer | null;
  currentUser?: AppUser | null;
  onClose: () => void;
  onOpenProducerProfile?: (producer: Producer) => void;
  onReportProducer?: (producer: Producer) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  producer,
  currentUser,
  onClose,
  onOpenProducerProfile,
  onReportProducer,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [reviewerName, setReviewerName] = useState(currentUser?.name || '');
  const [newComment, setNewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProductReviews = () => {
    if (!product) return;
    setReviews(StorageService.getReviewsForProduct(product.id));
  };

  useEffect(() => {
    setSelectedImageIndex(0);
    setReviewerName(currentUser?.name || '');
    setNewComment('');
    setReviewPhotos([]);
    setPhotoUrlInput('');
    setReviewSuccess(false);
    loadProductReviews();

    if (product) {
      StorageService.incrementProductClick(product.id);
    }

    const handleReviewsUpdated = () => loadProductReviews();
    window.addEventListener('coneqta_reviews_updated', handleReviewsUpdated);
    return () => {
      window.removeEventListener('coneqta_reviews_updated', handleReviewsUpdated);
    };
  }, [product?.id]);

  if (!product) return null;

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : (product.rating || 0).toFixed(1);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    (Array.from(files) as File[]).forEach((file: File) => {
      if (file.size > 6 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setReviewPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newReview: ReviewItem = {
      id: `rev_${Date.now()}`,
      authorName: reviewerName.trim() || 'Morador de Queimados',
      authorAvatar:
        currentUser?.avatar ||
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      producerId: product.producerId,
      producerName: producer?.farmName || product.producerFarm || 'Vendedor Local',
      productId: product.id,
      productTitle: product.title,
      targetType: 'product',
      rating: newRating,
      comment: newComment.trim(),
      photos: reviewPhotos,
      date: new Date().toISOString().split('T')[0],
      verifiedPurchase: true,
      helpfulCount: 0,
    };

    StorageService.addReview(newReview);
    setNewComment('');
    setReviewPhotos([]);
    setPhotoUrlInput('');
    setReviewSuccess(true);
    loadProductReviews();
    setTimeout(() => setReviewSuccess(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-100 flex flex-col relative animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-stone-900/55 hover:bg-stone-900 text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Photos & Seller Box */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 relative shadow-inner">
                <img
                  src={
                    product.images?.[selectedImageIndex] ||
                    product.images?.[0] ||
                    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {product.organic && (
                  <div className="absolute top-3 left-3 bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                    <Leaf className="w-3.5 h-3.5" />
                    <span>Produção Local Artesanal</span>
                  </div>
                )}
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-600/30'
                          : 'border-stone-200 opacity-70'
                      }`}
                    >
                      <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Seller Box with Report Icon */}
              {producer && (
                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={producer.avatar}
                        alt={producer.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 text-sm truncate">{producer.farmName}</h4>
                        <p className="text-xs text-emerald-800 truncate">{producer.name}</p>
                      </div>
                    </div>

                    {onReportProducer && (
                      <button
                        type="button"
                        onClick={() => onReportProducer(producer)}
                        title="Denunciar vendedor por golpe ou atividade suspeita"
                        className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Denunciar</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 italic line-clamp-2">"{producer.bio}"</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-2 border-t border-emerald-100">
                    <span className="flex items-center gap-1 text-emerald-900 font-medium">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {producer.location.neighborhood || producer.location.city} ({producer.location.distanceKm} km)
                    </span>
                    {onOpenProducerProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenProducerProfile(producer);
                        }}
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Ver Loja do Vendedor</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Catalog Details & Direct Contact */}
            <div className="flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs uppercase font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    {product.itemType === 'servico' ? 'Serviço' : 'Produto'} • {product.category}
                  </span>
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    {product.harvestDate}
                  </span>
                </div>

                <h2 className="text-2xl font-bold font-serif text-stone-900 mb-2">{product.title}</h2>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{reviews.length > 0 ? avgRating : 'Sem avaliações'}</span>
                  </div>
                  <span className="text-xs text-stone-500">
                    {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'} •{' '}
                    {product.ordersCount || 0} vendas registradas
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-xs uppercase font-bold text-stone-400 mr-1">Valor de Referência:</span>
                  <span className="text-3xl font-black text-emerald-900">
                    R$ {(product.price || 0).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm font-medium text-stone-500">/ {product.unit}</span>
                </div>

                <p className="text-sm text-stone-600 leading-relaxed mb-4">{product.description}</p>

                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-600 space-y-1">
                  <div className="font-bold text-stone-800">Catálogo Informativo ConeQta</div>
                  <p>
                    Este espaço exibe os produtos e serviços do vendedor em Queimados. Para consultar disponibilidade ou combinar atendimento, entre em contato diretamente com o vendedor.
                  </p>
                </div>
              </div>

              {/* Direct Contact Actions */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row gap-2.5">
                {producer?.whatsapp && (
                  <a
                    href={`https://wa.me/${producer.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá ${producer.name}! Vi "${product.title}" no catálogo ConeQta Queimados.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-5 rounded-2xl transition-all shadow-md text-xs sm:text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar com Vendedor no WhatsApp</span>
                  </a>
                )}

                {producer && onOpenProducerProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProducerProfile(producer);
                    }}
                    className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                  >
                    Perfil da Loja
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PRODUCT / SERVICE REVIEWS SECTION (1 to 5 stars + photos + comments) */}
          <div className="pt-6 border-t border-stone-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold font-serif text-stone-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-700" />
                  <span>Avaliações de Consumidores ({reviews.length})</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Avalie este {product.itemType === 'servico' ? 'serviço' : 'produto'} com nota de 1 a 5 estrelas, fotos e comentário.
                </p>
              </div>
            </div>

            {/* Review Form */}
            <form onSubmit={handleAddReview} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sua avaliação foi publicada com sucesso!</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Sua Nota (1 a 5 estrelas)
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-stone-700 ml-2">{newRating}/5 estrelas</span>
                  </div>
                </div>

                <div className="w-full sm:w-64">
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Ex: Julia"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Comentário *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Conte sua opinião sobre a qualidade, preço e atendimento..."
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              {/* Photo Attachment */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Fotos do Produto / Experiência</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Carregar Foto</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="Ou cole a URL da foto (https://...)"
                    className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (photoUrlInput.trim()) {
                        setReviewPhotos((prev) => [...prev, photoUrlInput.trim()]);
                        setPhotoUrlInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Anexar
                  </button>
                </div>

                {reviewPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {reviewPhotos.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-300 bg-white">
                        <img src={img} alt="Prévia" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setReviewPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar Avaliação</span>
                </button>
              </div>
            </form>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500">
                Nenhuma avaliação para este item ainda. Seja o primeiro a avaliar!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            rev.authorAvatar ||
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={rev.authorName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-xs text-stone-900">{rev.authorName}</div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200'
                                }`}
                              />
                            ))}
                            <span className="text-[10px] text-stone-400 ml-1">{rev.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed">{rev.comment}</p>

                    {rev.photos && rev.photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rev.photos.map((photo, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setZoomedPhoto(photo)}
                            className="w-20 h-20 rounded-xl overflow-hidden border border-stone-200 hover:border-emerald-600 cursor-pointer"
                          >
                            <img src={photo} alt="Foto da avaliação" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {zoomedPhoto && (
        <div
          onClick={() => setZoomedPhoto(null)}
          className="fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setZoomedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={zoomedPhoto}
            alt="Foto ampliada"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
