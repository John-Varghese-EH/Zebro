import React from 'react';

interface MissionGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissionGuide: React.FC<MissionGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zebro Mission Operations Guide"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div className="p-1 rounded-3xl bg-white/[0.04] border border-white/15 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="rounded-[22px] bg-[#090D16]/95 border border-white/5 flex flex-col overflow-hidden text-xs text-chalk max-h-full">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-saffron" />
              <h2 className="font-condensed font-bold text-lg uppercase tracking-wider text-chalk">
                Zebro | Flight Operations Handbook
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-mono text-xs text-chalk transition-colors"
            >
              Close (Esc)
            </button>
          </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 leading-relaxed">
          {/* Section 1: Fleet Protection Objective */}
          <div className="space-y-2">
            <h3 className="font-condensed font-bold text-sm uppercase tracking-wide text-sky">
              1. Fleet Protection Architecture
            </h3>
            <p className="text-chalk-dim">
              Zebro continuously screens five primary Indian Earth observation missions (NISAR, EOS-04, EOS-06, RESOURCESAT-2A, CARTOSAT-3) against over 2,900 catalogued orbital debris objects and active spacecraft across a 72-hour forward horizon.
            </p>
          </div>

          {/* Section 2: Why Early Burns Save Propellant */}
          <div className="space-y-2 p-4 bg-navy-950 border border-white/5 rounded-2xl">
            <h3 className="font-condensed font-bold text-sm uppercase tracking-wide text-saffron">
              2. Clohessy-Wiltshire Dynamics: Burn Early, Burn Small
            </h3>
            <p className="text-chalk-dim">
              The physics of orbital mechanics dictates that along-track displacement scales with lead time:
            </p>
            <div className="font-mono bg-navy-900 p-2.5 rounded-lg border border-line/60 text-[11px] text-chalk">
              delta_y(tau) = -6 * n * delta_v_T * tau
            </div>
            <p className="text-chalk-dim">
              A 5.0 km miss distance requires only ~0.15 m/s of impulse when executed 1.5 orbits before encounter, but escalates to ~7.7 m/s if delayed to 0.25 orbits. Early execution preserves critical onboard hydrazine reserves.
            </p>
          </div>

          {/* Section 3: Truth Ledger and Provenance */}
          <div className="space-y-2">
            <h3 className="font-condensed font-bold text-sm uppercase tracking-wide text-emerald-400">
              3. The Truth Ledger (Zero Fabricated Telemetry)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-navy-950 rounded-xl border border-white/5">
                <span className="font-bold text-chalk block mb-0.5">DATA</span>
                <span className="text-chalk-dim">Directly fetched from CelesTrak OMM ephemerides and official ISRO payload specifications.</span>
              </div>
              <div className="p-2.5 bg-navy-950 rounded-xl border border-white/5">
                <span className="font-bold text-sky block mb-0.5">COMPUTED</span>
                <span className="text-chalk-dim">Derived from SGP4 propagation, 2D B-plane encounter calculus, and Tsiolkovsky rocket dynamics.</span>
              </div>
              <div className="p-2.5 bg-navy-950 rounded-xl border border-white/5">
                <span className="font-bold text-saffron block mb-0.5">ASSUMED</span>
                <span className="text-chalk-dim">Documented operational constants (e.g. hydrazine Isp = 220s, composite hard-body radius R = 3.0m).</span>
              </div>
              <div className="p-2.5 bg-navy-950 rounded-xl border border-white/5">
                <span className="font-bold text-alert block mb-0.5">SCENARIO</span>
                <span className="text-chalk-dim">Calibrated synthetic close approach (150m miss, sigma = 200m) for drill and verification.</span>
              </div>
            </div>
          </div>

          {/* Section 4: Indian Portals & Sovereign Imaging */}
          <div className="space-y-2">
            <h3 className="font-condensed font-bold text-sm uppercase tracking-wide text-sky">
              4. Sovereign Imaging Continuity & Bhuvan Corridors
            </h3>
            <p className="text-chalk-dim">
              Spacecraft thruster firings require attitude slews that temporarily interrupt SAR interferometry and optical line-scanners. Zebro projects the burn coordinates onto Indian territorial boundaries to guarantee burns occur outside sovereign observation corridors whenever possible.
            </p>
          </div>

          {/* Section 5: DFSM-2030 Mandate */}
          <div className="space-y-2 p-4 bg-navy-950 border border-white/5 rounded-2xl">
            <h3 className="font-condensed font-bold text-sm uppercase tracking-wide text-chalk">
              5. ISRO DFSM-2030 De-Orbit Compliance
            </h3>
            <p className="text-chalk-dim">
              India's Debris-Free Space Missions 2030 policy mandates that every Low Earth Orbit satellite must reserve sufficient fuel to execute direct controlled atmospheric re-entry (targeting 60 km perigee) at mission conclusion. The live fuel slider dynamically recomputes this compliance threshold in real time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-navy-950/80 flex items-center justify-between text-[11px] text-chalk-faint">
          <span>Zebro Flight Dynamics Division · Astra 2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-sky text-navy-950 font-semibold rounded-full hover:bg-sky/90 transition-colors"
          >
            Understood
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
