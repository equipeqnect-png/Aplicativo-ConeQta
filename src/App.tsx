import React, { useState, useEffect } from 'react';
import {
  AppUser,
  ActiveRoleOption,
  Product,
  Producer,
  Order,
  ChatMessage,
  ReviewItem,
  SealItem,
  CategoryDef,
  SellerReport,
} from './types';
import { StorageService, UserAddressConfig } from './services/storage';
import { authService } from './services/supabaseClient';

// Screens & Layout
import { LandingPage } from './components/LandingPage';
import { SearchDirectoryView } from './components/SearchDirectoryView';
import { RankingView } from './components/RankingView';
import { AboutModal } from './components/AboutModal';
import { LoginScreen } from './components/LoginScreen';
import { AppHeader } from './components/AppHeader';
import { SubHeaderRoleBar } from './components/SubHeaderRoleBar';
import { ConsumerView } from './components/ConsumerView';
import { ProducerView } from './components/ProducerView';
import { AdminView } from './components/AdminView';
import { AppFooter } from './components/AppFooter';

// Modals
import { AddressModal } from './components/AddressModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { EntrepreneurProfileModal } from './components/EntrepreneurProfileModal';
import { ReportSellerModal } from './components/ReportSellerModal';
import { SupabaseDiagnosticModal } from './components/SupabaseDiagnosticModal';

const getRoleOptionForUser = (user: AppUser | null): ActiveRoleOption => {
  if (user?.role === 'admin') return 'admin';
  if (user?.role === 'producer') return 'producer';
  return 'consumer';
};

