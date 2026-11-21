import React, { useMemo, useState } from 'react';
import * as satellite from 'satellite.js';
import { useMission } from '../../store/useMission';
import { INDIA_COORDINATES } from '../../geo/india';
import { BHUVAN_PRIORITY_ZONES } from '../../geo/bhuvanZones';
import { WORLD_LAND_PATH } from '../../geo/worldLandPath';
import { WORLD_BORDERS_PATH } from '../../geo/worldBordersPath';
import { Option } from '../../engine/constants';

interface GroundTrackProps {
  className?: string;
}

// Major Indian ground tracking and payload operations facilities
const ISRO_GROUND_STATIONS = [
  { id: 'shadnagar', name: 'NRSC Shadnagar Earth Station', lat: 17.03, lon: 78.18, type: 'Payload Data Reception' },
  { id: 'istrac', name: 'ISTRAC Bangalore Ground Station', lat: 13.03, lon: 77.51, type: 'TTC & Mission Control' },
  { id: 'shar', name: 'SDSC Sriharikota Launch Complex', lat: 13.72, lon: 80.23, type: 'Spaceport Tracking' },
  { id: 'sac', name: 'SAC Ahmedabad Sensor Labs', lat: 23.03, lon: 72.51, type: 'Payload Architecture' },
];

