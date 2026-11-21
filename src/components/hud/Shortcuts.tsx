import React, { useEffect } from 'react';
import { useMission, ThemeMode } from '../../store/useMission';
import { isSoundEnabled, setSoundEnabled, playClickTone } from '../../utils/audio';

export const Shortcuts: React.FC = () => {
  const {
    shortcutsOpen,
    setShortcutsOpen,
    setWarp,
    warp,
    events,
    selAlertId,
    setSelAlertId,
    theme,
    setTheme,
    setView,
  } = useMission();

  // Keyboard navigation listener per Section 9.5
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing into an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        setWarp(warp === 0 ? 1 : 0);
        playClickTone();
      } else if (e.key === '1') {
        setWarp(1);
        playClickTone();
      } else if (e.key === '2') {
        setWarp(10);
        playClickTone();
      } else if (e.key === '3') {
        setWarp(100);
        playClickTone();
      } else if (e.key === '4') {
        setWarp(500);
        playClickTone();
      } else if (e.key === '5') {
        setWarp(0);
        playClickTone();
      } else if (e.key === '[') {
        e.preventDefault();
        // Step to previous alert
        if (events.length > 0) {
          const idx = events.findIndex((a) => a.id === selAlertId);
          const nextIdx = idx > 0 ? idx - 1 : events.length - 1;
          setSelAlertId(events[nextIdx].id);
        }
      } else if (e.key === ']') {
        e.preventDefault();
        // Step to next alert
        if (events.length > 0) {
          const idx = events.findIndex((a) => a.id === selAlertId);
          const nextIdx = idx < events.length - 1 ? idx + 1 : 0;
          setSelAlertId(events[nextIdx].id);
        }
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        const themes: ThemeMode[] = ['oled', 'navy', 'light'];
        const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
        setTheme(nextTheme);
        playClickTone();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setView('globe');
        playClickTone();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setView('split');
        playClickTone();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        const next = !isSoundEnabled();
        setSoundEnabled(next);
        if (next) playClickTone();
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(!shortcutsOpen);
      } else if (e.key === 'Escape' && shortcutsOpen) {
        setShortcutsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shortcutsOpen,
    setShortcutsOpen,
    warp,
    setWarp,
    events,
    selAlertId,
    setSelAlertId,
    theme,
    setTheme,
    setView,
  ]);

  if (!shortcutsOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/15 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl w-full max-w-lg">
        <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-5 text-xs space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase">Input Matrix</div>
              <h3 className="font-condensed font-bold text-base text-white uppercase tracking-wide">
                Keyboard Shortcuts
              </h3>
            </div>
            <button
              onClick={() => setShortcutsOpen(false)}
              className="text-white/40 hover:text-white px-2 py-1 font-mono text-xs rounded border border-white/10 hover:border-white/20 transition-colors"
            >
              Esc ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/70">
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Play / Pause clock</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                Space
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Set warp (1x - 500x)</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                1 - 4
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Pause clock</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                5
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Cycle theme</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                T
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Inertial Globe view</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                G
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Split Ground Track</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                M
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Previous alert</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                [
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Next alert</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                ]
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Toggle tactical audio</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                A
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span>Toggle shortcuts</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-white text-[11px] shadow-sm">
                ?
              </kbd>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 text-[11px] text-white/40">
            All shortcuts are operable during real-time flight dynamics simulation without requiring a mouse.
          </div>
        </div>
      </div>
    </div>
  );
};
