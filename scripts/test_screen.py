import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import numpy as np
import pytest
from screen import crossings


def test_fast_head_on_detected_at_60s_sampling():
    # relative motion at 13.2 km/s, 1 km miss, sampled every 60 s
    v = np.array([13.2, 0, 0])
    r0 = np.array([-3000.0, 1.0, 0])
    t = np.arange(0, 600, 60)[None, :, None]
    rel_r = r0 + v * t
    rel_v = np.broadcast_to(v, rel_r.shape)
    ii, jj = crossings(rel_r, rel_v, loose_km=400)
    assert len(ii) == 1  # the pass is found
    # a 50 km distance test would have missed it because closest sample is > 50km
    assert np.linalg.norm(rel_r[0, jj[0]]) > 50


def test_crossings_receding_only_not_detected():
    # Objects moving apart from each other
    v = np.array([10.0, 0, 0])
    r0 = np.array([100.0, 5.0, 0])
    t = np.arange(0, 300, 15)[None, :, None]
    rel_r = r0 + v * t
    rel_v = np.broadcast_to(v, rel_r.shape)
    ii, _ = crossings(rel_r, rel_v, loose_km=400)
    assert len(ii) == 0


def test_crossings_outside_loose_km_ignored():
    # Closest approach occurs but distance is > 400 km
    v = np.array([10.0, 0, 0])
    r0 = np.array([-500.0, 450.0, 0])
    t = np.arange(0, 100, 10)[None, :, None]
    rel_r = r0 + v * t
    rel_v = np.broadcast_to(v, rel_r.shape)
    ii, _ = crossings(rel_r, rel_v, loose_km=400)
    assert len(ii) == 0
