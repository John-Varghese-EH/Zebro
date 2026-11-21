#!/usr/bin/env python3
"""Screen ISRO primaries against the catalogue for the next 72 hours."""
import json, math, random
from datetime import datetime, timezone, timedelta
from pathlib import Path
import numpy as np
from scipy.optimize import minimize_scalar
from sgp4 import omm
from sgp4.api import Satrec, SatrecArray, jday

ROOT = Path(__file__).resolve().parents[1]
DATA, OUT = ROOT / 'data', ROOT / 'public' / 'data'
OUT.mkdir(parents=True, exist_ok=True)
MU, RE = 398600.4418, 6378.137
HOURS, STEP_S, CHUNK = 72, 15, 240
SHELL_MARGIN_KM, LOOSE_KM = 30, 400
ALERT_KM, WATCH_KM = 5.0, 25.0
SIGMA_BASE_M, SIGMA_PER_DAY_M = 1000.0, 500.0
KEEP = ['OBJECT_NAME', 'OBJECT_ID', 'EPOCH', 'MEAN_MOTION', 'ECCENTRICITY',
        'INCLINATION', 'RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'MEAN_ANOMALY',
        'EPHEMERIS_TYPE', 'CLASSIFICATION_TYPE', 'NORAD_CAT_ID',
        'ELEMENT_SET_NO', 'REV_AT_EPOCH', 'BSTAR', 'MEAN_MOTION_DOT',
        'MEAN_MOTION_DDOT']


def band(f):
    n = float(f['MEAN_MOTION']) * 2 * math.pi / 86400
    a = (MU / n ** 2) ** (1 / 3)
    e = float(f['ECCENTRICITY'])
    return a * (1 - e) - RE, a * (1 + e) - RE


def parse_epoch(s):
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def load(path):
    out = []
    p = Path(path)
    if not p.exists():
        return out
    for f in json.loads(p.read_text()):
        s = Satrec()
        try:
            omm.initialize(s, f)
        except Exception:
            continue
        out.append({'f': f, 'sat': s, 'norad': int(f['NORAD_CAT_ID']),
                    'name': f['OBJECT_NAME'], 'band': band(f)})
    return out


def crossings(rel_r, rel_v, loose_km=LOOSE_KM, bad=None):
    """Return (object_index, sample_index) where range-rate goes from < 0 to >= 0.
    rel_r, rel_v: (N, T, 3). Testable without SGP4."""
    rr = np.einsum('ntk,ntk->nt', rel_r, rel_v)
    dist = np.linalg.norm(rel_r, axis=2)
    cross = (rr[:, :-1] < 0) & (rr[:, 1:] >= 0)
    near = np.minimum(dist[:, :-1], dist[:, 1:]) < loose_km
    ok = cross & near
    if bad is not None:
        ok &= ~bad[:, :-1] & ~bad[:, 1:]
    return np.where(ok)


def pc(miss_m, radius_m, sigma_m):
    return (radius_m ** 2) / (2 * sigma_m ** 2) * math.exp(-(miss_m ** 2) / (2 * sigma_m ** 2))


def kind_of(name):
    n = name.upper()
    return 'debris' if 'DEB' in n else 'rocket_body' if 'R/B' in n else 'payload'


def radius_of(kind):
    return {'debris': 0.5, 'rocket_body': 3.0}.get(kind, 2.0)


