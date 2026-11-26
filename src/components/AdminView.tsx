import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  Store,
  Package,
  Tag,
  Award,
  Star,
  Map,
  Shield,
  Flag,
  Trash2,
  MapPin,
  Leaf,
  Database,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  AppUser,
  Producer,
  Product,
  SealItem,
  ReviewItem,
  CategoryDef,
  SellerReport,
} from '../types';

interface AdminViewProps {
  currentUser: AppUser;
  users: AppUser[];
  producers: Producer[];
  products: Product[];
  seals: SealItem[];
  reviews: ReviewItem[];
  reports: SellerReport[];
  categories: CategoryDef[];
  onSaveUser: (user: AppUser) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateReportStatus: (reportId: string, status: SellerReport['status']) => void;
  onOpenDiagnostics?: () => void;
}

const REASON_LABELS: Record<SellerReport['reason'], string> = {
  golpe_fraude: 'Golpe ou Fraude Financeira',
  produto_enganoso: 'Produto ou Serviço Enganoso',
  perfil_falso: 'Perfil Falso / Identidade Suspeita',
  comportamento_suspeito: 'Comportamento Suspeito ou Ofensivo',
  outro: 'Outro Motivo',
};

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  users,
  producers,
  products,
  seals,
  reviews,
  reports,
  categories,
  onSaveUser,
  onDeleteProduct,
  onUpdateReportStatus,
  onOpenDiagnostics,
}) => {
  const [activeTab, setActiveTab] = useState<
    'relatorios' | 'denuncias' | 'usuarios' | 'vendedores' | 'produtos' | 'categorias' | 'selos' | 'avaliacoes' | 'mapa'
  >('relatorios');

  const [userSearch, setUserSearch] = useState('');

  const totalUsersCount = users.length;
  const totalSellersCount = producers.length;
  const totalCatalogCount = products.length;
  const pendingReportsCount = reports.filter((r) => r.status === 'pendente').length;

  const filteredUsers = users.filter((u) => {
    const q = (userSearch || '').trim().toLowerCase();
    if (!q) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const cpf = (u.cpf || '').toLowerCase();
    return name.includes(q) || email.includes(q) || cpf.includes(q);
  });

  const topProducts = [...products].sort(
    (a, b) => (b.ordersCount || 0) + (b.clicksCount || 0) - ((a.ordersCount || 0) + (a.clicksCount || 0))
  );

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner (#1B2820) */}
      <div className="bg-[#1B2820] text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-extrabold tracking-widest uppercase text-emerald-300 border border-white/15">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>PAINEL DE MODERAÇÃO E GESTÃO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
            ConeQta Queimados
          </h2>
          <p className="text-xs text-stone-300">
            Gestão do catálogo local de produtos, serviços, avaliações e segurança dos vendedores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl border border-white/20 transition-all text-xs font-bold shadow-xs cursor-pointer"
              title="Testar e auditar a conexão com o Supabase"
            >
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left">
                <div className="text-[9px] text-emerald-300 font-extrabold uppercase tracking-wider">Banco de Dados</div>
                <div className="text-xs font-bold text-white">Diagnóstico Supabase</div>
              </div>
            </button>
          )}

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
              A
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">
                Administrador Ativo
              </div>
              <div className="text-xs font-bold text-white">{currentUser.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Admin Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center min-w-max border-b border-stone-200/80">
          <button
            onClick={() => setActiveTab('relatorios')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'relatorios'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('denuncias')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'denuncias'
                ? 'border-red-600 text-red-700 bg-red-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Flag className="w-4 h-4 text-red-600" />
            <span>Denúncias ({reports.length})</span>
            {pendingReportsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-extrabold rounded-full">
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'usuarios'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários</span>
          </button>

          <button
            onClick={() => setActiveTab('vendedores')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'vendedores'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Vendedores</span>
          </button>

          <button
            onClick={() => setActiveTab('produtos')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'produtos'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categorias')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'categorias'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Categorias</span>
          </button>

          <button
            onClick={() => setActiveTab('selos')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'selos'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Selos</span>
          </button>

          <button
            onClick={() => setActiveTab('avaliacoes')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'avaliacoes'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Avaliações ({reviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mapa')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'mapa'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Mapa Geográfico</span>
          </button>
        </div>
      </div>

      {/* TAB: VISÃO GERAL / RELATÓRIOS */}
      {activeTab === 'relatorios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#F6F8FA] rounded-2xl p-4 sm:p-5 border border-stone-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                  Total de Usuários
                </span>
                <span className="text-2xl font-extrabold text-stone-900 leading-tight">{totalUsersCount}</span>
                <span className="text-[11px] text-stone-500 font-medium block mt-0.5">Cadastrados na plataforma</span>
              </div>
            </div>

            <div className="bg-[#F4F9F5] rounded-2xl p-4 sm:p-5 border border-stone-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                  Total de Vendedores
                </span>
                <span className="text-2xl font-extrabold text-stone-900 leading-tight">{totalSellersCount}</span>
                <span className="text-[11px] text-stone-500 font-medium block mt-0.5">Lojas e negócios locais</span>
              </div>
            </div>

            <div className="bg-[#FFFDF4] rounded-2xl p-4 sm:p-5 border border-stone-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                  Itens no Catálogo
                </span>
                <span className="text-2xl font-extrabold text-stone-900 leading-tight">{totalCatalogCount}</span>
                <span className="text-[11px] text-stone-500 font-medium block mt-0.5">Produtos e serviços ativos</span>
              </div>
            </div>

            <div className="bg-red-50/70 rounded-2xl p-4 sm:p-5 border border-red-200/80 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                  Denúncias Pendentes
                </span>
                <span className="text-2xl font-extrabold text-red-700 leading-tight">{pendingReportsCount}</span>
                <span className="text-[11px] text-stone-500 font-medium block mt-0.5">
                  {reports.length} denúncia(s) no total
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendedores mais bem avaliados */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
              <h4 className="font-bold text-base font-serif text-stone-900">
                Vendedores Mais Acessados & Avaliados
              </h4>
              <div className="space-y-2.5 text-xs">
                {producers.map((prod) => (
                  <div key={prod.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div>
                      <div className="font-bold text-stone-900">{prod.farmName}</div>
                      <div className="text-[11px] text-stone-500">{prod.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md">
                        ★ {prod.rating.toFixed(1)}
                      </span>
                      <span className="px-2 py-0.5 bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md">
                        {prod.viewsCount || 0} visitas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Itens em destaque no catálogo */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
              <h4 className="font-bold text-base font-serif text-stone-900">
                Destaques do Catálogo (Vendas & Cliques)
              </h4>

              {topProducts.length === 0 ? (
                <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
                  Nenhum produto ou serviço cadastrado no catálogo ainda.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topProducts.slice(0, 4).map((p, i) => (
                    <div
                      key={p.id}
                      className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-bold text-sm text-stone-400">#{i + 1}</span>
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'}
                          alt={p.title}
                          className="w-10 h-10 object-cover rounded-lg shrink-0"
                        />
                        <div className="min-w-0">
                          <h6 className="font-bold text-xs text-stone-900 truncate">{p.title}</h6>
                          <p className="text-[10px] text-stone-500 truncate">{p.producerFarm}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md shrink-0">
                        {p.ordersCount || 0} vendas • {p.clicksCount || 0} cliques
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: DENÚNCIAS */}
      {activeTab === 'denuncias' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-base font-serif flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>Moderação de Denúncias de Golpe e Atividades Suspeitas</span>
              </h3>
              <p className="text-xs text-stone-500">
                Analise relatos enviados por consumidores através dos perfis dos vendedores.
              </p>
            </div>
            <span className="text-xs font-bold text-stone-600">{reports.length} registro(s)</span>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-stone-700">Nenhuma denúncia registrada até o momento</p>
              <p className="text-xs text-stone-500">
                Quando um consumidor denunciar um vendedor, o relato aparecerá aqui para verificação.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          rep.status === 'resolvido'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rep.status === 'analisado'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {rep.status}
                      </span>
                      <span className="text-xs font-bold text-stone-900">{rep.farmName}</span>
                      <span className="text-xs text-stone-500">({rep.producerName})</span>
                    </div>
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(rep.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div>
                      <strong className="text-red-700">Motivo:</strong>{' '}
                      <span className="font-semibold text-stone-800">{REASON_LABELS[rep.reason]}</span>
                    </div>
                    <p className="text-stone-700 bg-white p-3 rounded-xl border border-stone-200">
                      {rep.description}
                    </p>
                    <div className="text-[11px] text-stone-500 pt-1">
                      Denunciante: <strong>{rep.reporterName}</strong>
                      {rep.reporterEmail ? ` (${rep.reporterEmail})` : ''}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => onUpdateReportStatus(rep.id, 'analisado')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Marcar em Análise
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateReportStatus(rep.id, 'resolvido')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Marcar Resolvido
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: USUÁRIOS */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-base font-serif">Gestão de Usuários da Rede</h3>
              <p className="text-xs text-stone-500">Controle de acessos, vendedores e moradores de Queimados.</p>
            </div>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar por nome, CPF ou email..."
              className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Nome / Usuário</th>
                  <th className="py-2.5 px-3">CPF</th>
                  <th className="py-2.5 px-3">Papel</th>
                  <th className="py-2.5 px-3">Bairro</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/80">
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-900">{u.name}</div>
                      <div className="text-[10px] text-stone-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-3 text-stone-600 font-mono text-[11px]">{u.cpf || '—'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'producer'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role === 'admin' ? 'Administrador' : u.role === 'producer' ? 'Vendedor' : 'Consumidor'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-600">{u.neighborhood || 'Queimados'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                        {u.status || 'ativo'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          const updated: AppUser = {
                            ...u,
                            status: u.status === 'bloqueado' ? 'ativo' : 'bloqueado',
                          };
                          onSaveUser(updated);
                        }}
                        className="text-[11px] font-bold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                      >
                        {u.status === 'bloqueado' ? 'Ativar' : 'Bloquear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: VENDEDORES */}
      {activeTab === 'vendedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {producers.map((prod) => (
            <div key={prod.id} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <img src={prod.avatar} alt={prod.name} className="w-14 h-14 object-cover rounded-2xl" />
                <div>
                  <h4 className="font-bold text-sm text-stone-900">{prod.farmName}</h4>
                  <p className="text-xs text-stone-500">{prod.name}</p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                    {prod.location.address} • {prod.location.neighborhood}
                  </p>
                </div>
              </div>
              <p className="text-xs text-stone-600 line-clamp-2">{prod.bio}</p>
              <div className="pt-2 flex justify-between items-center text-xs text-stone-500 border-t border-stone-100">
                <span>Avaliação: ★ {prod.rating.toFixed(1)}</span>
                <span>WhatsApp: {prod.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: PRODUTOS / CATÁLOGO */}
      {activeTab === 'produtos' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-stone-900 text-base font-serif">Moderação do Catálogo Local</h3>
          {products.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
              Nenhum produto ou serviço cadastrado no catálogo ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.images?.[0]} alt={p.title} className="w-12 h-12 object-cover rounded-xl shrink-0" />
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-stone-900 truncate">{p.title}</h5>
                      <p className="text-[10px] text-stone-500 truncate">{p.producerFarm}</p>
                      <p className="text-xs font-bold text-emerald-800">
                        R$ {p.price.toFixed(2).replace('.', ',')} /{p.unit}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer shrink-0"
                    title="Remover item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: CATEGORIAS */}
      {activeTab === 'categorias' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-stone-900 text-base font-serif">Categorias do Catálogo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-stone-900">{c.name}</h5>
                  <p className="text-[10px] text-stone-500">ID: {c.id}</p>
                </div>
                <span className="px-2.5 py-1 bg-stone-200 text-stone-800 text-xs font-bold rounded-lg">
                  {products.filter((p) => c.id === 'todos' || p.category === c.id).length} itens
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SELOS */}
      {activeTab === 'selos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {seals.map((s) => (
            <div key={s.id} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">{s.title}</h4>
                  <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[9px] font-bold uppercase rounded-md">
                    {s.badge}
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{s.description}</p>
              <div className="text-[10px] text-emerald-800 font-bold pt-2 border-t border-stone-100">
                Atribuído a {s.activeCount} lojas em Queimados
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: AVALIAÇÕES */}
      {activeTab === 'avaliacoes' && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="font-bold text-xs text-stone-900">{r.authorName}</span>
                  <span className="text-[11px] text-stone-500 ml-2">
                    avaliou <strong>{r.productTitle ? `${r.productTitle} (${r.producerName})` : r.producerName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{r.rating}.0</span>
                </div>
              </div>
              <p className="text-xs text-stone-700 italic">"{r.comment}"</p>
              {r.photos && r.photos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {r.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt="Foto da avaliação"
                      className="w-16 h-16 rounded-xl object-cover border border-stone-200"
                    />
                  ))}
                </div>
              )}
              <div className="text-[10px] text-stone-400">{r.date}</div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: MAPA GEOGRÁFICO */}
      {activeTab === 'mapa' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base font-serif">Mapeamento de Vendedores em Queimados, RJ</h3>
              <p className="text-xs text-stone-500">Distribuição local das lojas e empreendimentos cadastrados.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              Queimados • RJ
            </span>
          </div>

          <div className="bg-stone-100 rounded-2xl p-8 border border-stone-200 min-h-[280px] flex flex-col items-center justify-center relative overflow-hidden text-center space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
              {producers.map((p) => (
                <div key={p.id} className="p-4 bg-white rounded-2xl border border-stone-300 shadow-xs text-left max-w-xs">
                  <div className="flex items-center gap-2 text-[#D35400] font-bold text-xs">
                    <MapPin className="w-4 h-4" />
                    <span>{p.farmName}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {p.location.address} • {p.location.neighborhood}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">{p.specialty}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
