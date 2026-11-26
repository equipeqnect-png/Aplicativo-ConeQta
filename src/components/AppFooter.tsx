import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface AppFooterProps {
  onOpenDiagnostics?: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onOpenDiagnostics }) => {
  const isConfigured = isSupabaseConfigured();

  return (
    <footer className="bg-[#18231C] text-stone-300 border-t border-stone-800/80 py-8 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand, Tagline & Liga Jovem */}
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="font-extrabold text-white text-base tracking-tight">ConeQta</span>
            <span className="text-stone-500">•</span>
            <span className="text-xs text-stone-300 font-medium">Conectando empreendedores de Queimados à população</span>
          </div>
          <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
            DESAFIO LIGA JOVEM • EQUIPE Q-NECT • QUEIMADOS, RJ
          </p>
        </div>

        {/* Center / Right: Supabase Connection Badge & Action */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenDiagnostics}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-stone-200"
            title="Clique para diagnosticar e verificar a conexão com o Supabase"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Banco de Dados:</span>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase Ativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Modo Local
              </span>
            )}
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white">Testar</span>
          </button>

          <div className="text-xs text-stone-400 text-center md:text-right">
            <span>Queimados, Baixada Fluminense - RJ</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
