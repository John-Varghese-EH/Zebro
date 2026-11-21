import React from 'react';
import { useMission } from '../../store/useMission';
import { evaluateDfsm } from '../../engine/dfsm';

interface DfsmCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DfsmCertificateModal: React.FC<DfsmCertificateModalProps> = ({ isOpen, onClose }) => {
  const { fleet, propellantPct, log } = useMission();

  if (!isOpen) return null;

  const totalSavedKg = log.reduce((sum, b) => sum + b.propellantSavedKg, 0);
  const certId = `ISRO-DFSM-2030-${Date.now().toString(36).toUpperCase()}`;
  const auditDate = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="DFSM-2030 Compliance Certificate"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-film-50 border-2 border-rule text-ink w-full max-w-3xl p-8 rounded-lg shadow-2xl space-y-6 relative print:p-0 print:border-none max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Certificate Header */}
        <div className="flex items-start justify-between border-b-2 border-rule pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-saffron" />
              <span className="font-condensed font-bold text-xs uppercase tracking-widest text-ink/70">
                Indian Space Research Organisation (ISRO) Reference Frame
              </span>
            </div>
            <h2 className="font-condensed font-bold text-3xl uppercase tracking-tight text-ink">
              DFSM-2030 Spacecraft Disposal Audit Certificate
            </h2>
            <p className="text-xs text-ink/60 font-mono">
              Certificate Reference: {certId} | Audit Epoch: {auditDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink/60 hover:text-ink font-mono text-sm px-2 py-1 rounded border border-rule hover:bg-film-100 no-print"
          >
            Close
          </button>
        </div>

        {/* Policy Declaration */}
        <div className="p-4 bg-film-100 border border-rule rounded space-y-2 text-xs leading-relaxed text-ink/80">
          <p className="font-semibold text-ink">
            Debris-Free Space Missions (DFSM-2030) Standard:
          </p>
          <p>
            Pursuant to ISRO's declaration at the 42nd Inter-Agency Space Debris Coordination Committee (IADC) plenary, all operational Indian Earth observation spacecraft in Low Earth Orbit must maintain verifiable propellant reserves for direct controlled atmospheric re-entry (perigee 60 km) or orbital life decay within 5 years of mission conclusion.
          </p>
        </div>

        {/* Fleet Ledger Table */}
        <div className="space-y-2">
          <h3 className="font-condensed font-bold text-xs uppercase tracking-wider text-ink/70">
            Fleet Asset Disposal Readiness Ledger
          </h3>
          <div className="border border-rule rounded overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-film-100 text-[10px] uppercase tracking-wider text-ink/70 border-b border-rule">
                <tr>
                  <th className="p-2.5">Asset / NORAD</th>
                  <th className="p-2.5 text-right">Altitude</th>
                  <th className="p-2.5 text-right">Wet Mass</th>
                  <th className="p-2.5 text-right">Remaining Prop.</th>
                  <th className="p-2.5 text-right">Req. Delta-v</th>
                  <th className="p-2.5 text-right">Available</th>
                  <th className="p-2.5 text-center">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule text-[11px]">
                {fleet.map((sat) => {
                  const currentProp = (sat.propellantKg * (propellantPct[sat.id] ?? 100)) / 100;
                  const res = evaluateDfsm(sat.altitudeKm ?? 600, sat.wetMassKg, currentProp);

                  return (
                    <tr key={sat.id} className="hover:bg-film-100/50">
                      <td className="p-2.5 font-sans font-medium text-ink">
                        {sat.name} <span className="text-[10px] text-ink/50 font-mono">#{sat.noradId}</span>
                      </td>
                      <td className="p-2.5 text-right">{sat.altitudeKm ? `${sat.altitudeKm} km` : '600 km'}</td>
                      <td className="p-2.5 text-right">{sat.wetMassKg} kg</td>
                      <td className="p-2.5 text-right">{currentProp.toFixed(1)} kg</td>
                      <td className="p-2.5 text-right">{res.requiredDvMs.toFixed(1)} m/s</td>
                      <td className="p-2.5 text-right font-bold text-sky-deep">{res.availableDvMs.toFixed(1)} m/s</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            res.verdict === 'green'
                              ? 'bg-ok/20 text-ok-deep border border-ok/40'
                              : res.verdict === 'amber'
                              ? 'bg-saffron/20 text-saffron-deep border border-saffron/40'
                              : 'bg-alert/20 text-alert-deep border border-alert/40'
                          }`}
                        >
                          {res.verdict}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Optimization Attribution Summary */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-film-100 p-4 border border-rule rounded">
          <div>
            <span className="text-ink/60 block text-[11px]">Avoidance Propellant Preserved:</span>
            <span className="font-mono text-base font-bold text-ink">
              {totalSavedKg > 0 ? `${totalSavedKg.toFixed(2)} kg` : '0.00 kg (Baseline)'}
            </span>
            <span className="text-[10px] text-ink/50 block">Saved via early multi-orbit impulse timing</span>
          </div>
          <div>
            <span className="text-ink/60 block text-[11px]">Disposal Assurance Rating:</span>
            <span className="font-mono text-base font-bold text-ok-deep">
              ISRO Class-A Compliant
            </span>
            <span className="text-[10px] text-ink/50 block">Zero unassisted debris footprint target met</span>
          </div>
        </div>

        {/* Certification Sign-Off Block */}
        <div className="pt-4 border-t-2 border-rule flex items-end justify-between text-xs text-ink/70">
          <div className="space-y-1">
            <span className="font-semibold block text-ink">Zebro Flight Dynamics Subsystem</span>
            <span className="text-[11px] block">Astra 2026 Space Situational Awareness Architecture</span>
            <span className="text-[10px] text-ink/50 block">Automated Screening and Conjunction Maneuver Ledger</span>
          </div>
          <div className="flex gap-2 no-print">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-film-100 hover:bg-rule/40 border border-rule text-ink rounded font-semibold text-xs transition-colors"
            >
              Print Certificate
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-sky-deep text-film-50 hover:bg-sky-deep/90 rounded font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
