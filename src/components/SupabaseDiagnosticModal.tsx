import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Layers, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  Zap, 
  Terminal,
  Activity
} from 'lucide-react';
import { checkSupabaseConnection, isSupabaseConfigured, SupabaseDiagnosticResult } from '../services/supabaseClient';

interface SupabaseDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseDiagnosticModal: React.FC<SupabaseDiagnosticModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SupabaseDiagnosticResult | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'passo_a_passo'>('status');

  const runTest = async () => {
    setLoading(true);
    try {
      const res = await checkSupabaseConnection();
      setResult(res);
    } catch (err: any) {
      setResult({
        isConfigured: isSupabaseConfigured(),
        supabaseUrl: 'Erro',
        hasAnonKey: false,
        connected: false,
        tables: [],
        message: err?.message || 'Erro inesperado ao consultar o Supabase.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#18231C] text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-serif tracking-tight text-white flex items-center gap-2">
                  Diagnóstico de Conexão Supabase
                </h3>
                <p className="text-xs text-stone-300">
                  Verificador em tempo real do banco de dados do ConeQta
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Status Bar */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-400">Status atual:</span>
              {isConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Supabase Configurado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Modo Local Resiliente
                </span>
              )}
            </div>

            <button
              onClick={runTest}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold rounded-lg text-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Testando...' : 'Re-testar Conexão'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'status'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            📊 Teste em Tempo Real
          </button>
          <button
            onClick={() => setActiveTab('passo_a_passo')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'passo_a_passo'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            🔍 Como Saber se Funcionou (4 Sinais)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'status' ? (
            <div className="space-y-5">
              {/* Overall status card */}
              <div className={`p-4 rounded-2xl border ${
                result?.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : isConfigured
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}>
                <div className="flex items-start gap-3">
                  {result?.connected ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">
                        {result?.connected 
                          ? 'Banco de Dados Supabase Operando 100%' 
                          : isConfigured 
                          ? 'Credenciais Detectadas - Aguardando Tabelas' 
                          : 'Operando em Modo de Simulação Local'}
                      </h4>
                      {result?.latencyMs !== undefined && result.connected && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Activity className="w-3 h-3" /> {result.latencyMs}ms
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1 text-stone-600">
                      {result?.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tables Health Grid */}
              <div>
                <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  Status das Tabelas no Supabase:
                </h5>

                {isConfigured && result?.tables && result.tables.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {result.tables.map((tbl) => (
                      <div 
                        key={tbl.name}
                        className={`p-3 rounded-xl border flex flex-col justify-between ${
                          tbl.accessible 
                            ? 'bg-emerald-50/50 border-emerald-200' 
                            : 'bg-red-50/60 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-stone-800">{tbl.name}</span>
                          {tbl.accessible ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </div>
                        <div className="mt-2 text-[11px]">
                          {tbl.accessible ? (
                            <span className="text-emerald-700 font-bold">
                              {tbl.count !== undefined ? `${tbl.count} registro(s)` : 'Acessível'}
                            </span>
                          ) : (
                            <span className="text-red-600 text-[10px] leading-tight line-clamp-1" title={tbl.error}>
                              Não encontrada
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-2">
                    <p className="font-semibold text-stone-800">
                      Tabelas prontas para ativação:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['profiles', 'producers', 'products', 'orders', 'reviews', 'stories', 'story_comments', 'chat_messages', 'seals', 'categories'].map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-white border border-stone-300 rounded font-mono text-[11px] text-stone-700">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-500 pt-1">
                      Assim que você colar as credenciais no arquivo <code className="bg-stone-200 px-1 py-0.5 rounded font-mono">.env</code>, este teste validará cada tabela automaticamente.
                    </p>
                  </div>
                )}
              </div>

              {/* Direct Verification Checklist */}
              <div className="bg-emerald-950/5 rounded-2xl p-4 border border-emerald-900/10">
                <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Garantias de Segurança Ativas:
                </h5>
                <ul className="text-xs text-stone-700 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Fallback Resiliente:</strong> Se o Supabase estiver sem chaves ou offline, o app nunca trava.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Row Level Security (RLS):</strong> Produtores só alteram seus próprios produtos.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Triggers Automáticos:</strong> Médias e notas recalculadas pelo próprio PostgreSQL.</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-l-4 border-emerald-600 pl-3 py-1">
                <h4 className="font-bold text-sm text-stone-900">
                  4 Maneiras Práticas de Saber que o Supabase Funcionou:
                </h4>
                <p className="text-xs text-stone-600">
                  Basta verificar qualquer um dos 4 pontos abaixo para confirmar o funcionamento em tempo real:
                </p>
              </div>

              {/* Point 1: Supabase Dashboard */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-mono">1</div>
                  <span>No Painel do Supabase (Table Editor)</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Acesse <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-800 font-bold underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a>, abra seu projeto e clique em <strong>Table Editor</strong> no menu lateral esquerdo:
                </p>
                <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                  <p>• Na tabela <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-emerald-800 font-bold">producers</code>: você verá os empreendedores cadastrados (<strong>Vivian dos Santos</strong> e <strong>Leonardo Souza</strong>).</p>
                  <p>• Na tabela <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-emerald-800 font-bold">products</code>: verá os produtos reais (Alface Crespa, Tomate Cereja, etc.).</p>
                </div>
              </div>

              {/* Point 2: Write Test */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-mono">2</div>
                  <span>Teste de Gravação em Tempo Real</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  No ConeQta, navegue como <strong>Produtor (Sítio Vivian)</strong> e adicione um novo produto ou edite o estoque de um item. Em seguida, dê F5 na página do Supabase: <strong>a alteração estará lá instantaneamente!</strong>
                </p>
              </div>

              {/* Point 3: Network Inspector */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-mono">3</div>
                  <span>No Navegador (Inspecionar / Rede F12)</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Pressione <kbd className="bg-stone-200 px-1.5 py-0.5 rounded text-[11px] font-mono">F12</kbd> no teclado e vá na aba <strong>Rede (Network)</strong>:
                </p>
                <div className="bg-stone-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>GET https://[projeto].supabase.co/rest/v1/products ➔ 200 OK</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Todas as requisições com código 200 confirmam que o tráfego está vindo direto da nuvem do Supabase.
                </p>
              </div>

              {/* Point 4: Real User Registration */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-mono">4</div>
                  <span>No Menu Authentication do Supabase</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Ao criar uma nova conta no ConeQta pelo botão <strong>Entrar / Cadastrar</strong>, abra o menu <strong>Authentication &gt; Users</strong> no painel do Supabase. O email e o ID do novo usuário aparecem imediatamente registrados com criptografia bcrypt.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 p-4 px-6 border-t border-stone-200 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            Script DDL disponível em <code className="font-mono bg-stone-200 px-1 py-0.5 rounded text-[11px]">supabase/schema.sql</code>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            Fechar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};
