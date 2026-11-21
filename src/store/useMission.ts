import { create } from 'zustand';
import * as satellite from 'satellite.js';
import {
  PrimaryMission,
  ConjunctionEvent,
  Manifest,
  Option,
  ExecutedBurn,
} from '../engine/constants';
import { ScenarioResult } from '../engine/scenario';

export type WarpFactor = 0 | 1 | 10 | 100 | 500;
export type ThemeMode = 'dark' | 'light' | 'system' | 'oled' | 'navy';
export type AccentColor = 'cobalt' | 'emerald' | 'amber' | 'slate';
export type ViewMode = 'globe' | 'map' | 'split';
export type GlobePerspective = 'overview' | 'satellite' | 'india';

export interface MissionState {
  // Time state (one simulated clock only per Section 8.1)
  simMs: number;
  getPreciseSimMs: () => number;
  warp: WarpFactor;
  setWarp: (warp: WarpFactor) => void;
  tick: (realDtMs: number) => void;
  setSimMs: (ms: number) => void;

  // Theme state
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;

  // Data
  fleet: PrimaryMission[];
  fleetSatrecs: Record<number, satellite.SatRec>;
  background: any[];
  events: ConjunctionEvent[];
  manifest: Manifest | null;
  scenario: ScenarioResult | null;
  isLoading: boolean;
  loadData: (data: {
    fleet: PrimaryMission[];
    fleetSatrecs: Record<number, satellite.SatRec>;
    background: any[];
    events: ConjunctionEvent[];
    manifest: Manifest | null;
  }) => void;

  // Selection
  selSatId: string | null;
  selAlertId: string | null;
  setSelSatId: (id: string | null) => void;
  setSelAlertId: (id: string | null) => void;

  // Planning & Execution
  options: Option[];
  selOptionKey: Option['key'] | null;
  setOptions: (options: Option[], defaultKey?: Option['key']) => void;
  setSelOptionKey: (key: Option['key']) => void;
  executed: Record<string, ExecutedBurn>;
  log: ExecutedBurn[];
  executeBurn: (burn: ExecutedBurn) => void;

  // Overrides (ASSUMED sliders, 0 to 100 percent)
  propellantPct: Record<string, number>;
  setPropellantPct: (satId: string, pct: number) => void;

  // Modes & UI controls
  kessler: 'idle' | 'running';
  setKessler: (state: 'idle' | 'running') => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  globePerspective: GlobePerspective;
  setGlobePerspective: (perspective: GlobePerspective) => void;
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;

  // Scenario Mode trigger
  setScenario: (scen: ScenarioResult | null) => void;
}

const applyThemeToDom = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  let resolved = mode;
  if (mode === 'system') {
    resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else if (mode === 'oled' || mode === 'navy') {
    resolved = 'dark';
  }
  document.documentElement.setAttribute('data-theme', resolved);
};

const applyAccentToDom = (accent: AccentColor) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-accent', accent);
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('zebro_theme') as ThemeMode;
    if (saved === 'dark' || saved === 'light' || saved === 'system' || saved === 'oled' || saved === 'navy') {
      return saved;
    }
  }
  return 'dark';
};

const getInitialAccent = (): AccentColor => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('zebro_accent') as AccentColor;
    if (saved === 'cobalt' || saved === 'emerald' || saved === 'amber' || saved === 'slate') {
      return saved;
    }
  }
  return 'cobalt';
};

const initialTheme = getInitialTheme();
const initialAccent = getInitialAccent();
applyThemeToDom(initialTheme);
applyAccentToDom(initialAccent);

let preciseSimMs = Date.now();
let lastBroadcastMs = preciseSimMs;

export const useMission = create<MissionState>((set, get) => ({
  simMs: preciseSimMs,
  getPreciseSimMs: () => preciseSimMs,
  warp: 1,
  setWarp: (warp) => {
    lastBroadcastMs = preciseSimMs;
    set({ warp, simMs: Math.round(preciseSimMs) });
  },
  tick: (realDtMs) => {
    const currentWarp = get().warp;
    if (currentWarp === 0) return;
    preciseSimMs += realDtMs * currentWarp;
    // Throttle React state broadcast to 250ms (or 100ms at high warp) to prevent 120Hz React DOM thrashing
    const throttleThreshold = currentWarp >= 100 ? 100 : 250;
    if (Math.abs(preciseSimMs - lastBroadcastMs) >= throttleThreshold) {
      lastBroadcastMs = preciseSimMs;
      set({ simMs: Math.round(preciseSimMs) });
    }
  },
  setSimMs: (ms) => {
    preciseSimMs = ms;
    lastBroadcastMs = ms;
    set({ simMs: ms });
  },

  theme: initialTheme,
  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zebro_theme', theme);
    }
    applyThemeToDom(theme);
    set({ theme });
  },

  accent: initialAccent,
  setAccent: (accent) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zebro_accent', accent);
    }
    applyAccentToDom(accent);
    set({ accent });
  },

  fleet: [],
  fleetSatrecs: {},
  background: [],
  events: [],
  manifest: null,
  scenario: null,
  isLoading: true,
  loadData: ({ fleet, fleetSatrecs, background, events, manifest }) =>
    set({
      fleet,
      fleetSatrecs,
      background,
      events,
      manifest,
      isLoading: false,
      selSatId: fleet[0]?.id ?? null,
      selAlertId: events[0]?.id ?? null,
    }),

  selSatId: null,
  selAlertId: null,
  setSelSatId: (id) =>
    set(() => {
      if (id && typeof window !== 'undefined') {
        window.location.hash = `#sat=${id}`;
      }
      return { selSatId: id };
    }),
  setSelAlertId: (id) =>
    set(() => {
      if (id && typeof window !== 'undefined') {
        window.location.hash = `#alert=${id}`;
      }
      return { selAlertId: id };
    }),

  options: [],
  selOptionKey: null,
  setOptions: (options, defaultKey) =>
    set({
      options,
      selOptionKey: defaultKey ?? options[0]?.key ?? null,
    }),
  setSelOptionKey: (key) => set({ selOptionKey: key }),

  executed: {},
  log: [],
  executeBurn: (burn) =>
    set((s) => ({
      executed: { ...s.executed, [burn.alertId]: burn },
      log: [burn, ...s.log],
    })),

  propellantPct: {},
  setPropellantPct: (satId, pct) =>
    set((s) => ({
      propellantPct: { ...s.propellantPct, [satId]: pct },
    })),

  kessler: 'idle',
  setKessler: (state) => set({ kessler: state }),
  view: 'globe',
  setView: (view) => set({ view }),
  globePerspective: 'overview',
  setGlobePerspective: (perspective) => set({ globePerspective: perspective }),
  copilotOpen: false,
  setCopilotOpen: (open) => set({ copilotOpen: open }),
  shortcutsOpen: false,
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),

  setScenario: (scen) =>
    set((s) => {
      if (!scen) return { scenario: null };
      const updatedEvents = [
        scen.event,
        ...s.events.filter((e) => e.id !== scen.event.id),
      ];
      return {
        scenario: scen,
        events: updatedEvents,
        selAlertId: scen.event.id,
      };
    }),
}));
