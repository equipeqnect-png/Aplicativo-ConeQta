import React, { useState, useEffect } from 'react';
import { Check, Palette } from 'lucide-react';

export const PROFILE_BG_COLORS = [
  { id: '#1F6B38', label: 'Verde Mata' },
  { id: '#4E553D', label: 'Verde Oliva' },
  { id: '#D35400', label: 'Terracota' },
  { id: '#B45309', label: 'Âmbar Dourado' },
  { id: '#0F766E', label: 'Turquesa Profundo' },
  { id: '#1D4ED8', label: 'Azul Royal' },
  { id: '#6D28D9', label: 'Roxo Violeta' },
  { id: '#BE185D', label: 'Rosa Framboesa' },
  { id: '#334155', label: 'Grafite Urbano' },
  { id: '#1B2820', label: 'Verde Escuro' },
];

function getInitials(name?: string): string {
  const clean = (name || '').trim();
  if (!clean) return 'C';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

interface AvatarDisplayProps {
  src?: string;
  bgColor?: string;
  name?: string;
  alt?: string;
  className?: string;
  textClassName?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  src,
  bgColor,
  name,
  alt,
  className = 'w-12 h-12 rounded-2xl',
  textClassName = 'text-base',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const cleanSrc = (src || '').trim();
  const hasPhoto = Boolean(cleanSrc) && !imgError;

  if (hasPhoto) {
    return (
      <img
        src={cleanSrc}
        alt={alt || name || 'Foto de perfil'}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ backgroundColor: bgColor || '#4E553D' }}
      aria-label={alt || name || 'Avatar'}
      className={`flex items-center justify-center text-white font-bold font-serif select-none ${className}`}
    >
      <span className={textClassName}>{getInitials(name)}</span>
    </div>
  );
};

interface CoverDisplayProps {
  src?: string;
  bgColor?: string;
  alt?: string;
  className?: string;
}

export const CoverDisplay: React.FC<CoverDisplayProps> = ({
  src,
  bgColor,
  alt,
  className = 'w-full h-full',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const cleanSrc = (src || '').trim();
  const hasPhoto = Boolean(cleanSrc) && !imgError;

  if (hasPhoto) {
    return (
      <img
        src={cleanSrc}
        alt={alt || 'Foto de capa'}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ backgroundColor: bgColor || '#1F6B38' }}
      aria-label={alt || 'Fundo da capa'}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25 pointer-events-none" />
    </div>
  );
};

interface ColorPalettePickerProps {
  label: string;
  selectedColor?: string;
  onChange: (color: string) => void;
}

export const ColorPalettePicker: React.FC<ColorPalettePickerProps> = ({
  label,
  selectedColor = '#4E553D',
  onChange,
}) => {
  return (
    <div className="space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-stone-500" />
          <span>{label}</span>
        </span>
        <span className="text-[10px] font-mono text-stone-500 uppercase">{selectedColor}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PROFILE_BG_COLORS.map((c) => {
          const isSelected = selectedColor.toLowerCase() === c.id.toLowerCase();
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              title={c.label}
              aria-label={`Selecionar cor ${c.label}`}
              style={{ backgroundColor: c.id }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer border-2 ${
                isSelected
                  ? 'border-stone-900 scale-110 shadow-sm'
                  : 'border-white hover:scale-105 shadow-2xs'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
            </button>
          );
        })}

        <label
          title="Escolher cor personalizada"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-stone-200 hover:border-stone-400 text-[10px] font-bold text-stone-700 cursor-pointer"
        >
          <span>Outra cor</span>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 p-0 border-0 bg-transparent cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
