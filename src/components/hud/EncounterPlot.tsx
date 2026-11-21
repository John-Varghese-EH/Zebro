import React from 'react';
import { useMission } from '../../store/useMission';
import { Why } from './Why';

interface EncounterPlotProps {
  burnAnimationProgress?: number; // 0 to 1 during burn sequence
}

export const EncounterPlot: React.FC<EncounterPlotProps> = ({
  burnAnimationProgress = 1.0,
}) => {
  const { events, selAlertId, options, selOptionKey, executed } = useMission();

  const alert = events.find((e) => e.id === selAlertId) ?? events[0];
  const selectedOpt = options.find((o) => o.key === selOptionKey) ?? options[0];
  const isCleared = alert ? !!executed[alert.id] : false;

  if (!alert) return null;

  // View bounds: +/- 8 km
  const extentKm = 8.0;
  const sizePx = 280;
  const center = sizePx / 2;
  const scale = (sizePx / 2 - 20) / extentKm; // px per km

  // Nominal secondary position in encounter plane:
  // Offset miss distance along X or angled vector
  const missNominalKm = alert.miss_km;
  // Place nominal position at (-missNominalKm, 0)
  const nomX = -missNominalKm;
  const nomY = 0;

  // Post-burn position:
  const missPostKm = selectedOpt ? selectedOpt.missKm : missNominalKm;
  // Post-burn displaced position: along-track displacement moves it further along X/Y
  const postX = selectedOpt?.direction.startsWith('prograde')
    ? -missPostKm
    : selectedOpt?.direction.startsWith('retrograde')
    ? missPostKm
    : 0;
  const postY = selectedOpt?.direction.startsWith('radial') ? missPostKm : 0.8;

  // Animate position during burn sequence:
  const t = isCleared ? 1.0 : burnAnimationProgress;
  const curX = nomX + (postX - nomX) * t;
  const curY = nomY + (postY - nomY) * t;
  const currentMissKm = isCleared ? missPostKm : missNominalKm + (missPostKm - missNominalKm) * t;

  const toPxX = (km: number) => center + km * scale;
  const toPxY = (km: number) => center - km * scale;

  const targetRadiusPx = 5.0 * scale; // 5 km target circle
  const sigmaRadiusPx = (alert.sigma_m / 1000) * scale; // 1-sigma circle

  return (
    <div className="p-3 border-b border-white/10 space-y-2.5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-saffron ring-2 ring-saffron/20" />
          <h3 className="font-condensed font-semibold text-xs tracking-wider uppercase text-chalk">
            Encounter B-Plane (TCA Relative)
          </h3>
        </div>
        <Why
          tag="COMPUTED"
          meaning="2D projection plane perpendicular to relative velocity at TCA (Gram-Schmidt frame)"
          formula="ξ-axis ⊥ v_rel, ζ-axis = unit(v_rel × r_primary)"
        >
          <span className="font-mono text-xs text-sky font-semibold tabular-nums px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            {currentMissKm.toFixed(2)} km miss
          </span>
        </Why>
      </div>

      <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5">
        <div className="relative flex justify-center bg-[#060A12] p-2.5 rounded-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
          <svg width={sizePx} height={sizePx} className="select-none font-mono text-[9px]">
          {/* Grid lines and axes */}
          <line
            x1={center}
            y1={10}
            x2={center}
            y2={sizePx - 10}
            stroke="#26435F"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <line
            x1={10}
            y1={center}
            x2={sizePx - 10}
            y2={center}
            stroke="#26435F"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* 1-Sigma circle (faint) */}
          <circle
            cx={center}
            cy={center}
            r={sigmaRadiusPx}
            fill="none"
            stroke="#62788F"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.6"
          />
          <text
            x={center + sigmaRadiusPx + 3}
            y={center - 3}
            fill="#62788F"
            fontSize="8"
          >
            1σ ({((alert.sigma_m) / 1000).toFixed(1)} km)
          </text>

          {/* 5 km target avoidance threshold circle */}
          <circle
            cx={center}
            cy={center}
            r={targetRadiusPx}
            fill="#3FBF8F"
            fillOpacity="0.04"
            stroke="#3FBF8F"
            strokeWidth="1.2"
            strokeDasharray="4,3"
          />
          <text
            x={center + 3}
            y={center - targetRadiusPx + 10}
            fill="#3FBF8F"
            fontSize="8"
          >
            5.0 km Target
          </text>

          {/* Axis Labels */}
          <text x={sizePx - 25} y={center - 4} fill="#62788F">
            +X
          </text>
          <text x={center + 4} y={20} fill="#62788F">
            +Y
          </text>

          {/* Primary satellite at center (0,0) */}
          <circle cx={center} cy={center} r="4" fill="#8FC4E8" />
          <circle
            cx={center}
            cy={center}
            r="8"
            fill="none"
            stroke="#8FC4E8"
            strokeWidth="1"
            opacity="0.4"
          />
          <text x={center + 6} y={center + 12} fill="#8FC4E8" fontWeight="600">
            {alert.primary.name}
          </text>

          {/* Nominal encounter line & point (before burn) */}
          <line
            x1={center}
            y1={center}
            x2={toPxX(nomX)}
            y2={toPxY(nomY)}
            stroke="#E23D5C"
            strokeWidth="1.2"
            opacity="0.5"
          />
          <circle
            cx={toPxX(nomX)}
            cy={toPxY(nomY)}
            r="3.5"
            fill="#E23D5C"
            opacity={t > 0 ? 0.3 : 1}
          />

          {/* Displaced / current secondary position */}
          <line
            x1={center}
            y1={center}
            x2={toPxX(curX)}
            y2={toPxY(curY)}
            stroke={t > 0.5 ? '#3FBF8F' : '#E23D5C'}
            strokeWidth="1.5"
          />
          <circle
            cx={toPxX(curX)}
            cy={toPxY(curY)}
            r="4.5"
            fill={t > 0.5 ? '#3FBF8F' : '#E23D5C'}
            className="transition-all duration-300"
          />
          <text
            x={toPxX(curX) + 6}
            y={toPxY(curY) - 4}
            fill={t > 0.5 ? '#3FBF8F' : '#E23D5C'}
            fontWeight="600"
          >
            {alert.secondary.name} ({currentMissKm.toFixed(2)} km)
          </text>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 right-2 text-[10px] text-chalk-faint flex flex-col gap-0.5 pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky inline-block" /> Primary
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-alert inline-block" /> Initial miss
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-ok inline-block" /> Post-burn
          </span>
        </div>
        </div>
      </div>
    </div>
  );
};
