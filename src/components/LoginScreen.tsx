import React, { useState } from 'react';
import { 
  Leaf, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Building,
  ShoppingBag
} from 'lucide-react';
import { ActiveRoleOption, AppUser } from '../types';
import { StorageService, buildProducerFromUser } from '../services/storage';
import { authService, isSupabaseConfigured, producersService } from '../services/supabaseClient';

interface LoginScreenProps {
  onLogin: (roleOption: ActiveRoleOption, user: AppUser, welcomeNotice?: string) => void;
  users: AppUser[];
  onBackToLanding?: () => void;
  initialTab?: 'login' | 'register';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  users, 
  onBackToLanding,
  initialTab = 'login'
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [infoNotice, setInfoNotice] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'consumer' | 'producer'>('consumer');
  const [regNeighborhood, setRegNeighborhood] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setInfoNotice('');

    if (!identifier.trim()) {
      setLoginError('Por favor, preencha seu CPF ou E-mail cadastrado.');
      return;
    }

    if (!password.trim()) {
      setLoginError('Por favor, informe sua senha de acesso.');
      return;
    }

    const cleanId = identifier.trim().toLowerCase();
    let foundUser: AppUser | undefined;

    // 1. Authenticate against server database first (works across any device & browser)
    try {
      const apiResp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      if (apiResp.ok) {
        const apiData = await apiResp.json();
        if (apiData?.user) {
          const synced = StorageService.mergeSyncedUsers([apiData.user as AppUser]);
          foundUser = synced.find((u) => u.id === apiData.user.id) || (apiData.user as AppUser);
        }
      } else if (apiResp.status === 401 || apiResp.status === 403) {
        const errData = await apiResp.json().catch(() => ({}));
        setLoginError(errData?.error || 'Senha incorreta ou conta bloqueada.');
        return;
      }
    } catch {
      // Backend API unreachable; continue to Supabase/local checks
    }

    // 2. Fallback to local storage or Supabase if not yet in server DB (e.g. initial admin seed)
    if (!foundUser) {
      const currentUsers = StorageService.getUsers();
      foundUser = currentUsers.find(
        u => (u.cpf || '').toLowerCase() === cleanId ||
             (u.email || '').toLowerCase() === cleanId ||
             (u.name || '').toLowerCase() === cleanId
      );

      if (!foundUser) {
        if (isSupabaseConfigured() && cleanId.includes('@')) {
          try {
            const supaRes = await authService.signIn(cleanId, password);
            if (supaRes?.user && !supaRes.error) {
              const profile = supaRes.user as Partial<AppUser>;
              foundUser = {
                id: profile.id || `usr_${Date.now()}`,
                name: profile.name || cleanId.split('@')[0],
                email: (profile.email || cleanId).toLowerCase(),
                phone: profile.phone || '',
                role: profile.role || 'consumer',
                city: profile.city || 'Queimados',
                neighborhood: profile.neighborhood || 'Queimados',
                avatar: profile.avatar || '',
                avatarBgColor: profile.avatarBgColor || '#4E553D',
                status: profile.status || 'ativo',
                verified: true,
                createdAt: profile.createdAt || new Date().toLocaleDateString('pt-BR'),
              };
              StorageService.saveUser(foundUser);
            }
          } catch {
            // Fall through to error message
          }
        }

        if (!foundUser) {
          setLoginError('E-mail ou CPF não encontrado. Verifique os dados digitados ou crie sua conta.');
          return;
        }
      } else {
        if (foundUser.status === 'bloqueado') {
          setLoginError('Esta conta está temporariamente bloqueada pelo administrador.');
          return;
        }

        if (foundUser.password) {
          if (foundUser.password !== password) {
            setLoginError('Senha incorreta. Por favor, verifique a senha digitada.');
            return;
          }
        } else if (!isSupabaseConfigured()) {
          setLoginError('Não foi possível validar sua senha. Tente novamente.');
          return;
        }
      }
    }