def main():
    t0 = datetime.now(timezone.utc).replace(microsecond=0)
    jd0, fr0 = jday(t0.year, t0.month, t0.day, t0.hour, t0.minute, t0.second)
    prim = load(DATA / 'isro_gp.json')
    if not prim:
        print("No ISRO primaries found in data/isro_gp.json. Run fetch_gp.py first.")
        return

    missions_path = OUT / 'isro_missions.json'
    missions = {}
    if missions_path.exists():
        missions = {m['noradId']: m for m in json.loads(missions_path.read_text())}

    pool = {}
    for p in DATA.glob('gp_*.json'):
        for o in load(p):
            pool[o['norad']] = o
    for p in prim:
        pool.pop(p['norad'], None)

    events = []
    total = HOURS * 3600 // STEP_S
    for P in prim:
        pb = P['band']
        cand = [o for o in pool.values()
                if o['band'][0] <= pb[1] + SHELL_MARGIN_KM and o['band'][1] >= pb[0] - SHELL_MARGIN_KM]
        if not cand:
            continue
        arr, parr = SatrecArray([o['sat'] for o in cand]), SatrecArray([P['sat']])
        rp_m = missions.get(P['norad'], {}).get('radiusM', 2.0)
        age_p = (t0 - parse_epoch(P['f']['EPOCH'])).total_seconds() / 86400
        for c0 in range(0, total, CHUNK):
            k = np.arange(c0, min(c0 + CHUNK + 1, total + 1)) * STEP_S
            fr = fr0 + k / 86400.0
            jd = np.full_like(fr, jd0)
            _, rp, vp = parr.sgp4(jd, fr)
            e, r, v = arr.sgp4(jd, fr)
            ii, jj = crossings(r - rp, v - vp, bad=(e != 0))
            for i, j in zip(ii, jj):
                O = cand[i]

                def f(s, sat=O['sat']):
                    _, ra, _ = P['sat'].sgp4(jd0, fr0 + s / 86400.0)
                    _, rb, _ = sat.sgp4(jd0, fr0 + s / 86400.0)
                    return float(np.linalg.norm(np.array(ra) - np.array(rb)))

                res = minimize_scalar(f, bounds=(float(k[j]), float(k[j + 1])),
                                      method='bounded', options={'xatol': 1e-3})
                if res.fun > WATCH_KM:
                    continue
                _, ra, va = P['sat'].sgp4(jd0, fr0 + res.x / 86400.0)
                _, rb, vb = O['sat'].sgp4(jd0, fr0 + res.x / 86400.0)
                rel_speed = float(np.linalg.norm(np.array(va) - np.array(vb)))
                kind = kind_of(O['name'])
                age_s = (t0 - parse_epoch(O['f']['EPOCH'])).total_seconds() / 86400
                sigma = SIGMA_BASE_M + SIGMA_PER_DAY_M * max(age_p, age_s, 0)
                R = rp_m + radius_of(kind)
                tca = t0 + timedelta(seconds=res.x)
                events.append({
                    'id': f"{P['norad']}-{O['norad']}-{tca:%Y%m%dT%H%M%S}",
                    'primary': {'name': P['name'], 'norad': P['norad']},
                    'secondary': {'name': O['name'], 'norad': O['norad'], 'kind': kind},
                    'tca_utc': tca.isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
                    'miss_km': round(res.fun, 3), 'rel_speed_kms': round(rel_speed, 3),
                    'class': 'alert' if res.fun < ALERT_KM else 'watch',
                    'pc': pc(res.fun * 1000, R, sigma), 'sigma_m': round(sigma, 1),
                    'radii_m': {'primary': rp_m, 'secondary': radius_of(kind)},
                    'element_age_days': {'primary': round(age_p, 2), 'secondary': round(age_s, 2)},
                })
    events.sort(key=lambda x: (-x['pc'], x['miss_km']))

    (OUT / 'conjunctions.json').write_text(json.dumps({
        'generated_utc': t0.isoformat().replace('+00:00', 'Z'), 'window_hours': HOURS,
        'assumptions': {'sigma_base_m': SIGMA_BASE_M, 'sigma_per_day_m': SIGMA_PER_DAY_M},
        'events': events}, indent=2))
    slim = lambda f: {k: f[k] for k in KEEP if k in f}
    (OUT / 'fleet_gp.json').write_text(json.dumps([slim(p['f']) for p in prim], indent=2))
    leo = [o for o in pool.values() if o['band'][1] < 2000]
    random.Random(2026).shuffle(leo)
    (OUT / 'background.json').write_text(json.dumps([slim(o['f']) for o in leo[:2000]], indent=2))

    manifest_in = DATA / 'manifest.json'
    man = json.loads(manifest_in.read_text()) if manifest_in.exists() else {}
    man['counts'] = {'fleet': len(prim), 'background': min(2000, len(leo)), 'screened': len(pool)}
    (OUT / 'manifest.json').write_text(json.dumps(man, indent=2))
    print(len(events), 'events found')


if __name__ == '__main__':
    main()
