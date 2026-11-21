#!/usr/bin/env python3
"""Download GP data from CelesTrak as OMM JSON. Respect the 2 h refresh cycle."""
import json, sys, time
from datetime import datetime, timezone
from pathlib import Path
import requests

BASE = 'https://celestrak.org/NORAD/elements/gp.php'
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
DATA.mkdir(exist_ok=True)
MIN_AGE_S = 2 * 3600
HEADERS = {'User-Agent': 'zebro/1.0'}

ISRO = {
    65053: ['NISAR'],
    51656: ['EOS-4', 'EOS-04', 'RISAT-1A'],
    54361: ['EOS-6', 'EOS-06', 'OCEANSAT-3'],
    41877: ['RESOURCESAT-2A'],
    44804: ['CARTOSAT-3'],
}
GROUPS = ['resource', 'weather', 'science', 'fengyun-1c-debris', 'cosmos-1408-debris',
          'cosmos-2251-debris', 'iridium-33-debris']


def fresh(p: Path) -> bool:
    return p.exists() and time.time() - p.stat().st_mtime < MIN_AGE_S


def get(params, retries=3):
    for attempt in range(retries):
        try:
            r = requests.get(BASE, params={**params, 'FORMAT': 'json'},
                             timeout=60, headers=HEADERS)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt == retries - 1:
                raise e
            time.sleep(2 * (attempt + 1))



def main():
    force = '--force' in sys.argv
    fleet = []
    out = DATA / 'isro_gp.json'
    if fresh(out) and not force:
        fleet = json.loads(out.read_text())
    else:
        for norad, names in ISRO.items():
            try:
                rows = get({'CATNR': norad})
            except Exception as e:
                print(f'WARN {norad}: {e}')
                continue
            if not rows:
                raise SystemExit(f'No GP data for {norad}')
            name = rows[0]['OBJECT_NAME'].upper()
            if not any(n in name for n in names):
                raise SystemExit(f'ID {norad} returned "{name}", expected one of {names}')
            fleet.append(rows[0])
            time.sleep(1)
        if len(fleet) == len(ISRO):
            out.write_text(json.dumps(fleet, indent=2))
    for g in GROUPS:
        p = DATA / f'gp_{g}.json'
        if fresh(p) and not force:
            continue
        try:
            p.write_text(json.dumps(get({'GROUP': g})))
            print(g, 'ok')
        except Exception as e:
            print(f'WARN {g}: {e} (keeping cached file)' if p.exists() else f'FAIL {g}: {e}')
        time.sleep(1)
    epochs = sorted(f['EPOCH'] for f in fleet) if fleet else ['', '']
    (DATA / 'manifest.json').write_text(json.dumps({
        'fetched_utc': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'source': 'CelesTrak GP (OMM JSON)',
        'fleet_epoch_oldest': epochs[0], 'fleet_epoch_newest': epochs[-1],
    }, indent=2))


if __name__ == '__main__':
    main()
