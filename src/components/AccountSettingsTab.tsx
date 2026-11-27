import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Save,
  UserCog,
  Camera,
  Upload,
} from 'lucide-react';
import { AppUser } from '../types';
import { StorageService } from '../services/storage';
import { authService, producersService } from '../services/supabaseClient';
import { AvatarDisplay, ColorPalettePicker } from './ProfileMedia';

interface AccountSettingsTabProps {
  currentUser: AppUser;
  accentColor?: 'olive' | 'terracotta' | 'dark';
  onUserUpdated: (updatedUser: AppUser) => void;
  onAccountDeleted: () => void;
}

export const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({
  currentUser,
  accentColor = 'olive',
  onUserUpdated,
  onAccountDeleted,
}) => {
  // Section 1: Email & Phone state
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [contactPasswordConfirm, setContactPasswordConfirm] = useState('');
  const [showContactPw, setShowContactPw] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');

  // Section 2: Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmNewPw, setShowConfirmNewPw] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Section 0: Profile Photo & Background Color state
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [avatarBgColor, setAvatarBgColor] = useState(currentUser.avatarBgColor || '#4E553D');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // Section 3: Delete Account inline confirmation state
  const [isDeleteExpanded, setIsDeleteExpanded] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePasswordConfirm, setDeletePasswordConfirm] = useState('');
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setAvatar(currentUser.avatar || '');
    setAvatarBgColor(currentUser.avatarBgColor || '#4E553D');
  }, [currentUser.id, currentUser.email, currentUser.phone, currentUser.avatar, currentUser.avatarBgColor]);

  const persistProfileAppearance = (nextAvatar: string, nextBgColor: string, message: string) => {
    const updatedUser: AppUser = {
      ...currentUser,
      avatar: nextAvatar,
      avatarBgColor: nextBgColor,
    };
    StorageService.saveUser(updatedUser);
    StorageService.setCurrentUser(updatedUser);

    if (currentUser.role === 'producer') {
      const targetProducerId = currentUser.producerId || currentUser.farmId || `prod_${currentUser.id}`;
      const existingProducer = StorageService.getProducers().find(
        (p) => p.id === targetProducerId || p.id === currentUser.id
      );
      if (existingProducer) {
        producersService.update(existingProducer.id, {
          avatar: nextAvatar,
          avatarBgColor: nextBgColor,
        }).catch(() => {});
      }
    }

    onUserUpdated(updatedUser);
    setAvatarError('');
    setAvatarSuccess(message);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setAvatarError('A imagem selecionada é muito grande. Escolha uma foto de até 6MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result;
        setAvatar(base64);
        persistProfileAppearance(base64, avatarBgColor, 'Foto de perfil atualizada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const accentBtnClass =
    accentColor === 'terracotta'
      ? 'bg-[#D35400] hover:bg-[#BA4A00]'
      : accentColor === 'dark'
      ? 'bg-[#1B2820] hover:bg-[#131d17]'
      : 'bg-[#4E553D] hover:bg-[#3E452E]';

  const accentBadgeClass =
    accentColor === 'terracotta'
      ? 'bg-orange-50 text-[#D35400] border-orange-200'
      : accentColor === 'dark'
      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
      : 'bg-lime-50 text-[#4E553D] border-lime-200';

  const emailChanged = email.trim().toLowerCase() !== (currentUser.email || '').trim().toLowerCase();
  const hasStoredPassword = Boolean(currentUser.password);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    setContactSuccess('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setContactError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.replace(/\D/g, '').length < 8) {
      setContactError('Por favor, informe um número de telefone válido com DDD.');
      return;
    }

    // Check uniqueness across registered users if changing email
    if (emailChanged) {
      const existingUsers = StorageService.getUsers();
      const duplicate = existingUsers.find(
        (u) => u.id !== currentUser.id && (u.email || '').trim().toLowerCase() === trimmedEmail
      );
      if (duplicate) {
        setContactError('Este e-mail já está em uso por outra conta no ConeQta.');
        return;
      }

      if (hasStoredPassword && contactPasswordConfirm !== currentUser.password) {
        setContactError('Informe sua senha atual correta para confirmar a alteração do e-mail.');
        return;
      }
      if (!hasStoredPassword && !contactPasswordConfirm) {
        setContactError('Informe sua senha atual para confirmar a alteração do e-mail.');
        return;
      }
    }

    setContactSaving(true);
    const result = await authService.updateUserCredentials(currentUser, {
      email: trimmedEmail,
      phone: trimmedPhone,
      currentPassword: contactPasswordConfirm || currentUser.password,
    });
    setContactSaving(false);

    if (!result.success) {
      setContactError(result.error || 'Não foi possível atualizar seus dados. Tente novamente.');
      return;
    }

    setContactPasswordConfirm('');
    onUserUpdated(result.user);
    setContactSuccess(
      result.emailConfirmationPending
        ? 'Dados atualizados! Caso utilize autenticação por e-mail, verifique sua caixa de entrada para confirmar o novo endereço.'
        : 'E-mail e telefone atualizados com sucesso!'
    );
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (hasStoredPassword && currentPassword !== currentUser.password) {
      setPasswordError('A senha atual informada está incorreta.');
      return;
    }
    if (!hasStoredPassword && !currentPassword) {
      setPasswordError('Informe sua senha atual para definir uma nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    if (newPassword === currentPassword || (hasStoredPassword && newPassword === currentUser.password)) {
      setPasswordError('A nova senha precisa ser diferente da senha atual.');
      return;
    }

    setPasswordSaving(true);
    const result = await authService.updateUserCredentials(currentUser, {
      password: newPassword,
      currentPassword,
    });
    setPasswordSaving(false);

    if (!result.success) {
      setPasswordError(result.error || 'Não foi possível alterar a senha. Tente novamente.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    onUserUpdated(result.user);
    setPasswordSuccess('Senha alterada com sucesso!');
  };

  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (hasStoredPassword && deletePasswordConfirm !== currentUser.password) {
      setDeleteError('A senha atual informada está incorreta.');
      return;
    }

    if (!hasStoredPassword) {
      if (!deletePasswordConfirm) {
        setDeleteError('Informe sua senha atual para confirmar a exclusão da conta.');
        return;
      }
      try {
        const verifyResp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: currentUser.email, password: deletePasswordConfirm }),
        });
        if (verifyResp.status === 401) {
          setDeleteError('A senha atual informada está incorreta.');
          return;
        }
      } catch {
        // allow fallback if offline
      }
    }

    if (deleteConfirmText.trim().toUpperCase() !== 'DELETAR') {
      setDeleteError('Digite a palavra DELETAR em maiúsculas para confirmar a exclusão definitiva.');
      return;
    }

    setIsDeleting(true);
    await authService.deleteUserAccount(currentUser);
    setIsDeleting(false);
    onAccountDeleted();
  };

  const roleLabel =
    currentUser.role === 'producer'
      ? 'Vendedor / Comércio Local'
      : currentUser.role === 'admin'
      ? 'Administrador'
      : 'Consumidor';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${accentBadgeClass}`}>
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-serif text-stone-900">
              Configurações da Conta
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Atualize seu e-mail, telefone e senha quando quiser, ou gerencie a exclusão da sua conta.
            </p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border self-start sm:self-auto ${accentBadgeClass}`}>
          {roleLabel}
        </span>
      </div>

      {/* 0. Foto de Perfil ou Cor de Fundo */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <h4 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-stone-600" />
            <span>Foto de Perfil e Aparência</span>
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Envie uma foto do seu aparelho ou escolha uma cor de fundo para o seu perfil quando estiver sem foto.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <AvatarDisplay
            src={avatar}
            bgColor={avatarBgColor}
            name={currentUser.name}
            className="w-20 h-20 rounded-2xl border-2 border-stone-200 shadow-sm shrink-0"
            textClassName="text-2xl"
          />

          <input
            type="file"
            ref={avatarInputRef}
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Carregar Foto do Aparelho</span>
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatar('');
                    persistProfileAppearance('', avatarBgColor, 'Foto removida. Você pode escolher uma cor de fundo abaixo.');
                  }}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Foto</span>
                </button>
              )}
            </div>

            {!avatar && (
              <ColorPalettePicker
                label="Cor de Fundo do Perfil (sem foto)"
                selectedColor={avatarBgColor}
                onChange={(color) => {
                  setAvatarBgColor(color);
                  persistProfileAppearance('', color, 'Cor de fundo do perfil atualizada!');
                }}
              />
            )}
          </div>
        </div>

        {avatarError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{avatarError}</span>
          </div>
        )}

        {avatarSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{avatarSuccess}</span>
          </div>
        )}
      </div>

      {/* 1. Alterar E-mail e Telefone */}
      <form
        onSubmit={handleSaveContact}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-5"
      >
        <div className="border-b border-stone-100 pb-3">
          <h4 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-stone-600" />
            <span>Alterar E-mail e Telefone</span>
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Mantenha seus dados de contato atualizados para acesso à plataforma e comunicação.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">E-mail Cadastrado</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setContactError('');
                  setContactSuccess('');
                }}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setContactError('');
                  setContactSuccess('');
                }}
                placeholder="(21) 99999-9999"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
              />
            </div>
          </div>
        </div>

        {emailChanged && (
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-stone-700">
              Confirme sua senha atual para alterar o e-mail
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type={showContactPw ? 'text' : 'password'}
                required
                value={contactPasswordConfirm}
                onChange={(e) => setContactPasswordConfirm(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-500"
              />
              <button
                type="button"
                onClick={() => setShowContactPw((v) => !v)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label="Mostrar ou ocultar senha"
              >
                {showContactPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {contactError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{contactError}</span>
          </div>
        )}

        {contactSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{contactSuccess}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={contactSaving}
            className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 ${accentBtnClass}`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{contactSaving ? 'Salvando...' : 'Salvar E-mail e Telefone'}</span>
          </button>
        </div>
      </form>

      {/* 2. Alterar Senha */}
      <form
        onSubmit={handleSavePassword}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-5"
      >
        <div className="border-b border-stone-100 pb-3">
          <h4 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-stone-600" />
            <span>Alterar Senha</span>
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Escolha uma senha forte com no mínimo 6 caracteres para proteger sua conta.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">Senha Atual</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type={showCurrentPw ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                placeholder="Digite sua senha atual"
                className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label="Mostrar ou ocultar senha atual"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                  aria-label="Mostrar ou ocultar nova senha"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmNewPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPw((v) => !v)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                  aria-label="Mostrar ou ocultar confirmação de senha"
                >
                  {showConfirmNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={passwordSaving}
            className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 ${accentBtnClass}`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{passwordSaving ? 'Atualizando...' : 'Atualizar Senha'}</span>
          </button>
        </div>
      </form>

      {/* 3. Zona de Perigo: Deletar Conta */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-red-200 shadow-2xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold font-serif text-red-800">Deletar Conta</h4>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Esta ação é permanente e não pode ser desfeita. Seu cadastro será removido do aplicativo
              {currentUser.role === 'producer'
                ? ', juntamente com o perfil da sua loja e todos os produtos ou serviços divulgados no catálogo.'
                : '.'}
            </p>
          </div>
        </div>

        {!isDeleteExpanded ? (
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsDeleteExpanded(true);
                setDeleteError('');
                setDeleteConfirmText('');
                setDeletePasswordConfirm('');
              }}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Deletar Minha Conta</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleConfirmDeleteAccount}
            className="p-4 sm:p-5 bg-red-50/70 border border-red-200 rounded-2xl space-y-4"
          >
            <div className="text-xs font-bold text-red-800">
              Confirmação necessária para excluir sua conta permanentemente:
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Sua Senha Atual</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type={showDeletePw ? 'text' : 'password'}
                  required
                  value={deletePasswordConfirm}
                  onChange={(e) => {
                    setDeletePasswordConfirm(e.target.value);
                    setDeleteError('');
                  }}
                  placeholder="Confirme sua senha atual"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-red-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePw((v) => !v)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                  aria-label="Mostrar ou ocultar senha"
                >
                  {showDeletePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">
                Digite <span className="text-red-700 font-extrabold">DELETAR</span> para confirmar
              </label>
              <input
                type="text"
                required
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteError('');
                }}
                placeholder="DELETAR"
                className="w-full px-3.5 py-2.5 bg-white border border-red-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-red-500 uppercase"
              />
            </div>

            {deleteError && (
              <div className="p-3 bg-white border border-red-300 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteExpanded(false);
                  setDeleteError('');
                  setDeleteConfirmText('');
                  setDeletePasswordConfirm('');
                }}
                className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deletando...' : 'Confirmar Exclusão Definitiva'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
