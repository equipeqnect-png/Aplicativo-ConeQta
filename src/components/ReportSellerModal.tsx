import React, { useState, useEffect } from 'react';
import { X, Flag, AlertTriangle, ShieldAlert, CheckCircle2, Send } from 'lucide-react';
import { Producer, AppUser, SellerReport } from '../types';
import { StorageService } from '../services/storage';

interface ReportSellerModalProps {
  producer: Producer | null;
  currentUser: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS: { value: SellerReport['reason']; label: string; description: string }[] = [
  {
    value: 'golpe_fraude',
    label: 'Golpe ou Fraude Financeira',
    description: 'Solicitação de pagamento antecipado suspeito, links falsos ou golpe no WhatsApp.',
  },
  {
    value: 'produto_enganoso',
    label: 'Produto ou Serviço Enganoso',
    description: 'Informações falsas no catálogo, qualidade incompatível ou preço abusivo divergente.',
  },
  {
    value: 'perfil_falso',
    label: 'Perfil Falso / Identidade Suspeita',
    description: 'Uso indevido de nome, fotos ou endereço de terceiros em Queimados.',
  },
  {
    value: 'comportamento_suspeito',
    label: 'Comportamento Suspeito ou Ofensivo',
    description: 'Conduta inadequada, ameaças ou tentativa de phishing no contato direto.',
  },
  {
    value: 'outro',
    label: 'Outro Motivo',
    description: 'Outra irregularidade ou atividade suspeita que precisa ser verificada.',
  },
];

export const ReportSellerModal: React.FC<ReportSellerModalProps> = ({
  producer,
  currentUser,
  isOpen,
  onClose,
}) => {
  const [reason, setReason] = useState<SellerReport['reason']>('golpe_fraude');
  const [reporterName, setReporterName] = useState(currentUser?.name || '');
  const [reporterEmail, setReporterEmail] = useState(currentUser?.email || '');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReporterName(currentUser?.name || '');
      setReporterEmail(currentUser?.email || '');
      setReason('golpe_fraude');
      setDescription('');
      setSubmitted(false);
    }
  }, [isOpen, currentUser, producer?.id]);

  if (!isOpen || !producer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newReport: SellerReport = {
      id: `rep_${Date.now()}`,
      producerId: producer.id,
      producerName: producer.name,
      farmName: producer.farmName,
      reporterName: reporterName.trim() || 'Morador de Queimados',
      reporterEmail: reporterEmail.trim() || undefined,
      reason,
      description: description.trim(),
      createdAt: new Date().toISOString(),
      status: 'pendente',
    };

    StorageService.addSellerReport(newReport);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="report-seller-modal"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="bg-red-700 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-100 block">
                Canal de Segurança ConeQta
              </span>
              <h3 className="font-bold text-lg font-serif leading-tight">
                Denunciar Vendedor
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de denúncia"
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-stone-900 text-lg font-serif">
                  Denúncia Registrada com Segurança
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                  Obrigado por ajudar a manter o catálogo de Queimados seguro. Nossa equipe de moderação irá analisar a denúncia referente a{' '}
                  <strong className="text-stone-800">{producer.farmName}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Concluir e Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target seller banner */}
              <div className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-2xl flex items-center gap-3">
                <img
                  src={producer.avatar}
                  alt={producer.name}
                  className="w-11 h-11 rounded-xl object-cover border border-red-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase text-red-700 block">
                    Perfil denunciado
                  </span>
                  <h4 className="font-bold text-sm text-stone-900 truncate">{producer.farmName}</h4>
                  <p className="text-xs text-stone-600 truncate">{producer.name}</p>
                </div>
                <Flag className="w-4 h-4 text-red-600 shrink-0" />
              </div>

              {/* Reason selector */}
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Motivo da Denúncia *
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((item) => {
                    const selected = reason === item.value;
                    return (
                      <label
                        key={item.value}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                          selected
                            ? 'bg-red-50 border-red-400 ring-1 ring-red-400'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report-reason"
                          value={item.value}
                          checked={selected}
                          onChange={() => setReason(item.value)}
                          className="mt-0.5 text-red-600 focus:ring-red-600"
                        />
                        <div>
                          <div className="text-xs font-bold text-stone-900">{item.label}</div>
                          <div className="text-[11px] text-stone-500 leading-snug">{item.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Reporter Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Opcional (ou anônimo)"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    E-mail para Retorno
                  </label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="seu@email.com (opcional)"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Descreva o ocorrido *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o que aconteceu, quando foi o contato e quais indícios de golpe ou atividade suspeita você identificou..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Sua denúncia é confidencial e será encaminhada para análise da moderação do ConeQta Queimados.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!description.trim()}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Denúncia</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