    // 3. Sync Supabase session & authoritative role when configured
    if (isSupabaseConfigured() && foundUser.email) {
      try {
        const supaRes = await authService.signIn(foundUser.email, password);
        if (!foundUser.password && foundUser.id && !supaRes?.user && supaRes?.error) {
          // Only fail if user wasn't already verified by /api/auth/login
        }
        if (supaRes?.user && !supaRes.error) {
          const supaProfile = supaRes.user as Partial<AppUser>;
          if (supaProfile.role && supaProfile.role !== foundUser.role) {
            foundUser = {
              ...foundUser,
              role: supaProfile.role,
            };
            StorageService.saveUser(foundUser);
          }
        }
      } catch {
        // Keep verified session
      }
    }

    // Route according to user role
    if (foundUser.role === 'admin') {
      onLogin('admin', foundUser);
    } else if (foundUser.role === 'producer') {
      onLogin('producer', foundUser);
    } else {
      onLogin('consumer', foundUser);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Por favor, informe seu nome completo.');
      return;
    }

    if (!regEmail.trim()) {
      setRegError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!regPassword) {
      setRegError('Por favor, defina uma senha de acesso.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('A senha definida deve ter no mínimo 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas digitadas não coincidem. Digite a mesma senha nos dois campos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = `usr_${Date.now()}`;
      const producerId = regRole === 'producer' ? `prod_${Date.now()}` : undefined;
      const cleanName = regName.trim();
      const cleanNeighborhood = regNeighborhood.trim() || 'Queimados';
      const cleanPhone = regPhone.trim() || '(21) 99999-9999';
      const numericPhone = cleanPhone.replace(/\D/g, '');

      const newUser: AppUser = {
        id: userId,
        name: cleanName,
        email: regEmail.trim().toLowerCase(),
        password: regPassword, // Defined password
        cpf: regCpf.trim() || undefined,
        phone: cleanPhone,
        role: regRole,
        city: 'Queimados',
        neighborhood: cleanNeighborhood,
        status: 'ativo',
        verified: true,
        createdAt: new Date().toLocaleDateString('pt-BR'),
        producerId,
        farmId: producerId,
        farmName: regRole === 'producer' ? `Loja de ${cleanName}` : undefined,
      };

      // 1. Persist registration permanently in backend database with scrypt password hash
      let registeredUser: AppUser = newUser;
      try {
        const regResp = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser),
        });
        if (regResp.status === 409) {
          const errData = await regResp.json().catch(() => ({}));
          setRegError(errData?.error || 'Este e-mail ou CPF já está cadastrado no ConeQta.');
          setIsSubmitting(false);
          return;
        }
        if (regResp.ok) {
          const regData = await regResp.json();
          if (regData?.user) {
            registeredUser = { ...newUser, ...regData.user };
          }
        }
      } catch {
        // Fallback to local/Supabase persistence
      }

      // 2. Sync with Supabase Auth only when configured (avoids duplicate local records)
      let supabaseUserId: string | undefined;
      if (isSupabaseConfigured()) {
        try {
          const supaResult = await authService.signUp(registeredUser.email, regPassword, {
            id: registeredUser.id,
            name: registeredUser.name,
            role: registeredUser.role,
            phone: registeredUser.phone,
            city: registeredUser.city,
            neighborhood: registeredUser.neighborhood,
            producerId,
            farmId: producerId,
            farmName: registeredUser.farmName,
          });
          if (supaResult?.user?.id) {
            supabaseUserId = supaResult.user.id;
          }
        } catch {
          // Fallback to local/backend session
        }
      }

      // 3. If registering as a seller, create and persist Seller/Producer profile globally
      if (regRole === 'producer' && producerId) {
        const newProducer = buildProducerFromUser(registeredUser);
        await producersService.upsert(newProducer, supabaseUserId);
      }

      // 4. Save user in local storage
      StorageService.saveUser(registeredUser);

      const welcomeNotice = `Cadastro realizado com sucesso para ${registeredUser.email}! Bem-vindo(a) ao ConeQta.`;

      // Log in and route
      if (regRole === 'producer') {
        onLogin('producer', registeredUser, welcomeNotice);
      } else {
        onLogin('consumer', registeredUser, welcomeNotice);
      }
    } catch (err: any) {
      setRegError(err?.message || 'Erro ao criar conta. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EFEA] flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 font-sans">
      
      {/* Main Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200/80 flex flex-col md:flex-row my-4">
        
        {/* Left Side: Brand Green Section (#1F6B38) */}
        <div className="md:w-5/12 bg-[#1F6B38] text-stone-100 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle curved background overlay */}
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-black/10 pointer-events-none" />

          <div className="space-y-6 relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/25">
                <Leaf className="w-5 h-5 text-lime-300 fill-lime-300/30" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">ConeQta</h1>
                <p className="text-[10px] font-bold tracking-widest text-lime-200/90 uppercase">Queimados, RJ</p>
              </div>
            </div>

            {/* Headline */}
            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight font-sans">
                Conectando empreendedores de Queimados à população
              </h2>
              <p className="text-xs text-emerald-100/90 mt-3 font-normal leading-relaxed">
                Valorize os comércios de bairro e a agricultura familiar do nosso município. Acesso seguro e direto.
              </p>
            </div>

            {/* Quick Benefits list */}
            <div className="pt-4 space-y-2 text-xs text-emerald-100/85">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-300 shrink-0" />
                <span>Cadastro gratuito para moradores e produtores</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-300 shrink-0" />
                <span>Segurança de dados e acesso individual por senha</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-300 shrink-0" />
                <span>Painel dedicado para cada tipo de perfil</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-8 mt-6 border-t border-white/15 text-[10px] text-emerald-200/80 font-light relative z-10 flex items-center justify-between">
            <span>ConeQta © 2026</span>
            <span>Equipe Q-NECT</span>
          </div>
        </div>

        {/* Right Side: Form (with Tabs for Login and Register) */}
        <div className="md:w-7/12 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
          <div>
            
            {/* Top Bar with Back to Landing button */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase">
                Área de Acesso ConeQta
              </span>
              {onBackToLanding && (
                <button
                  type="button"
                  id="login-back-to-landing-btn"
                  onClick={onBackToLanding}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Início</span>
                </button>
              )}
            </div>

            {/* Navigation Tabs: [ Fazer Login ] vs [ Criar Nova Conta ] */}
            <div className="flex items-center p-1 bg-stone-100 rounded-2xl mb-6 border border-stone-200/80">
              <button
                type="button"
                id="tab-login-btn"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Fazer Login
              </button>
              <button
                type="button"
                id="tab-register-btn"
                onClick={() => {
                  setActiveTab('register');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-[#1F6B38] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>

            {/* ============================================================== */}
            {/* TAB 1: FAZER LOGIN                                             */}
            {/* ============================================================== */}
            {activeTab === 'login' && (
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-sans mb-1">
                  Faça seu login
                </h2>
                <p className="text-xs text-stone-500 mb-6">
                  Informe seus dados para acessar sua conta no ConeQta.
                </p>

                {loginError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                {infoNotice && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                    <span>{infoNotice}</span>
                    <button 
                      type="button" 
                      onClick={() => setInfoNotice('')} 
                      className="text-emerald-900 font-bold ml-2 hover:opacity-75 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* CPF / Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      CPF OU E-MAIL CADASTRADO
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="000.000.000-00 ou seu@email.com"
                        className="w-full px-4 py-3 bg-[#FBFBFA] border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#1F6B38] focus:ring-1 focus:ring-[#1F6B38] transition-colors pr-10"
                      />
                      <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                        SENHA DE ACESSO
                      </label>
                      <button
                        type="button"
                        onClick={() => setInfoNotice('Para redefinir sua senha, solicite o link de recuperação enviado ao seu e-mail cadastrado ou fale com o suporte da plataforma.')}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-[#FBFBFA] border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#1F6B38] focus:ring-1 focus:ring-[#1F6B38] transition-colors pr-10 tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                        title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#1F6B38] hover:bg-[#18532B] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    Confirmar e Entrar
                  </button>
                </form>

                {/* Bottom link to tab 2 */}
                <div className="text-center mt-6 pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-600">
                    Ainda não tem cadastro?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="font-bold text-[#C87A38] hover:underline cursor-pointer"
                    >
                      Crie sua conta aqui!
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: CRIAR NOVA CONTA (Com opção de Definir Senha)          */}
            {/* ============================================================== */}
            {activeTab === 'register' && (
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-sans mb-1">
                  Criar Nova Conta
                </h2>
                <p className="text-xs text-stone-500 mb-5">
                  Preencha seus dados e defina sua senha para começar no ConeQta.
                </p>

                {regError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                      NOME COMPLETO *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex: Mariana Silva Souza"
                      className="w-full px-3.5 py-2.5 bg-[#FBFBFA] border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#1F6B38] focus:ring-1 focus:ring-[#1F6B38]"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                        E-MAIL *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full px-3.5 py-2.5 bg-[#FBFBFA] border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#1F6B38] focus:ring-1 focus:ring-[#1F6B38] pr-8"
                        />
                        <Mail className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                        TELEFONE / WHATSAPP
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="(21) 98765-4321"
                          className="w-full px-3.5 py-2.5 bg-[#FBFBFA] border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#1F6B38] focus:ring-1 focus:ring-[#1F6B38] pr-8"
                        />
                        <Phone className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* CPF & Bairro */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                        CPF (OPCIONAL)
                      </label>
                      <input
                        type="text"
                        value={regCpf}
                        onChange={(e) => setRegCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full px-3.5 py-2.5 bg-[#FBFBFA] border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#1F6B38] focus:ring-1 focus:ring-[#1F6B38]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                        BAIRRO EM QUEIMADOS *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regNeighborhood}
                          onChange={(e) => setRegNeighborhood(e.target.value)}
                          placeholder="Digite o nome do seu bairro"
                          className="w-full px-3.5 py-2.5 bg-[#FBFBFA] border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#1F6B38] focus:ring-1 focus:ring-[#1F6B38] pr-8"
                        />
                        <MapPin className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Tipo de Perfil */}
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      SELECIONE SEU TIPO DE PERFIL *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('consumer')}
                        className={`p-2.5 rounded-xl text-xs font-bold border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          regRole === 'consumer'
                            ? 'bg-emerald-50 border-[#1F6B38] text-[#1F6B38] ring-1 ring-[#1F6B38]'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4 shrink-0 text-emerald-600" />
                        <div>
                          <div className="font-bold">Consumidor</div>
                          <div className="text-[10px] font-normal text-stone-500">Explorar e avaliar</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole('producer')}
                        className={`p-2.5 rounded-xl text-xs font-bold border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          regRole === 'producer'
                            ? 'bg-amber-50 border-amber-600 text-amber-900 ring-1 ring-amber-600'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <Building className="w-4 h-4 shrink-0 text-amber-600" />
                        <div>
                          <div className="font-bold">Vendedor / Comércio</div>
                          <div className="text-[10px] font-normal text-stone-500">Divulgar catálogo</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* DEFINIR SENHA (Solicitado pelo usuário) */}
                  <div className="pt-2 border-t border-stone-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Senha */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                          DEFINIR SENHA DE ACESSO *
                        </label>
                        <div className="relative">
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Mínimo 6 dígitos"
                            className="w-full px-3.5 py-2.5 bg-[#FBFBFA] border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#1F6B38] focus:ring-1 focus:ring-[#1F6B38] pr-8 tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                            title={showRegPassword ? 'Ocultar' : 'Exibir'}
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirmar Senha */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                          CONFIRMAR SENHA *
                        </label>
                        <div className="relative">
                          <input
                            type={showRegConfirmPassword ? 'text' : 'password'}
                            required
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="Repita a senha"
                            className="w-full px-3.5 py-2.5 bg-[#FBFBFA] border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#1F6B38] focus:ring-1 focus:ring-[#1F6B38] pr-8 tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                            className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                            title={showRegConfirmPassword ? 'Ocultar' : 'Exibir'}
                          >
                            {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                    </div>
                    <p className="text-[10px] text-stone-500 mt-1">
                      A senha deve conter no mínimo 6 caracteres para garantir a segurança da sua conta.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#1F6B38] hover:bg-[#18532B] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-3 cursor-pointer"
                  >
                    {isSubmitting ? 'Criando sua conta...' : 'Cadastrar e Acessar Conta'}
                  </button>
                </form>

                {/* Bottom link to tab 1 */}
                <div className="text-center mt-5 pt-3 border-t border-stone-100">
                  <p className="text-xs text-stone-600">
                    Já possui cadastro?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="font-bold text-[#1F6B38] hover:underline cursor-pointer"
                    >
                      Acessar conta existente
                    </button>
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
