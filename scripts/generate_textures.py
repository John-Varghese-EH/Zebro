#!/usr/bin/env python3
"""Generate offline 2k textures for Earth and Stars."""
import math, random
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'public' / 'textures'
OUT.mkdir(parents=True, exist_ok=True)


def generate_stars(width=2048, height=1024, num_stars=3000):
    img = Image.new('RGB', (width, height), color=(11, 24, 41)) # navy base
    draw = ImageDraw.Draw(img)
    rng = random.Random(2026)

    for _ in range(num_stars):
        x = rng.randint(0, width - 1)
        y = rng.randint(0, height - 1)
        brightness = rng.randint(120, 245)
        size = rng.choice([1, 1, 1, 1, 2])
        # subtle color tint (sky blue or warm white)
        color = (brightness, min(255, brightness + 10), min(255, brightness + 20)) if rng.random() > 0.5 else (brightness, brightness, brightness)
        if size == 1:
            draw.point((x, y), fill=color)
        else:
            draw.ellipse([x - 1, y - 1, x + 1, y + 1], fill=color)

    img.save(OUT / 'stars_2k.jpg', quality=85, optimize=True)
    print("stars_2k.jpg generated")


def generate_earth(width=2048, height=1024):
    # Deep oceanic blue with landmasses approximation
    # Equirectangular coordinates: x -> lon (-180..180), y -> lat (90..-90)
    arr = np.zeros((height, width, 3), dtype=np.uint8)

    # Base ocean: deep navy-blue (#0B1B32)
    ocean_color = np.array([11, 27, 50], dtype=np.float32)
    shelf_color = np.array([18, 48, 80], dtype=np.float32)

    # Generate synthetic continental landmasses with harmonics
    lons = np.linspace(-math.pi, math.pi, width)
    lats = np.linspace(math.pi / 2, -math.pi / 2, height)
    lon_grid, lat_grid = np.meshgrid(lons, lats)

    # Multi-frequency continental shape noise
    elev = (
        0.5 * np.sin(lon_grid + 0.4) * np.cos(lat_grid)
        + 0.3 * np.sin(2 * lon_grid - 0.8) * np.cos(2 * lat_grid)
        + 0.25 * np.cos(3 * lon_grid + 1.2) * np.sin(lat_grid)
        + 0.15 * np.sin(4 * lon_grid) * np.cos(3 * lat_grid)
        + 0.1 * np.sin(8 * lon_grid) * np.sin(6 * lat_grid)
    )

    # Add specific boost for Indian subcontinent (lon ~ 78E, lat ~ 20N)
    ind_lon = (78.0 / 180.0) * math.pi
    ind_lat = (20.0 / 180.0) * math.pi
    dist_india = np.sqrt((lon_grid - ind_lon)**2 + (lat_grid - ind_lat)**2)
    elev += 0.45 * np.exp(-dist_india**2 / 0.18)

    # Add Eurasia boost
    asia_lon = (60.0 / 180.0) * math.pi
    asia_lat = (45.0 / 180.0) * math.pi
    dist_asia = np.sqrt((lon_grid - asia_lon)**2 + (lat_grid - asia_lat)**2)
    elev += 0.4 * np.exp(-dist_asia**2 / 0.8)

    # Add Americas boost
    am_lon = (-90.0 / 180.0) * math.pi
    am_lat = (15.0 / 180.0) * math.pi
    dist_am = np.sqrt((lon_grid - am_lon)**2 + (lat_grid - am_lat)**2)
    elev += 0.35 * np.exp(-dist_am**2 / 0.6)

    # Threshold for ocean vs continental land
    ocean_mask = elev < 0.1
    shelf_mask = (elev >= 0.1) & (elev < 0.18)
    land_mask = elev >= 0.18

    # Low-saturation muted land colors (slate, dark moss, subtle ochre)
    land_base = np.array([28, 48, 64], dtype=np.float32)
    high_land = np.array([45, 70, 85], dtype=np.float32)

    t_land = np.clip((elev - 0.18) / 0.6, 0, 1)[:, :, None]
    land_colors = land_base * (1 - t_land) + high_land * t_land

    # Assemble texture
    arr[ocean_mask] = ocean_color
    arr[shelf_mask] = shelf_color
    arr[land_mask] = land_colors[land_mask]

    img = Image.fromarray(arr)
    # Save optimized JPG under 1 MB per section 3.4
    img.save(OUT / 'earth_day_2k.jpg', quality=88, optimize=True)
    print("earth_day_2k.jpg generated")


if __name__ == '__main__':
    generate_stars()
    generate_earth()
