import React, { useState } from 'react';
import { useMission, ThemeMode, AccentColor } from '../../store/useMission';
import { playClickTone } from '../../utils/audio';

interface ThemeSwitcherProps {
  className?: string;
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = '',
  compact = false,
}) => {
  const { theme, setTheme, accent, setAccent } = useMission();
  const [menuOpen, setMenuOpen] = useState(false);

  const appearanceOptions: { id: ThemeMode; label: string; title: string }[] = [
    { id: 'dark', label: 'Dark', title: 'OLED pure black deep space display' },
    { id: 'light', label: 'Light', title: 'High contrast daylight operational print mode' },
    { id: 'system', label: 'Auto', title: 'Matches operating system preference' },
  ];

  const accentOptions: { id: AccentColor; label: string; hex: string }[] = [
    { id: 'cobalt', label: 'Cobalt', hex: '#38BDF8' },
    { id: 'emerald', label: 'Emerald', hex: '#34D399' },
    { id: 'amber', label: 'Amber', hex: '#FBBF24' },
    { id: 'slate', label: 'Slate', hex: '#CBD5E1' },
  ];

  if (compact) {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => {
            playClickTone();
            setMenuOpen(!menuOpen);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-chalk text-[11px] font-medium transition-colors"
          title="Display appearance & accent color settings"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: accentOptions.find((a) => a.id === accent)?.hex ?? '#38BDF8',
            }}
          />
          <span className="capitalize">{theme === 'oled' || theme === 'navy' ? 'Dark' : theme}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-50 w-52 p-2.5 rounded-2xl bg-[#090D14]/95 backdrop-blur-2xl border border-white/15 shadow-2xl text-xs space-y-2.5 select-none">
            {/* Appearance Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-chalk-dim uppercase tracking-wider block px-1">
                Appearance
              </span>
              <div className="grid grid-cols-3 gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                {appearanceOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      playClickTone();
                      setTheme(opt.id);
                    }}
                    title={opt.title}
                    className={`py-1 text-center rounded-md font-medium text-[10px] transition-all ${
                      theme === opt.id || (opt.id === 'dark' && (theme === 'oled' || theme === 'navy'))
                        ? 'bg-sky text-navy-950 font-bold shadow-sm'
                        : 'text-chalk-dim hover:text-chalk'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-chalk-dim uppercase tracking-wider block px-1">
                Accent Theme
              </span>
              <div className="grid grid-cols-4 gap-1.5 px-1 py-1">
                {accentOptions.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      playClickTone();
                      setAccent(acc.id);
                    }}
                    title={`Switch to ${acc.label} accent`}
                    className={`flex flex-col items-center gap-1 p-1 rounded-lg border transition-all ${
                      accent === acc.id
                        ? 'border-white/40 bg-white/10 shadow-sm'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-inner"
                      style={{ backgroundColor: acc.hex }}
                    />
                    <span className="text-[9px] text-chalk-dim">{acc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Full Segmented Appearance */}
      <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5 text-[11px]">
        {appearanceOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              playClickTone();
              setTheme(opt.id);
            }}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              theme === opt.id || (opt.id === 'dark' && (theme === 'oled' || theme === 'navy'))
                ? 'bg-sky text-navy-950 font-bold shadow-sm'
                : 'text-chalk-dim hover:text-chalk'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Accent Color Circles */}
      <div className="flex items-center gap-1.5">
        {accentOptions.map((acc) => (
          <button
            key={acc.id}
            type="button"
            onClick={() => {
              playClickTone();
              setAccent(acc.id);
            }}
            title={acc.label}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform ${
              accent === acc.id ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110 opacity-70'
            }`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: acc.hex }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