export default function App() {
  // Authentication & Role State (strictly bound to currentUser; cannot switch without logging out)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => StorageService.getCurrentUser());
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const currentRoleOption: ActiveRoleOption = getRoleOptionForUser(currentUser);

  // Persistence State
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [producers, setProducers] = useState<Producer[]>(() => StorageService.getProducers());
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());
  const [favorites, setFavorites] = useState<string[]>(() => StorageService.getFavorites());
  const [chats, setChats] = useState<ChatMessage[]>(() => StorageService.getChats());
  const [reviews, setReviews] = useState<ReviewItem[]>(() => StorageService.getReviews());
  const [reports, setReports] = useState<SellerReport[]>(() => StorageService.getSellerReports());
  const [seals] = useState<SealItem[]>(() => StorageService.getSeals());
  const [categories] = useState<CategoryDef[]>(() => StorageService.getCategories());
  const [users, setUsers] = useState<AppUser[]>(() => StorageService.getUsers());
  const [currentAddress, setCurrentAddress] = useState<UserAddressConfig>(() => StorageService.getUserAddress());

  // Navigation Screen State: always starts on 'landing' (Tela Inicial)
  const [activeScreen, setActiveScreen] = useState<'landing' | 'search' | 'ranking' | 'login' | 'dashboard'>('landing');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Modal States
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [selectedProfileProducer, setSelectedProfileProducer] = useState<Producer | null>(null);
  const [reportingProducer, setReportingProducer] = useState<Producer | null>(null);

  // Listen to cross-storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      setProducts(StorageService.getProducts());
      setProducers(StorageService.getProducers());
      setOrders(StorageService.getOrders());
      setUsers(StorageService.getUsers());
      setReviews(StorageService.getReviews());
      setReports(StorageService.getSellerReports());
      setChats(StorageService.getChats());
    };

    const handleFavsUpdate = () => {
      setFavorites(StorageService.getFavorites());
    };

    const handleAddressUpdate = () => {
      setCurrentAddress(StorageService.getUserAddress());
    };

    const handleReviewsUpdate = () => {
      setReviews(StorageService.getReviews());
      setProducts(StorageService.getProducts());
      setProducers(StorageService.getProducers());
    };

    const handleReportsUpdate = () => {
      setReports(StorageService.getSellerReports());
    };

    const handleUserChanged = () => {
      setCurrentUser(StorageService.getCurrentUser());
    };

    window.addEventListener('coneqta_storage_updated', handleStorageUpdate);
    window.addEventListener('coneqta_favs_updated', handleFavsUpdate);
    window.addEventListener('coneqta_address_updated', handleAddressUpdate);
    window.addEventListener('coneqta_reviews_updated', handleReviewsUpdate);
    window.addEventListener('coneqta_reports_updated', handleReportsUpdate);
    window.addEventListener('coneqta_user_changed', handleUserChanged);

    return () => {
      window.removeEventListener('coneqta_storage_updated', handleStorageUpdate);
      window.removeEventListener('coneqta_favs_updated', handleFavsUpdate);
      window.removeEventListener('coneqta_address_updated', handleAddressUpdate);
      window.removeEventListener('coneqta_reviews_updated', handleReviewsUpdate);
      window.removeEventListener('coneqta_reports_updated', handleReportsUpdate);
      window.removeEventListener('coneqta_user_changed', handleUserChanged);
    };
  }, []);

  // Login handler
  const handleLogin = (param1: ActiveRoleOption | AppUser, param2?: AppUser | ActiveRoleOption) => {
    const user = (typeof param1 === 'string' ? param2 : param1) as AppUser;
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
    setActiveScreen('dashboard');
  };

  // Logout handler (returns to landing page)
  const handleLogout = () => {
    setCurrentUser(null);
    StorageService.logout();
    authService.signOut().catch(() => {});
    setActiveScreen('landing');
  };

  // Logout & go directly to login screen to sign in as another user
  const handleSwitchAccount = () => {
    setCurrentUser(null);
    StorageService.logout();
    authService.signOut().catch(() => {});
    setActiveScreen('login');
  };

  // Favorite toggle
  const handleToggleFavorite = (productId: string) => {
    const updated = StorageService.toggleFavorite(productId);
    setFavorites(updated);
  };

  // Address Save
  const handleSaveAddress = (newAddr: UserAddressConfig) => {
    StorageService.saveUserAddress(newAddr);
    setCurrentAddress(newAddr);
  };

  // Product save/delete (Seller/Admin)
  const handleSaveProduct = (prod: Product) => {
    StorageService.saveProduct(prod);
    setProducts(StorageService.getProducts());
  };

  const handleDeleteProduct = (productId: string) => {
    StorageService.deleteProduct(productId);
    setProducts(StorageService.getProducts());
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    StorageService.updateOrderStatus(orderId, status);
    setOrders(StorageService.getOrders());
  };

  // Seller save
  const handleSaveProducer = (prod: Producer) => {
    StorageService.saveProducer(prod);
    setProducers(StorageService.getProducers());
  };

  // Send Chat message
  const handleSendMessage = (msg: ChatMessage) => {
    StorageService.saveChatMessage(msg);
    setChats(StorageService.getChats());
  };

  // User moderation save (Admin)
  const handleSaveUser = (u: AppUser) => {
    StorageService.saveUser(u);
    setUsers(StorageService.getUsers());
  };

  // Report status update (Admin)
  const handleUpdateReportStatus = (reportId: string, status: SellerReport['status']) => {
    StorageService.updateSellerReportStatus(reportId, status);
    setReports(StorageService.getSellerReports());
  };

  // Shared modals for public screens (Search & Ranking)
  const renderSharedCatalogModals = () => (
    <>
      <EntrepreneurProfileModal
        isOpen={!!selectedProfileProducer}
        onClose={() => setSelectedProfileProducer(null)}
        producer={selectedProfileProducer}
        products={products}
        currentUser={currentUser}
        onSaveProducer={handleSaveProducer}
        onOpenProductDetail={setSelectedProductDetail}
        onReportProducer={(prod) => setReportingProducer(prod)}
      />

      <ProductDetailModal
        product={selectedProductDetail}
        producer={selectedProductDetail ? producers.find((p) => p.id === selectedProductDetail.producerId) || null : null}
        currentUser={currentUser}
        onClose={() => setSelectedProductDetail(null)}
        onOpenProducerProfile={(prod) => setSelectedProfileProducer(prod)}
        onReportProducer={(prod) => setReportingProducer(prod)}
      />

      <ReportSellerModal
        isOpen={!!reportingProducer}
        onClose={() => setReportingProducer(null)}
        producer={reportingProducer}
        currentUser={currentUser}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onExploreProducts={() => {
          setIsAboutModalOpen(false);
          setActiveScreen('search');
        }}
      />
    </>
  );

  // 1. TELA INICIAL (Landing Page)
  if (activeScreen === 'landing') {
    return (
      <>
        <LandingPage
          onNavigateHome={() => setActiveScreen('landing')}
          onNavigateSearch={() => setActiveScreen('search')}
          onNavigateRanking={() => setActiveScreen('ranking')}
          onNavigateLogin={() => setActiveScreen('login')}
          onOpenAbout={() => setIsAboutModalOpen(true)}
          onGetStarted={() => setActiveScreen('search')}
          currentUser={currentUser}
          onNavigateApp={() => setActiveScreen('dashboard')}
        />

        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
          onExploreProducts={() => {
            setIsAboutModalOpen(false);
            setActiveScreen('search');
          }}
        />
      </>
    );
  }

  // 2. TELA DE LOGIN & CADASTRO
  if (activeScreen === 'login') {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          users={users}
          onBackToLanding={() => setActiveScreen('landing')}
        />
        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
          onExploreProducts={() => {
            setIsAboutModalOpen(false);
            setActiveScreen('search');
          }}
        />
      </>
    );
  }

  // 3. CATÁLOGO PÚBLICO DE PRODUTOS, SERVIÇOS E VENDEDORES
  if (activeScreen === 'search') {
    return (
      <>
        <SearchDirectoryView
          products={products}
          producers={producers}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onOpenProductDetail={setSelectedProductDetail}
          onOpenProducerProfile={(prod) => setSelectedProfileProducer(prod)}
          onReportProducer={(prod) => setReportingProducer(prod)}
          onNavigateHome={() => setActiveScreen('landing')}
          onNavigateRanking={() => setActiveScreen('ranking')}
          onNavigateLogin={() => setActiveScreen('login')}
          onOpenAbout={() => setIsAboutModalOpen(true)}
        />
        {renderSharedCatalogModals()}
      </>
    );
  }

  // 4. PÁGINA DE RANKING (Lojas Mais Bem Avaliadas & Produtos Mais Vendidos)
  if (activeScreen === 'ranking') {
    return (
      <>
        <RankingView
          producers={producers}
          products={products}
          reviews={reviews}
          orders={orders}
          onOpenProducerProfile={(prod) => setSelectedProfileProducer(prod)}
          onOpenProductDetail={(prod) => setSelectedProductDetail(prod)}
          onReportProducer={(prod) => setReportingProducer(prod)}
          onNavigateHome={() => setActiveScreen('landing')}
          onNavigateCatalog={() => setActiveScreen('search')}
          onNavigateLogin={() => (currentUser ? setActiveScreen('dashboard') : setActiveScreen('login'))}
        />
        {renderSharedCatalogModals()}
      </>
    );
  }

  // 5. PAINEL / DASHBOARD (Exige login)
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        users={users}
        onBackToLanding={() => setActiveScreen('landing')}
      />
    );
  }

  const loggedInProducer: Producer | null =
    currentUser?.role === 'producer'
      ? producers.find(
          (p) => p.id === currentUser.producerId || p.id === currentUser.farmId || p.id === currentUser.id
        ) || {
          id: currentUser.producerId || currentUser.farmId || `prod_${currentUser.id}`,
          name: currentUser.name,
          farmName: currentUser.farmName || `Loja de ${currentUser.name}`,
          tagline: `Produtos e serviços locais em ${currentUser.neighborhood || 'Queimados'}`,
          bio: `Empreendedor(a) local em ${currentUser.neighborhood || 'Queimados'}.`,
          story: 'Edite os dados da sua loja na aba "Editar Perfil & Loja".',
          avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80',
          coverImage: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
          galleryImages: [],
          location: {
            city: currentUser.city || 'Queimados',
            state: 'RJ',
            distanceKm: 1.0,
            neighborhood: currentUser.neighborhood || 'Queimados',
          },
          rating: 0,
          reviewCount: 0,
          certifications: [],
          phone: currentUser.phone || '',
          whatsapp: (currentUser.phone || '').replace(/\D/g, ''),
          establishedYear: new Date().getFullYear(),
          harvestDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
          deliveryMethods: ['Retirada no Local'],
          specialty: 'Comércio Local',
          viewsCount: 0,
          category: 'outros',
        }
      : null;

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-stone-800 flex flex-col font-sans selection:bg-emerald-200">
      {/* 1. Header */}
      <AppHeader
        currentRoleOption={currentRoleOption}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateHome={() => setActiveScreen('landing')}
      />

      {/* 2. SubHeader Role Bar (Read-only profile indicator; switching requires logout) */}
      <SubHeaderRoleBar
        currentRoleOption={currentRoleOption}
        currentUser={currentUser}
        producerName={currentRoleOption === 'producer' ? loggedInProducer?.farmName : undefined}
        onSwitchAccount={handleSwitchAccount}
      />

      {/* 3. Main Dynamic Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW A: CONSUMER VIEW */}
        {currentRoleOption === 'consumer' && (
          <ConsumerView
            currentUser={currentUser}
            currentAddress={currentAddress}
            onOpenAddressModal={() => setIsAddressModalOpen(true)}
            products={products}
            producers={producers}
            reviews={reviews}
            orders={orders}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpenProductDetail={setSelectedProductDetail}
            onOpenProducerProfile={(prod) => setSelectedProfileProducer(prod)}
            onReportProducer={(prod) => setReportingProducer(prod)}
          />
        )}

        {/* VIEW B: SELLER VIEW */}
        {currentRoleOption === 'producer' && loggedInProducer && (
          <ProducerView
            currentProducer={loggedInProducer}
            products={products}
            orders={orders}
            chats={chats}
            currentUser={currentUser}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onSendMessage={handleSendMessage}
            onSaveProducer={handleSaveProducer}
          />
        )}

        {/* VIEW D: ADMIN VIEW */}
        {currentRoleOption === 'admin' && (
          <AdminView
            currentUser={currentUser}
            users={users}
            producers={producers}
            products={products}
            seals={seals}
            reviews={reviews}
            reports={reports}
            categories={categories}
            onSaveUser={handleSaveUser}
            onDeleteProduct={handleDeleteProduct}
            onUpdateReportStatus={handleUpdateReportStatus}
            onOpenDiagnostics={() => setIsDiagnosticModalOpen(true)}
          />
        )}
      </main>

      {/* 4. Footer */}
      <AppFooter onOpenDiagnostics={() => setIsDiagnosticModalOpen(true)} />

      {/* MODALS */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        currentAddress={currentAddress}
        onSaveAddress={handleSaveAddress}
      />

      <ProductDetailModal
        product={selectedProductDetail}
        producer={selectedProductDetail ? producers.find((p) => p.id === selectedProductDetail.producerId) || null : null}
        currentUser={currentUser}
        onClose={() => setSelectedProductDetail(null)}
        onOpenProducerProfile={(prod) => setSelectedProfileProducer(prod)}
        onReportProducer={(prod) => setReportingProducer(prod)}
      />

      <EntrepreneurProfileModal
        isOpen={!!selectedProfileProducer}
        onClose={() => setSelectedProfileProducer(null)}
        producer={selectedProfileProducer}
        products={products}
        currentUser={currentUser}
        onSaveProducer={handleSaveProducer}
        onOpenProductDetail={setSelectedProductDetail}
        onReportProducer={(prod) => setReportingProducer(prod)}
      />

      <ReportSellerModal
        isOpen={!!reportingProducer}
        onClose={() => setReportingProducer(null)}
        producer={reportingProducer}
        currentUser={currentUser}
      />

      <SupabaseDiagnosticModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
      />
    </div>
  );
}
