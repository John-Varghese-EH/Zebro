import React, { useState } from 'react';
import { useMission } from '../../store/useMission';
import { copilotTemplate, CopilotFacts } from '../../engine/copilotTemplate';

export const Copilot: React.FC = () => {
  const {
    copilotOpen,
    setCopilotOpen,
    events,
    selAlertId,
    options,
    selOptionKey,
    simMs,
    executed,
  } = useMission();

  const [isLoading, setIsLoading] = useState(false);
  const [modelBriefing, setModelBriefing] = useState<string | null>(null);

  const alert = events.find((e) => e.id === selAlertId) ?? events[0];
  const selectedOpt = options.find((o) => o.key === selOptionKey) ?? options[0];
  const isCleared = alert ? !!executed[alert.id] : false;

  if (!alert) return null;

  const tcaMs = new Date(alert.tca_utc).getTime();
  const diffHours = Math.max(0, (tcaMs - simMs) / (3600 * 1000));
  const h = Math.floor(diffHours);
  const m = Math.floor((diffHours - h) * 60);

  const lateOpt = options.find((o) => o.key === 'late');
  const baselineDv = lateOpt ? lateOpt.dvMs : (selectedOpt ? selectedOpt.dvMs * 4 : 5.0);

  const facts: CopilotFacts = {
    primary: alert.primary.name,
    secondary: alert.secondary.name,
    missKm: isCleared ? executed[alert.id].newMissKm : alert.miss_km,
    hours: h,
    minutes: m,
    relSpeed: alert.rel_speed_kms,
    pc: (isCleared ? executed[alert.id].newPc : alert.pc).toExponential(1),
    tag: alert.tag ?? 'Computed',
    direction: selectedOpt?.direction.replace('_', ' ') ?? 'prograde',
    lead: selectedOpt?.leadOrbits ?? 2,
    dv: selectedOpt?.dvMs ?? 0.15,
    totalDv: selectedOpt?.totalDvMs ?? 0.3,
    newMiss: selectedOpt?.missKm ?? 5.2,
    savingPercent:
      baselineDv > (selectedOpt?.dvMs ?? 0)
        ? Math.round(((baselineDv - (selectedOpt?.dvMs ?? 0)) / baselineDv) * 100)
        : 0,
    baselineDv,
    days: selectedOpt?.lifeCostDays ?? 12,
    burnOverIndia: selectedOpt?.burnOverIndia ?? false,
    elementAgeDays: alert.element_age_days.primary,
  };

  const defaultBriefing = copilotTemplate(facts);

  const handleRewrite = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setModelBriefing(data.text);
        }
      }
    } catch {
      // Fallback silently to template briefing per Section 13.6 & 14
    } finally {
      setIsLoading(false);
    }
  };

  if (!copilotOpen) {
    return (
      <button
        onClick={() => setCopilotOpen(true)}
        className="fixed bottom-20 left-4 z-30 px-3 py-1.5 bg-[#090D14]/90 backdrop-blur-xl border border-sky/40 text-sky hover:bg-[#0F172A] rounded-full shadow-2xl font-medium text-xs flex items-center gap-2 transition-all active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-sky inline-block animate-pulse" />
        <span>Analyst Briefing</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Flight Analyst Briefing"
      className="fixed bottom-20 left-4 z-40 w-80 sm:w-96 max-h-[80vh] overflow-y-auto p-1 rounded-2xl bg-white/[0.04] border border-white/15 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="rounded-xl bg-[#080D16]/95 border border-white/5 p-4 text-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky" />
            <h3 className="font-condensed font-bold tracking-wide uppercase text-chalk text-xs">
              Flight Dynamics Briefing
            </h3>
          </div>
          <button
            onClick={() => setCopilotOpen(false)}
            className="text-chalk-faint hover:text-chalk font-mono text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
            aria-label="Close briefing"
          >
            Close
          </button>
        </div>

        <p className="text-chalk leading-relaxed bg-black/50 p-3 border border-white/10 rounded-lg text-xs font-sans">
          {modelBriefing || defaultBriefing}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-chalk-faint font-mono">
            {modelBriefing ? 'Synthesized via Copilot' : 'Deterministic template'}
          </span>
          <button
            onClick={handleRewrite}
            disabled={isLoading}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-chalk rounded-full font-medium text-[11px] transition-colors"
          >
            {isLoading ? 'Consulting model...' : 'Rewrite with model'}
          </button>
        </div>
      </div>
    </div>
  );
};
