/**
 * ISRO Bhuvan priority monitoring zones for disaster mitigation and hydrological risk.
 * Reference: National Remote Sensing Centre (NRSC) / Bhuvan Geoportal.
 */

export interface BhuvanZone {
  id: string;
  name: string;
  theme: string;
  priority: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  sensors: string[];
  coordinates: [number, number][]; // [lon, lat]
}

export const BHUVAN_PRIORITY_ZONES: BhuvanZone[] = [
  {
    id: 'assam-brahmaputra',
    name: 'Brahmaputra Basin (Assam)',
    theme: 'Flood Inundation & Siltation',
    priority: 'HIGH',
    sensors: ['NISAR L+S SAR', 'EOS-04 C-SAR'],
    coordinates: [
      [89.8, 26.1],
      [90.5, 26.5],
      [92.1, 26.8],
      [93.8, 27.2],
      [95.4, 27.8],
      [95.9, 27.5],
      [94.7, 26.9],
      [93.1, 26.3],
      [91.2, 25.9],
      [89.8, 26.1],
    ],
  },
  {
    id: 'bihar-kosi',
    name: 'Kosi Basin (Bihar)',
    theme: 'Severe Flood Hazard & River Shifting',
    priority: 'HIGH',
    sensors: ['EOS-04 C-SAR', 'RESOURCESAT-2A LISS-4'],
    coordinates: [
      [86.2, 25.4],
      [86.8, 26.2],
      [87.3, 26.6],
      [87.5, 26.1],
      [87.2, 25.5],
      [86.5, 25.2],
      [86.2, 25.4],
    ],
  },
  {
    id: 'odisha-coast',
    name: 'Coastal Corridor (Odisha)',
    theme: 'Storm Surge & Cyclone Inundation',
    priority: 'CRITICAL',
    sensors: ['EOS-06 Scatterometer', 'NISAR SAR'],
    coordinates: [
      [85.1, 19.3],
      [85.8, 19.8],
      [86.7, 20.4],
      [87.2, 21.3],
      [87.0, 21.0],
      [86.2, 20.0],
      [85.2, 19.4],
      [85.1, 19.3],
    ],
  },
  {
    id: 'krishna-godavari',
    name: 'Krishna-Godavari Delta',
    theme: 'Delta Hydrology & Agricultural Moisture',
    priority: 'MEDIUM',
    sensors: ['CARTOSAT-3 PAN', 'RESOURCESAT-2A AWiFS'],
    coordinates: [
      [80.5, 15.8],
      [81.2, 16.5],
      [82.3, 16.9],
      [82.2, 16.3],
      [81.4, 15.9],
      [80.5, 15.8],
    ],
  },
];
