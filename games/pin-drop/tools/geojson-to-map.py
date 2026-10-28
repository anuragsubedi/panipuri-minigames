#!/usr/bin/env python3
"""Turn a Natural Earth admin-0 countries GeoJSON into Pin Drop's map file.

Run by hand (not a build step), standard library only:

    python3 games/pin-drop/tools/geojson-to-map.py ne_110m_admin_0_countries.geojson \
        > games/pin-drop/data/maps/world.json

Source: https://github.com/nvkelso/natural-earth-vector (public domain).
Output: {"bounds": {...}, "countries": "<SVG path data>"} in equirectangular
map units, x = longitude, y = -latitude (degrees), so the UI needs no projection
library. Each country is one subpath; filling them all and stroking them gives
land plus borders.
"""

import json
import sys

PRECISION = 2  # decimals in degrees (0.01° ≈ 1 km), plenty for 1:110m data
BOUNDS = {"west": -180, "east": 180, "north": 84, "south": -60}


def ring_path(ring):
    points = []
    for lon, lat in ring:
        point = (round(lon, PRECISION), round(-lat, PRECISION))
        if not points or point != points[-1]:
            points.append(point)
    if len(points) > 1 and points[0] == points[-1]:
        points.pop()
    if len(points) < 3:
        return ""
    # Relative moves after the first point keep the file small.
    parts = [f"M{fmt(points[0][0])} {fmt(points[0][1])}"]
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        parts.append(f"l{fmt(x1 - x0)} {fmt(y1 - y0)}")
    return "".join(parts) + "z"


def fmt(n):
    text = f"{round(n, PRECISION):.{PRECISION}f}".rstrip("0").rstrip(".")
    return "0" if text in ("-0", "") else text


def polygons(geometry):
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return geometry["coordinates"]
    return []


def main(path):
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
    subpaths = []
    for feature in data["features"]:
        for polygon in polygons(feature["geometry"]):
            for ring in polygon:
                d = ring_path(ring)
                if d:
                    subpaths.append(d)
    json.dump({"bounds": BOUNDS, "countries": "".join(subpaths)}, sys.stdout, separators=(",", ":"))
    sys.stdout.write("\n")


if __name__ == "__main__":
    main(sys.argv[1])
