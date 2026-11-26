import React, { useState } from 'react';
import {
  Star,
  Lock,
  Send,
  CheckCircle2,
  MessageSquare,
  Lightbulb,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { AppUser, AppFeedback } from '../types';
import { appFeedbacksService } from '../services/supabaseClient';

interface AppFeedbackTabProps {
  currentUser: AppUser;
  accentColor?: 'olive' | 'terracotta';
}

const RATING_LABELS: Record<number, string> = {
  1: 'Precisa melhorar muito',
  2: 'Razoável',
  3: 'Bom',
  4: 'Muito bom',
  5: 'Excelente',
};

export const AppFeedbackTab: React.FC<AppFeedbackTabProps> = ({
  currentUser,
  accentColor = 'olive',
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [experience, setExperience] = useState('');
  const [comment, setComment] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTerracotta = accentColor === 'terracotta';
  const primaryBtnClass = isTerracotta
    ? 'bg-[#D35400] hover:bg-[#BA4A00]'
    : 'bg-[#4E553D] hover:bg-[#3E452E]';
  const focusBorderClass = isTerracotta
    ? 'focus:border-[#D35400] focus:ring-[#D35400]'
    : 'focus:border-[#4E553D] focus:ring-[#4E553D]';
  const iconAccentClass = isTerracotta ? 'text-[#D35400]' : 'text-[#4E553D]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!experience.trim()) {
      setError('Por favor, conte como foi a sua experiência usando o aplicativo.');
      return;
    }

    setIsSubmitting(true);

    const newFeedback: AppFeedback = {
      id: `appfb_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      userNeighborhood: currentUser.neighborhood,
      rating,
      experience: experience.trim(),
      comment: comment.trim() || undefined,
      suggestion: suggestion.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'novo',
    };

    try {
      await appFeedbacksService.add(newFeedback);
      setSubmitted(true);
      setExperience('');
      setComment('');
      setSuggestion('');
      setRating(5);
    } catch {
      setError('Não foi possível enviar sua avaliação agora. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-2xs max-w-2xl mx-auto text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
            Avaliação enviada com sucesso
          </h3>
          <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            Obrigado por compartilhar sua experiência com o ConeQta,{' '}
            <strong className="text-stone-900">{currentUser.name}</strong>.
          </p>
        </div>

        <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-600 flex items-start gap-3 text-left max-w-md mx-auto">
          <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>
            Sua avaliação, comentários e sugestões foram registrados de forma{' '}
            <strong className="text-stone-800">confidencial</strong>. Eles não ficam
            visíveis para o público e serão lidos exclusivamente pela administração da plataforma.
          </span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className={`px-6 py-3 ${primaryBtnClass} text-white font-bold text-xs rounded-xl transition-colors cursor-pointer`}
          >
            Enviar nova avaliação ou sugestão
          </button>
        </div>
      </div>
    );
  }

  const displayedRating = hoverRating || rating;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2 pb-5 border-b border-stone-100">
        <h3 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
          Avalie o Aplicativo ConeQta
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Sua opinião ajuda a melhorar a plataforma para moradores e vendedores de Queimados.
          Conte como foi sua experiência e envie comentários ou sugestões.
        </p>

        {/* Privacy Notice */}
        <div className="mt-3 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-start gap-2.5 text-xs text-stone-700">
          <Lock className={`w-4 h-4 shrink-0 mt-0.5 ${iconAccentClass}`} />
          <span>
            <strong>Privacidade garantida:</strong> suas respostas e avaliações{' '}
            <strong>não ficam visíveis para o público</strong> — apenas o administrador
            do ConeQta tem acesso para analisar e melhorar o aplicativo.
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Star Rating */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
            1. Nota Geral para o Aplicativo *
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
                  className="p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= displayedRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-stone-700 ml-1">
              {displayedRating}/5 — {RATING_LABELS[displayedRating]}
            </span>
          </div>
        </div>

        {/* 2. Experience */}
        <div className="space-y-1.5">
          <label
            htmlFor="app-feedback-experience"
            className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700 uppercase tracking-wider"
          >
            <Sparkles className={`w-3.5 h-3.5 ${iconAccentClass}`} />
            <span>2. Como foi a sua experiência usando o ConeQta? *</span>
          </label>
          <textarea
            id="app-feedback-experience"
            required
            rows={3}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Conte o que achou da navegação, facilidade de uso, visual ou velocidade..."
            className={`w-full p-3.5 bg-[#FBFBFA] border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-800 focus:bg-white focus:outline-hidden focus:ring-1 ${focusBorderClass} transition-colors`}
          />
        </div>

        {/* 3. Comments */}
        <div className="space-y-1.5">
          <label
            htmlFor="app-feedback-comment"
            className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700 uppercase tracking-wider"
          >
            <MessageSquare className={`w-3.5 h-3.5 ${iconAccentClass}`} />
            <span>3. Comentários Adicionais (Opcional)</span>
          </label>
          <textarea
            id="app-feedback-comment"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Deixe elogios, observações ou relate algum problema encontrado..."
            className={`w-full p-3.5 bg-[#FBFBFA] border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-800 focus:bg-white focus:outline-hidden focus:ring-1 ${focusBorderClass} transition-colors`}
          />
        </div>

        {/* 4. Suggestions */}
        <div className="space-y-1.5">
          <label
            htmlFor="app-feedback-suggestion"
            className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700 uppercase tracking-wider"
          >
            <Lightbulb className={`w-3.5 h-3.5 ${iconAccentClass}`} />
            <span>4. Sugestões de Melhoria (Opcional)</span>
          </label>
          <textarea
            id="app-feedback-suggestion"
            rows={2}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="O que gostaria de ver nas próximas atualizações do aplicativo?"
            className={`w-full p-3.5 bg-[#FBFBFA] border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-800 focus:bg-white focus:outline-hidden focus:ring-1 ${focusBorderClass} transition-colors`}
          />
        </div>

        {/* Footer / Submit */}
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-stone-500">
            Enviando como <strong className="text-stone-700">{currentUser.name}</strong> (
            {currentUser.role === 'producer' ? 'Vendedor' : 'Consumidor'})
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 ${primaryBtnClass} disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer`}
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Enviando...' : 'Enviar Avaliação Privada'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