export const GroundTrack: React.FC<GroundTrackProps> = ({ className = '' }) => {
  const { fleet, fleetSatrecs, selSatId, simMs, options, selOptionKey } = useMission();
  const [showBhuvan, setShowBhuvan] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [zoomIndia, setZoomIndia] = useState(false);

  const sat = fleet.find((f) => f.id === selSatId) ?? fleet[0];
  const satrec = sat ? fleetSatrecs[sat.noradId] : null;
  const selectedOpt: Option | undefined =
    options.find((o) => o.key === selOptionKey) ?? options[0];

  // Base canvas coordinate dimensions (800x400 WGS84 Equirectangular)
  const baseWidth = 800;
  const baseHeight = 400;

  // Equirectangular projection formulas:
  const lonToX = (lon: number) => ((lon + 180) / 360) * baseWidth;
  const latToY = (lat: number) => ((90 - lat) / 180) * baseHeight;

  // Quantize track window to 15-second intervals so 50 SGP4 propagations are not recalculated needlessly
  const trackTimeBucket = Math.floor(simMs / 15000);

  // Propagate next 25 minutes in 0.5-minute steps for satellite ground track
  const trackPoints = useMemo(() => {
    if (!satrec) return [];
    const pts: { lon: number; lat: number; x: number; y: number }[] = [];
    const stepMin = 0.5;
    const totalMin = 25;
    const baseTimeMs = trackTimeBucket * 15000;

    for (let m = 0; m <= totalMin; m += stepMin) {
      const t = new Date(baseTimeMs + m * 60 * 1000);
      const pv = satellite.propagate(satrec, t);
      if (pv && typeof pv.position !== 'boolean' && pv.position) {
        const gmst = satellite.gstime(t);
        const geo = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.degreesLat(geo.latitude);
        const lon = satellite.degreesLong(geo.longitude);
        pts.push({
          lat,
          lon,
          x: lonToX(lon),
          y: latToY(lat),
        });
      }
    }
    return pts;
  }, [satrec, trackTimeBucket]);

  // Current satellite position on ground track map: single SGP4 point evaluated at current simMs
  const currentPos = useMemo(() => {
    if (!satrec) return null;
    const t = new Date(simMs);
    const pv = satellite.propagate(satrec, t);
    if (!pv || typeof pv.position === 'boolean' || !pv.position) return null;
    const gmst = satellite.gstime(t);
    const geo = satellite.eciToGeodetic(pv.position, gmst);
    const lat = satellite.degreesLat(geo.latitude);
    const lon = satellite.degreesLong(geo.longitude);
    return {
      lat,
      lon,
      x: lonToX(lon),
      y: latToY(lat),
    };
  }, [satrec, simMs]);

  // India sovereign boundary path
  const indiaPath = useMemo(() => {
    return (
      INDIA_COORDINATES.map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'} ${lonToX(lon).toFixed(1)} ${latToY(lat).toFixed(1)}`).join(' ') + ' Z'
    );
  }, []);

  // Split ground track across the anti-meridian (-180 / +180 jump)
  const trackPaths = useMemo(() => {
    const paths: string[] = [];
    if (trackPoints.length < 2) return paths;

    let cur = `M ${trackPoints[0].x.toFixed(1)} ${trackPoints[0].y.toFixed(1)}`;
    for (let i = 1; i < trackPoints.length; i++) {
      const prev = trackPoints[i - 1];
      const pt = trackPoints[i];
      if (Math.abs(pt.lon - prev.lon) > 180) {
        paths.push(cur);
        cur = `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      } else {
        cur += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      }
    }
    paths.push(cur);
    return paths;
  }, [trackPoints]);

  // Bhuvan priority hazard zones paths
  const bhuvanPaths = useMemo(() => {
    return BHUVAN_PRIORITY_ZONES.map((zone) => {
      const d =
        zone.coordinates
          .map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'} ${lonToX(lon).toFixed(1)} ${latToY(lat).toFixed(1)}`)
          .join(' ') + ' Z';
      const centerLon = zone.coordinates.reduce((sum, c) => sum + c[0], 0) / zone.coordinates.length;
      const centerLat = zone.coordinates.reduce((sum, c) => sum + c[1], 0) / zone.coordinates.length;
      return {
        ...zone,
        d,
        cx: lonToX(centerLon),
        cy: latToY(centerLat),
      };
    });
  }, []);

  // Dynamic ViewBox for India Zoom vs Global View
  // India center lon=78.5, lat=22.5 -> base x=574.4, y=150.0
  const activeViewBox = zoomIndia
    ? '520 100 130 90'
    : `0 0 ${baseWidth} ${baseHeight}`;

  return (
    <div className={`relative bg-navy-950 border border-line p-3 rounded-control text-xs space-y-2.5 ${className}`}>
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-condensed font-bold uppercase tracking-wider text-chalk">
            Real Earth Ground Swath Map (25 min)
          </span>
          <span className="text-[10px] text-chalk-faint font-mono">
            {sat?.name} ({sat?.swathKm ?? 240} km swath)
          </span>
        </div>

        {/* Apple-style Segmented View Controls */}
        <div className="flex items-center gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => setZoomIndia(!zoomIndia)}
            className={`px-2.5 py-1 rounded-full border transition-all ${
              zoomIndia
                ? 'bg-saffron/20 border-saffron/50 text-saffron font-semibold'
                : 'bg-navy-900 border-line/60 text-chalk-dim hover:text-chalk'
            }`}
          >
            {zoomIndia ? 'Reset to Global' : 'Zoom: India Basin'}
          </button>
          <button
            type="button"
            onClick={() => setShowBhuvan(!showBhuvan)}
            className={`px-2.5 py-1 rounded-full border transition-all ${
              showBhuvan
                ? 'bg-sky/20 border-sky/50 text-sky font-semibold'
                : 'bg-navy-900 border-line/60 text-chalk-dim hover:text-chalk'
            }`}
          >
            Bhuvan Hazards
          </button>
          <button
            type="button"
            onClick={() => setShowStations(!showStations)}
            className={`px-2.5 py-1 rounded-full border transition-all ${
              showStations
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-semibold'
                : 'bg-navy-900 border-line/60 text-chalk-dim hover:text-chalk'
            }`}
          >
            ISRO Ground Hubs
          </button>
        </div>
      </div>

      {/* SVG Map Canvas with Real World Continents and Borders */}
      <div className="relative overflow-hidden bg-[#071322] border border-line/80 rounded-control flex justify-center shadow-inner">
        <svg
          viewBox={activeViewBox}
          className="w-full h-auto select-none transition-all duration-700 ease-out"
        >
          {/* Subtle Latitude & Longitude Graticule */}
          {[-60, -30, 0, 30, 60].map((lat) => (
            <line
              key={`lat-${lat}`}
              x1="0"
              y1={latToY(lat)}
              x2={baseWidth}
              y2={latToY(lat)}
              stroke="#132B45"
              strokeWidth="0.5"
            />
          ))}
          {[-120, -60, 0, 60, 120].map((lon) => (
            <line
              key={`lon-${lon}`}
              x1={lonToX(lon)}
              y1="0"
              x2={lonToX(lon)}
              y2={baseHeight}
              stroke="#132B45"
              strokeWidth="0.5"
            />
          ))}

          {/* Equator Guide */}
          <line
            x1="0"
            y1={latToY(0)}
            x2={baseWidth}
            y2={latToY(0)}
            stroke="#214A6F"
            strokeWidth="0.8"
            strokeDasharray="4,3"
          />

          {/* Real World Continents / Landmasses (Natural Earth Topology) */}
          <path
            d={WORLD_LAND_PATH}
            fill="#0F243B"
            stroke="#173859"
            strokeWidth="0.5"
          />

          {/* Real International Country Borders */}
          <path
            d={WORLD_BORDERS_PATH}
            fill="none"
            stroke="#1C4266"
            strokeWidth="0.4"
            strokeOpacity="0.75"
          />

          {/* India Sovereign Boundary */}
          <path
            d={indiaPath}
            fill="#F59E0B"
            fillOpacity="0.14"
            stroke="#F59E0B"
            strokeWidth="1.2"
          />
          <text
            x={lonToX(78.5)}
            y={latToY(22.5)}
            fill="#F59E0B"
            fontSize={zoomIndia ? '3' : '9'}
            fontWeight="bold"
            textAnchor="middle"
            opacity="0.9"
          >
            INDIA
          </text>

          {/* Bhuvan Priority Hazard Corridors */}
          {showBhuvan &&
            bhuvanPaths.map((z) => (
              <g key={z.id}>
                <path
                  d={z.d}
                  fill={z.priority === 'CRITICAL' ? '#EC4899' : '#38BDF8'}
                  fillOpacity="0.25"
                  stroke={z.priority === 'CRITICAL' ? '#EC4899' : '#38BDF8'}
                  strokeWidth={zoomIndia ? '0.3' : '0.8'}
                  strokeDasharray="2,2"
                />
                <text
                  x={z.cx}
                  y={z.cy}
                  fill={z.priority === 'CRITICAL' ? '#EC4899' : '#38BDF8'}
                  fontSize={zoomIndia ? '2.2' : '7'}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity="0.95"
                >
                  {z.name.split(' ')[0]}
                </text>
              </g>
            ))}

          {/* ISRO Ground Stations */}
          {showStations &&
            ISRO_GROUND_STATIONS.map((gs) => {
              const gx = lonToX(gs.lon);
              const gy = latToY(gs.lat);
              const r = zoomIndia ? 0.8 : 2.5;
              return (
                <g key={gs.id}>
                  <circle cx={gx} cy={gy} r={r * 2.2} fill="none" stroke="#34D399" strokeWidth="0.4" opacity="0.4" />
                  <circle cx={gx} cy={gy} r={r} fill="#34D399" />
                  {zoomIndia && (
                    <text
                      x={gx + 1.2}
                      y={gy + 0.6}
                      fill="#34D399"
                      fontSize="2"
                      fontWeight="600"
                    >
                      {gs.id.toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Swath Width Band & Satellite Ground Track */}
          {trackPaths.map((d, idx) => (
            <g key={idx}>
              {/* Swath width coverage strip */}
              <path
                d={d}
                fill="none"
                stroke="#8FC4E8"
                strokeWidth={Math.max(zoomIndia ? 1.5 : 4, (sat?.swathKm ?? 240) / (zoomIndia ? 60 : 30))}
                strokeOpacity="0.18"
                strokeLinecap="round"
              />
              {/* Center flight track */}
              <path
                d={d}
                fill="none"
                stroke="#8FC4E8"
                strokeWidth={zoomIndia ? '0.6' : '1.5'}
                strokeDasharray="4,2"
              />
            </g>
          ))}

          {/* Current Satellite Marker */}
          {currentPos && (
            <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
              <circle r={zoomIndia ? 1.2 : 4} fill="#8FC4E8" />
              <circle r={zoomIndia ? 2.5 : 8} fill="none" stroke="#8FC4E8" strokeWidth={zoomIndia ? 0.3 : 1} opacity="0.6" />
              <text
                x={zoomIndia ? 2 : 7}
                y={zoomIndia ? 1 : 3}
                fill="#8FC4E8"
                fontSize={zoomIndia ? '2.5' : '9'}
                fontWeight="bold"
              >
                {sat?.name}
              </text>
            </g>
          )}

          {/* Planned Avoidance Burn Point Marker */}
          {selectedOpt && (
            <g transform={`translate(${lonToX(selectedOpt.burnLon)}, ${latToY(selectedOpt.burnLat)})`}>
              <circle r={zoomIndia ? 1.4 : 5} fill="#E23D5C" />
              <circle
                r={zoomIndia ? 3 : 10}
                fill="none"
                stroke="#E23D5C"
                strokeWidth={zoomIndia ? 0.4 : 1.2}
                strokeDasharray="2,2"
              />
              <text
                x={zoomIndia ? 2 : 8}
                y={zoomIndia ? -1 : -3}
                fill="#E23D5C"
                fontSize={zoomIndia ? '2.5' : '9'}
                fontWeight="bold"
              >
                Burn ({selectedOpt.burnLat.toFixed(1)}°N, {selectedOpt.burnLon.toFixed(1)}°E)
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Floating Operational Status Card */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-chalk-faint pt-0.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-chalk-dim font-medium">Cartographic Source: Natural Earth WGS84</span>
          </span>
          <span>|</span>
          <span>Bhuvan OGC Hazard Basins</span>
        </div>

        <div>
          {selectedOpt?.burnOverIndia ? (
            <span className="text-saffron font-semibold bg-saffron/15 px-2 py-0.5 rounded border border-saffron/30">
              Pass traverses Indian airspace: SAR imaging requires coordination
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
              Pass is outside Indian landmass: Zero sovereign imaging disruption
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
