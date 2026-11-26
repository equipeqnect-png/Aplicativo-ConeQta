import React from 'react';
import { User, Home, Shield, Lock, LogOut } from 'lucide-react';
import { ActiveRoleOption, AppUser } from '../types';

interface SubHeaderRoleBarProps {
  currentRoleOption: ActiveRoleOption;
  currentUser: AppUser | null;
  producerName?: string;
  onSwitchAccount: () => void;
}

export const SubHeaderRoleBar: React.FC<SubHeaderRoleBarProps> = ({
  currentRoleOption,
  currentUser,
  producerName,
  onSwitchAccount,
}) => {
  const getNavigatingLabel = () => {
    switch (currentRoleOption) {
      case 'admin':
        return {
          icon: <Shield className="w-4 h-4 text-emerald-800" />,
          title: 'Painel de Auditoria (Admin)',
          textColor: 'text-stone-900',
        };
      case 'producer_vivian':
        return {
          icon: <Home className="w-4 h-4 text-[#D35400]" />,
          title: `Painel do Vendedor (${producerName || 'Sítio Agroecológico da Vivian'})`,
          textColor: 'text-[#D35400]',
        };
      case 'producer_leo':
        return {
          icon: <Home className="w-4 h-4 text-[#D35400]" />,
          title: `Painel do Vendedor (${producerName || 'Comércio & Quitutes do Leo'})`,
          textColor: 'text-[#D35400]',
        };
      case 'consumer':
      default:
        return {
          icon: <User className="w-4 h-4 text-emerald-800" />,
          title: 'Painel do Consumidor',
          textColor: 'text-emerald-900',
        };
    }
  };

  const navInfo = getNavigatingLabel();

  return (
    <div className="bg-[#FAF9F6] border-b border-stone-200/90 py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        {/* Left: You are navigating as... */}
        <div>
          <div className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">
            Você está navegando como:
          </div>
          <div className={`flex items-center gap-2 text-sm sm:text-base font-bold font-serif ${navInfo.textColor} mt-0.5`}>
            {navInfo.icon}
            <span>{navInfo.title}</span>
          </div>
        </div>

        {/* Right: Locked account session + logout to switch account */}
        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-600 bg-white border border-stone-200 rounded-lg px-3 py-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>
              Conta: <strong className="text-stone-800">{currentUser?.email || currentUser?.name}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onSwitchAccount}
            title="Sair da conta atual para entrar com outro usuário"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 text-xs font-bold rounded-lg border border-stone-300 shadow-2xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-500" />
            <span>Trocar de conta</span>
          </button>
        </div>

      </div>
    </div>
  );
};

