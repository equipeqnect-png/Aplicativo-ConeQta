import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Package, 
  MessageSquare, 
  Settings, 
  Star, 
  MapPin, 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Truck, 
  User, 
  Send,
  Leaf,
  Video,
  Play,
  Heart,
  MessageCircle,
  Film,
  Upload,
  Image as ImageIcon,
  Camera,
  Check,
  Save,
  Award,
  ExternalLink,
  Sparkles,
  Phone,
  Store,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Producer, Product, Order, ChatMessage, AppUser, ProducerStory, Category, Certification } from '../types';
import { ProductFormModal } from './ProductFormModal';
import { StorageService } from '../services/storage';
import { StoryPostModal } from './StoryPostModal';
import { StoryViewerModal } from './StoryViewerModal';
import { EntrepreneurProfileModal } from './EntrepreneurProfileModal';

interface ProducerViewProps {
  currentProducer: Producer;
  products: Product[];
  orders: Order[];
  chats: ChatMessage[];
  currentUser: AppUser;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onSendMessage: (msg: ChatMessage) => void;
  onSaveProducer: (producer: Producer) => void;
}

export const ProducerView: React.FC<ProducerViewProps> = ({
  currentProducer,
  products,
  orders,
  chats,
  currentUser,
  onSaveProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onSendMessage,
  onSaveProducer,
}) => {
  // Tabs: Catálogo, Stories, Conversas, Propriedade (Aba "Pedidos de Hoje" removida - catálogo de produtos e serviços)
  const [activeTab, setActiveTab] = useState<'catalogo' | 'stories' | 'conversas' | 'propriedade'>('catalogo');

  // Stories state
  const [producerStories, setProducerStories] = useState<ProducerStory[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isPostStoryOpen, setIsPostStoryOpen] = useState(false);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPreviewProfileOpen, setIsPreviewProfileOpen] = useState(false);

  // Chat message input
  const [replyText, setReplyText] = useState('');

  // ============================================================================
  // FORM STATE PARA EDIÇÃO DA PROPRIEDADE, PERFIL, CONTATOS E FOTOS
  // ============================================================================
  const [farmName, setFarmName] = useState(currentProducer.farmName);
  const [producerName, setProducerName] = useState(currentProducer.name);
  const [tagline, setTagline] = useState(currentProducer.tagline || '');
  const [bio, setBio] = useState(currentProducer.bio || '');
  const [story, setStory] = useState(currentProducer.story || '');
  const [specialty, setSpecialty] = useState(currentProducer.specialty || '');
  const [category, setCategory] = useState<Category>(currentProducer.category || 'produtos_agricolas');
  const [phone, setPhone] = useState(currentProducer.phone || '');
  const [whatsapp, setWhatsapp] = useState(currentProducer.whatsapp || '');
  const [address, setAddress] = useState(currentProducer.location.address || '');
  const [neighborhood, setNeighborhood] = useState(currentProducer.location.neighborhood || 'Zona Rural');
  const [city, setCity] = useState(currentProducer.location.city || 'Queimados');
  const [state, setState] = useState(currentProducer.location.state || 'RJ');
  const [distanceKm, setDistanceKm] = useState<number>(currentProducer.location.distanceKm || 5);
  const [establishedYear, setEstablishedYear] = useState<number>(currentProducer.establishedYear || 2020);
  const [hectares, setHectares] = useState<number>(currentProducer.hectares || 1);
  const [avatar, setAvatar] = useState(currentProducer.avatar);
  const [coverImage, setCoverImage] = useState(currentProducer.coverImage);
  const [galleryImages, setGalleryImages] = useState<string[]>(
    currentProducer.galleryImages && currentProducer.galleryImages.length > 0 
      ? currentProducer.galleryImages 
      : [currentProducer.coverImage]
  );
  const [harvestDays, setHarvestDays] = useState<string[]>(currentProducer.harvestDays || ['Segunda', 'Quarta', 'Sexta']);
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(
    currentProducer.deliveryMethods || ['Entrega Local em Queimados', 'Retirada no Sítio']
  );
  const [certifications, setCertifications] = useState<Certification[]>(currentProducer.certifications || ['familiar']);

  // URL input states for adding photos
  const [newGalleryPhotoUrl, setNewGalleryPhotoUrl] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Hidden file input refs
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize form when currentProducer changes
  useEffect(() => {
    setFarmName(currentProducer.farmName);
    setProducerName(currentProducer.name);
    setTagline(currentProducer.tagline || '');
    setBio(currentProducer.bio || '');
    setStory(currentProducer.story || '');
    setSpecialty(currentProducer.specialty || '');
    setCategory(currentProducer.category || 'produtos_agricolas');
    setPhone(currentProducer.phone || '');
    setWhatsapp(currentProducer.whatsapp || '');
    setAddress(currentProducer.location.address || '');
    setNeighborhood(currentProducer.location.neighborhood || 'Zona Rural');
    setCity(currentProducer.location.city || 'Queimados');
    setState(currentProducer.location.state || 'RJ');
    setDistanceKm(currentProducer.location.distanceKm || 5);
    setEstablishedYear(currentProducer.establishedYear || 2020);
    setHectares(currentProducer.hectares || 1);
    setAvatar(currentProducer.avatar);
    setCoverImage(currentProducer.coverImage);
    setGalleryImages(
      currentProducer.galleryImages && currentProducer.galleryImages.length > 0
        ? currentProducer.galleryImages
        : [currentProducer.coverImage]
    );
    setHarvestDays(currentProducer.harvestDays || ['Segunda', 'Quarta', 'Sexta']);
    setDeliveryMethods(currentProducer.deliveryMethods || ['Entrega Local em Queimados', 'Retirada no Sítio']);
    setCertifications(currentProducer.certifications || ['familiar']);
  }, [currentProducer]);

  const loadStories = () => {
    setProducerStories(StorageService.getStoriesForProducer(currentProducer.id));
  };

  useEffect(() => {
    loadStories();
    const handleUpdate = () => loadStories();
    window.addEventListener('coneqta_stories_updated', handleUpdate);
    return () => {
      window.removeEventListener('coneqta_stories_updated', handleUpdate);
    };
  }, [currentProducer.id]);

  // File Upload Handlers (converts local images into base64 URLs)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'cover' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem selecionada é muito grande. Escolha uma foto de até 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (target === 'avatar') {
        setAvatar(base64);
      } else if (target === 'cover') {
        setCoverImage(base64);
      } else if (target === 'gallery') {
        setGalleryImages(prev => [...prev, base64]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Quick avatar suggestions
  const suggestedAvatars = [
    { label: 'Agricultora', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
    { label: 'Produtor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
    { label: 'Empreendedora', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
    { label: 'Comerciante', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' }
  ];

  // Quick gallery photo suggestions
  const suggestedGalleryPhotos = [
    { label: 'Plantação & Horta', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80' },
    { label: 'Banca da Feira', url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80' },
    { label: 'Sítio Familiar', url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80' },
    { label: 'Empório & Quitutes', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' }
  ];

  // Days of week
  const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Save Producer Handler
  const handleSaveProperty = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const updated: Producer = {
      ...currentProducer,
      name: producerName.trim() || currentProducer.name,
      farmName: farmName.trim() || currentProducer.farmName,
      tagline: tagline.trim(),
      bio: bio.trim(),
      story: story.trim(),
      specialty: specialty.trim(),
      category,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      avatar: avatar.trim() || currentProducer.avatar,
      coverImage: coverImage.trim() || currentProducer.coverImage,
      galleryImages: galleryImages.filter(Boolean),
      establishedYear: Number(establishedYear) || currentProducer.establishedYear,
      hectares: Number(hectares) || currentProducer.hectares,
      harvestDays,
      deliveryMethods,
      certifications,
      location: {
        ...currentProducer.location,
        address: address.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim() || 'Queimados',
        state: state.trim() || 'RJ',
        distanceKm: Number(distanceKm) || 5,
      }
    };

    onSaveProducer(updated);

    // Synchronize current logged-in user profile if linked
    if (currentUser) {
      const updatedUser: AppUser = {
        ...currentUser,
        name: producerName.trim() || currentUser.name,
        phone: phone.trim() || currentUser.phone,
        farmName: farmName.trim() || currentUser.farmName,
        avatar: avatar.trim() || currentUser.avatar,
      };
      StorageService.saveUser(updatedUser);
      StorageService.setCurrentUser(updatedUser);
    }

    setIsSaving(false);
    setSaveSuccessMsg('Dados da propriedade, endereço, contato e fotos atualizados com sucesso!');
    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 4500);
  };

  // Filter orders relevant to this producer
  const producerOrders = orders.filter(
    o => o.producerIds.includes(currentProducer.id) || o.items.some(i => i.product.producerId === currentProducer.id)
  );

  // Filter products of this producer
  const producerProducts = products.filter(p => p.producerId === currentProducer.id);

  // Filter chats relevant to this producer
  const producerChats = chats.filter(
    c => c.recipientId === currentProducer.id || c.senderId === currentProducer.id
  );

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentProducer.id,
      senderName: currentProducer.name,
      senderRole: 'producer',
      recipientId: 'usr_mariana',
      text: replyText.trim(),
      timestamp: 'Agora mesmo',
    };

    onSendMessage(newMsg);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Panoramic Farm Hero Banner */}
      <div className="bg-stone-800 rounded-3xl overflow-hidden shadow-sm relative border border-stone-300">
        
        {/* Cover Photo */}
        <div className="h-44 sm:h-56 w-full relative">
          <img
            src={currentProducer.coverImage}
            alt={currentProducer.farmName}
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        </div>

        {/* Floating Farm Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
          
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/80 shadow-md bg-stone-100 shrink-0 relative group">
              <img
                src={currentProducer.avatar}
                alt={currentProducer.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveTab('propriedade')}
                title="Editar foto do perfil"
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Farm Title & Location */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#FAF0CA] text-[#7A5A00] text-[9px] font-extrabold tracking-widest uppercase rounded-full">
                  PAINEL DO VENDEDOR
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{currentProducer.name}</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight leading-tight">
                {currentProducer.farmName}
              </h2>
              <p className="text-xs text-stone-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentProducer.location.address || currentProducer.location.neighborhood} • {currentProducer.location.city}, {currentProducer.location.state}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Rating on right */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            
            {/* Direct button to Edit Property */}
            <button
              type="button"
              id="hero-btn-edit-property"
              onClick={() => setActiveTab('propriedade')}
              className="bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/30 flex items-center gap-1.5 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
              <span>Editar Propriedade & Fotos</span>
            </button>

            {/* Preview as customer */}
            <button
              type="button"
              id="hero-btn-preview-profile"
              onClick={() => setIsPreviewProfileOpen(true)}
              className="bg-black/40 hover:bg-black/60 active:bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 flex items-center gap-1.5 text-xs font-bold text-stone-200 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-lime-300" />
              <span>Ver Perfil Público</span>
            </button>

            {/* Rating Badge */}
            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <div className="text-xs font-bold text-white leading-none">
                {currentProducer.rating.toFixed(1)}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 2. Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center min-w-max border-b border-stone-200/80">
          
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'catalogo'
                ? 'border-[#D35400] text-[#D35400] bg-orange-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo de Produtos e Serviços ({producerProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'stories'
                ? 'border-[#D35400] text-[#D35400] bg-orange-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Video className="w-4 h-4 text-pink-600" />
            <span>Postar Vídeos (24h) ({producerStories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conversas')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'conversas'
                ? 'border-[#D35400] text-[#D35400] bg-orange-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Conversas ({producerChats.length})</span>
          </button>

          {/* DADOS DA PROPRIEDADE (Com destaque de edição) */}
          <button
            id="tab-producer-property-btn"
            onClick={() => setActiveTab('propriedade')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'propriedade'
                ? 'border-[#D35400] text-[#D35400] bg-orange-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Settings className="w-4 h-4 text-[#D35400]" />
            <span>Editar Dados da Propriedade & Fotos</span>
          </button>

        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: CATÁLOGO DE PRODUTOS E SERVIÇOS                              */}
      {/* ==================================================================== */}
      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-stone-900 text-base font-serif">Seu Catálogo de Produtos e Serviços</h3>
              <p className="text-xs text-stone-500">Divulgue seus produtos, serviços locais e valores de referência no catálogo de Queimados.</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="px-4 py-2 bg-[#D35400] hover:bg-[#BA4A00] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Produto / Serviço</span>
            </button>
          </div>

          {producerProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 text-stone-400">
              <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="font-semibold text-stone-700 text-sm">Nenhum produto ou serviço cadastrado no catálogo.</p>
              <p className="text-xs text-stone-400 mt-1">Clique em "Cadastrar Produto / Serviço" para exibir seus itens aos moradores.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {producerProducts.map((prod) => (
                <div key={prod.id} className="bg-white rounded-3xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-36 rounded-2xl overflow-hidden bg-stone-100 relative">
                      <img
                        src={prod.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'}
                        alt={prod.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-stone-900/75 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        {prod.itemType === 'servico' ? 'Serviço' : 'Produto'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <h4 className="font-bold text-stone-900 text-sm">{prod.title}</h4>
                        {prod.category === 'outros' && prod.customCategory && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#D35400] border border-orange-200">
                            {prod.customCategory}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{prod.description}</p>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-base font-extrabold text-[#D35400]">
                        R$ {prod.price.toFixed(2).replace('.', ',')} <span className="text-[10px] font-normal text-stone-500">/ {prod.unit}</span>
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {prod.ordersCount || 0} vendas • ★ {(prod.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 mt-3 border-t border-stone-100">
                    <button
                      onClick={() => {
                        setEditingProduct(prod);
                        setIsProductModalOpen(true);
                      }}
                      className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => onDeleteProduct(prod.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                      title="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: STORIES / VÍDEOS 24H                                         */}
      {/* ==================================================================== */}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base font-serif">Stories e Vídeos Curtos (24 Horas)</h3>
              <p className="text-xs text-stone-500">Mostre o dia a dia da fazenda, colheitas e novidades aos clientes.</p>
            </div>
            <button
              onClick={() => setIsPostStoryOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Publicar Novo Vídeo</span>
            </button>
          </div>

          {producerStories.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 text-stone-400">
              <Film className="w-12 h-12 mx-auto text-pink-300 mb-3" />
              <p className="font-semibold text-stone-700 text-sm">Você não tem vídeos ativos no momento.</p>
              <p className="text-xs text-stone-400 mt-1">Publique um story de até 24 horas para engajar consumidores de Queimados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {producerStories.map((story, idx) => (
                <div
                  key={story.id}
                  onClick={() => setSelectedStoryIndex(idx)}
                  className="relative aspect-9/16 rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all border border-stone-200 bg-stone-900"
                >
                  <img
                    src={story.thumbnailUrl || currentProducer.coverImage}
                    alt={story.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-xs border border-white/50 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-pink-600 transition-all">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 inset-x-2 text-white">
                    <h5 className="font-bold text-[11px] line-clamp-1">{story.title}</h5>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: CONVERSAS COM CONSUMIDORES                                    */}
      {/* ==================================================================== */}
      {activeTab === 'conversas' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4 max-w-3xl mx-auto">
          <div>
            <h3 className="font-bold text-stone-900 text-base font-serif">Canal Direto com Consumidores</h3>
            <p className="text-xs text-stone-500">Tire dúvidas sobre colheitas, lotes e entregas em Queimados.</p>
          </div>

          <div className="h-64 overflow-y-auto space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
            {producerChats.map((c) => {
              const isMe = c.senderRole === 'producer';
              return (
                <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs sm:max-w-md p-3 rounded-2xl text-xs ${
                    isMe
                      ? 'bg-[#D35400] text-white rounded-br-none'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none shadow-2xs'
                  }`}>
                    <div className="font-bold text-[10px] opacity-80 mb-0.5">{c.senderName}</div>
                    <p>{c.text}</p>
                    <div className="text-[9px] opacity-60 text-right mt-1">{c.timestamp}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Responder consumidor de Queimados..."
              className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#D35400] hover:bg-[#BA4A00] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: ÁREA COMPLETA PARA EDITAR DADOS DA PROPRIEDADE, CONTATO E FOTOS*/}
      {/* ==================================================================== */}
      {activeTab === 'propriedade' && (
        <form onSubmit={handleSaveProperty} className="space-y-6 max-w-4xl mx-auto">
          
          {/* Header & Quick Save */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#D35400] uppercase tracking-wider mb-1">
                <Store className="w-4 h-4" />
                <span>Gestão da Propriedade & Perfil</span>
              </div>
              <h3 className="font-bold text-stone-900 text-xl font-serif">Editar Informações e Fotos</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Atualize o nome da propriedade, endereço, dados de contato, foto de perfil e galeria de fotos da loja.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewProfileOpen(true)}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                <span>Pré-visualizar Perfil</span>
              </button>

              <button
                type="submit"
                id="btn-save-producer-property"
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#D35400] hover:bg-[#BA4A00] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>

          {/* Success Notification Banner */}
          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{saveSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveSuccessMsg('')}
                className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* SEÇÃO 1: PERFIL DO EMPREENDEDOR & FOTO DE PERFIL */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <h4 className="font-bold text-stone-900 text-sm font-sans flex items-center gap-2">
                <User className="w-4 h-4 text-[#D35400]" />
                <span>1. Perfil do Vendedor / Empreendedor</span>
              </h4>
              <p className="text-xs text-stone-500">Dados do responsável pela loja ou propriedade.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Foto de Perfil / Avatar */}
              <div className="md:col-span-4 flex flex-col items-center sm:items-start space-y-3">
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                  Foto de Perfil (Avatar)
                </label>
                
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-stone-200 shadow-md bg-stone-100">
                    <img
                      src={avatar}
                      alt={producerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    title="Carregar foto do dispositivo"
                    className="absolute -bottom-2 -right-2 bg-[#D35400] text-white p-2 rounded-xl shadow-md hover:bg-[#BA4A00] transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Hidden File Input for Avatar */}
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'avatar')}
                  className="hidden"
                />

                <div className="w-full space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-stone-500" />
                    <span>Carregar Foto do Aparelho</span>
                  </button>

                  <div>
                    <span className="block text-[10px] text-stone-400 mb-1">Ou cole o link direto (URL):</span>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={newAvatarUrl}
                        onChange={(e) => setNewAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAvatarUrl.trim()) {
                            setAvatar(newAvatarUrl.trim());
                            setNewAvatarUrl('');
                          }
                        }}
                        className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>

                  {/* Sugestões Rápidas de Avatares */}
                  <div className="pt-1">
                    <span className="block text-[10px] text-stone-400 mb-1.5">Sugestões rápidas:</span>
                    <div className="flex gap-2">
                      {suggestedAvatars.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatar(sug.url)}
                          title={`Usar avatar de ${sug.label}`}
                          className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200 hover:border-[#D35400] hover:scale-105 transition-all cursor-pointer"
                        >
                          <img src={sug.url} alt={sug.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Nome do Produtor e Especialidade */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                    Nome Completo do Vendedor / Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={producerName}
                    onChange={(e) => setProducerName(e.target.value)}
                    placeholder="Ex: Seu Nome Completo"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      Especialidade Principal *
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ex: Mandioca brava, hortaliças e ovos"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      Categoria do Empreendimento
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]"
                    >
                      <option value="produtos_agricolas">Produtos Agrícolas (Sítios & Hortas)</option>
                      <option value="gastronomia">Gastronomia & Quitutes Locais</option>
                      <option value="estetica_beleza">Estética & Beleza Natural</option>
                      <option value="artesanato">Artesanato & Feito à Mão</option>
                      <option value="vestuario">Vestuário & Moda Local</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                    Resumo / Bio Curta (Exibido nos cards)
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Breve resumo da sua produção ou loja em Queimados..."
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SEÇÃO 2: DADOS DA PROPRIEDADE OU LOJA */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h4 className="font-bold text-stone-900 text-sm font-sans flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#D35400]" />
                <span>2. Dados da Propriedade, Sítio ou Loja</span>
              </h4>
              <p className="text-xs text-stone-500">Identidade do seu espaço comercial ou área de plantio.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Nome da Fazenda / Sítio / Loja *
                </label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="Ex: Nome da sua Loja, Sítio ou Comércio"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Slogan ou Frase de Destaque
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ex: Alimentos frescos colhidos na hora em Queimados"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Ano de Início / Fundação
                </label>
                <input
                  type="number"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(Number(e.target.value))}
                  placeholder="2018"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Área da Propriedade (Hectares ou m²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hectares}
                  onChange={(e) => setHectares(Number(e.target.value))}
                  placeholder="Ex: 4.5"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                História da Propriedade e Tradição Familiar
              </label>
              <textarea
                rows={4}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Conte como iniciou a propriedade, o trabalho familiar e a relação com o município de Queimados..."
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400] leading-relaxed"
              />
            </div>
          </div>

          {/* SEÇÃO 3: ENDEREÇO & LOCALIZAÇÃO EM QUEIMADOS */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h4 className="font-bold text-stone-900 text-sm font-sans flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D35400]" />
                <span>3. Endereço e Localização da Propriedade</span>
              </h4>
              <p className="text-xs text-stone-500">Local exato onde os clientes podem retirar pedidos ou saber a procedência.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Endereço Completo (Rua / Estrada, Nº) *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Estrada do Sol, 450"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Bairro em Queimados *
                </label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Digite o nome do bairro"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Estado
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Distância Estimada até o Centro (km)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  placeholder="5"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400]"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: DADOS DE CONTATO */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h4 className="font-bold text-stone-900 text-sm font-sans flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D35400]" />
                <span>4. Dados de Contato e Atendimento</span>
              </h4>
              <p className="text-xs text-stone-500">Canais para contato telefônico e pedidos via WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Telefone de Contato *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(21) 98765-4321"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  WhatsApp para Pedidos e Suporte *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(21) 98765-4321"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400] pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-bold">WA</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: FOTO DE CAPA E FOTOS DA LOJA OU PROPRIEDADE (GALERIA) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h4 className="font-bold text-stone-900 text-sm font-sans flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#D35400]" />
                <span>5. Fotos da Loja ou Propriedade</span>
              </h4>
              <p className="text-xs text-stone-500">
                Adicione fotos do seu sítio, plantações, estufas, balcão de vendas ou produção artesanal.
              </p>
            </div>

            {/* Foto de Capa Principal */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                Foto de Capa Principal (Banner da Loja)
              </label>

              <div className="h-40 sm:h-48 rounded-2xl overflow-hidden border border-stone-200 relative group bg-stone-100">
                <img src={coverImage} alt="Capa da propriedade" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-stone-100 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar Nova Capa</span>
                  </button>
                </div>
              </div>

              {/* Hidden file input for cover */}
              <input
                type="file"
                ref={coverFileInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'cover')}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>Carregar Imagem de Capa do Aparelho</span>
                </button>

                <div className="flex-1 flex gap-2">
                  <input
                    type="url"
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    placeholder="Ou cole o link da capa (https://...)"
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCoverUrl.trim()) {
                        setCoverImage(newCoverUrl.trim());
                        setNewCoverUrl('');
                      }
                    }}
                    className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>

            {/* Galeria de Fotos da Loja / Propriedade */}
            <div className="space-y-4 pt-3 border-t border-stone-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Galeria de Fotos da Propriedade / Loja ({galleryImages.length} fotos)
                  </label>
                  <p className="text-[11px] text-stone-400">
                    Estas fotos aparecem no seu perfil público para os moradores e clientes de Queimados.
                  </p>
                </div>

                {/* Upload Button for Gallery */}
                <button
                  type="button"
                  onClick={() => galleryFileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#D35400] hover:bg-[#BA4A00] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ Adicionar Foto do Aparelho</span>
                </button>
              </div>

              {/* Hidden file input for gallery */}
              <input
                type="file"
                ref={galleryFileInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'gallery')}
                className="hidden"
              />

              {/* URL Input to add photo */}
              <div className="flex gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <input
                  type="url"
                  value={newGalleryPhotoUrl}
                  onChange={(e) => setNewGalleryPhotoUrl(e.target.value)}
                  placeholder="Ou adicione uma foto por link direto (URL): https://..."
                  className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:border-[#D35400]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newGalleryPhotoUrl.trim()) {
                      setGalleryImages(prev => [...prev, newGalleryPhotoUrl.trim()]);
                      setNewGalleryPhotoUrl('');
                    }
                  }}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Adicionar à Galeria
                </button>
              </div>

              {/* Sugestões Rápidas de Fotos para Enriquecer a Galeria */}
              <div>
                <span className="block text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-2">
                  Adicionar sugestões rápidas de fotos de Queimados:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {suggestedGalleryPhotos.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (!galleryImages.includes(sug.url)) {
                          setGalleryImages(prev => [...prev, sug.url]);
                        }
                      }}
                      className="p-2 rounded-xl border border-stone-200 hover:border-[#D35400] bg-stone-50 hover:bg-orange-50 text-left transition-all group flex items-center gap-2 cursor-pointer"
                    >
                      <img src={sug.url} alt={sug.label} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <div className="text-[10px] font-bold text-stone-700 group-hover:text-[#D35400] line-clamp-1">
                        + {sug.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade de Fotos da Galeria */}
              {galleryImages.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-stone-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                  <p className="text-xs font-semibold text-stone-600">Nenhuma foto adicionada à galeria ainda.</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Clique acima para carregar fotos do sítio ou comércio.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-1">
                  {galleryImages.map((imgUrl, idx) => {
                    const isCover = imgUrl === coverImage;
                    return (
                      <div
                        key={idx}
                        className={`group relative aspect-4/3 rounded-2xl overflow-hidden border transition-all ${
                          isCover ? 'ring-2 ring-[#D35400] border-transparent shadow-md' : 'border-stone-200 shadow-xs'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Foto ${idx + 1} da propriedade`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Top badge if cover */}
                        {isCover && (
                          <div className="absolute top-2 left-2 bg-[#D35400] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                            Capa Principal
                          </div>
                        )}

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                              title="Remover foto da galeria"
                              className="p-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => setCoverImage(imgUrl)}
                              className="w-full py-1.5 px-2 bg-white/90 hover:bg-white text-stone-900 font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Definir como Capa
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 6: DIAS DE FUNCIONAMENTO & MÉTODOS DE ENTREGA */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <h4 className="font-bold text-stone-900 text-sm font-sans flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#D35400]" />
                <span>6. Dias de Atendimento e Métodos de Entrega</span>
              </h4>
              <p className="text-xs text-stone-500">Configure quando e como os clientes podem receber seus produtos.</p>
            </div>

            {/* Dias de Atendimento / Colheita */}
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">
                Dias de Atendimento / Colheita em Queimados
              </label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => {
                  const isChecked = harvestDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setHarvestDays(prev => prev.filter(d => d !== day));
                        } else {
                          setHarvestDays(prev => [...prev, day]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isChecked
                          ? 'bg-[#D35400] text-white border-[#D35400] shadow-2xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {isChecked ? `✓ ${day}` : day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Métodos de Entrega */}
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">
                Métodos de Entrega Disponíveis
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  'Entrega Local em Queimados (Motoboy/Carro)',
                  'Retirada no Sítio / Loja',
                  'Ponto de Encontro no Centro de Queimados'
                ].map((method) => {
                  const isChecked = deliveryMethods.includes(method);
                  return (
                    <label
                      key={method}
                      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                        isChecked ? 'bg-orange-50/60 border-[#D35400]' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setDeliveryMethods(prev => prev.filter(m => m !== method));
                          } else {
                            setDeliveryMethods(prev => [...prev, method]);
                          }
                        }}
                        className="rounded text-[#D35400] focus:ring-[#D35400]"
                      />
                      <span className="text-xs font-semibold text-stone-800">{method}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Certificações e Selos */}
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">
                Certificações e Selos
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'familiar', label: 'Comércio Familiar Local' },
                  { id: 'selo_verde', label: 'Selo Verde Queimados' },
                  { id: 'agroecologico', label: 'Agroecológico' },
                  { id: 'sem_agrotoxico', label: 'Sem Agrotóxicos' },
                  { id: 'artesanal', label: 'Produção Artesanal' },
                  { id: 'organico', label: 'Orgânico' }
                ].map((cert) => {
                  const isChecked = certifications.includes(cert.id as Certification);
                  return (
                    <button
                      key={cert.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setCertifications(prev => prev.filter(c => c !== cert.id));
                        } else {
                          setCertifications(prev => [...prev, cert.id as Certification]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {isChecked ? `✓ ${cert.label}` : cert.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom Save Bar */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-stone-500 text-center sm:text-left">
              Ao salvar, as novas fotos e dados serão visíveis imediatamente na plataforma e no catálogo de Queimados.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsPreviewProfileOpen(true)}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Ver Perfil
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#D35400] hover:bg-[#BA4A00] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>

        </form>
      )}

      {/* Modal for Product Add/Edit */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={onSaveProduct}
        currentProducer={currentProducer}
        productToEdit={editingProduct}
      />

      {/* Modal for Posting Story / Video */}
      {isPostStoryOpen && (
        <StoryPostModal
          producer={currentProducer}
          currentUser={currentUser}
          onClose={() => setIsPostStoryOpen(false)}
          onStoryPosted={() => {
            loadStories();
            setIsPostStoryOpen(false);
          }}
        />
      )}

      {/* Modal for Viewing Stories */}
      {selectedStoryIndex !== null && (
        <StoryViewerModal
          stories={producerStories}
          initialStoryIndex={selectedStoryIndex}
          currentUser={currentUser}
          onClose={() => {
            setSelectedStoryIndex(null);
            loadStories();
          }}
        />
      )}

      {/* Preview Modal for Entrepreneur Profile */}
      <EntrepreneurProfileModal
        isOpen={isPreviewProfileOpen}
        onClose={() => setIsPreviewProfileOpen(false)}
        producer={currentProducer}
        products={products}
        currentUser={currentUser}
        onSaveProducer={onSaveProducer}
      />

    </div>
  );
};
