#!/usr/bin/env python3
"""Build a regional map file for Pin Drop from Natural Earth 1:10m data.

Run by hand (not a build step), standard library only:

    python3 games/pin-drop/tools/build-region-map.py india \
        ne_10m_admin_0_countries_ind.geojson ne_10m_admin_1_states_provinces.geojson \
        > games/pin-drop/data/maps/india.json

Sources (public domain): https://github.com/nvkelso/natural-earth-vector
The countries file is a Natural Earth *point-of-view* file (e.g. `_ind`), so
borders are drawn as that country's official map draws them.

Output, in the same map units as world.json (x = lon, y = -lat):
    bounds    the playable area
    countries every country in view (drawn muted, for context)
    focus     the region's country outline (drawn as land)
    states    internal state lines only: shared edges between two different
              states of the focus country. Admin-1 data follows de facto
              control, so pieces administered by a neighbour are relabelled
              to the state the point-of-view map puts them in (REMAP);
              lines of control therefore never show up as state lines.
    note      provenance shown on the map
"""

import json
import math
import sys

REGIONS = {
    "india": {
        "focus": "IND",
        "bounds": {"west": 66.5, "east": 98.5, "north": 37.6, "south": 6.0},
        "tolerance": 0.012,  # degrees (≈ 1.3 km) for Douglas–Peucker
        "remap": {
            # Natural Earth admin-1 name → India-view state
            ("PAK", "Azad Kashmir"): "Jammu and Kashmir",
            ("PAK", "Northern Areas"): "Ladakh",
            ("KAS", "Kashmir"): "Ladakh",
        },
        "note": "Borders: India's official view · Natural Earth",
    },
}

PRECISION = 3


def polygons(geometry):
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return geometry["coordinates"]
    return []


def bbox_hits(geometry, b, margin=2.0):
    for polygon in polygons(geometry):
        for lon, lat in polygon[0]:
            if b["west"] - margin <= lon <= b["east"] + margin and b["south"] - margin <= lat <= b["north"] + margin:
                return True
    return False


def simplify(points, tolerance):
    """Douglas–Peucker, iterative."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        (x1, y1), (x2, y2) = points[start], points[end]
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy) or 1e-12
        best, index = 0.0, None
        for i in range(start + 1, end):
            x, y = points[i]
            dist = abs(dy * (x - x1) - dx * (y - y1)) / length
            if dist > best:
                best, index = dist, i
        if index is not None and best > tolerance:
            keep[index] = True
            stack += [(start, index), (index, end)]
    return [p for p, k in zip(points, keep) if k]


def simplify_ring(ring, tolerance):
    """A closed ring starts and ends on the same point, which gives Douglas–Peucker
    a zero-length baseline; split it at the point farthest from the start instead."""
    ring = ring[:-1] if ring[0] == ring[-1] else ring
    if len(ring) < 4:
        return ring
    far = max(range(len(ring)), key=lambda i: math.dist(ring[0], ring[i]))
    first = simplify(ring[: far + 1], tolerance)
    second = simplify(ring[far:] + [ring[0]], tolerance)
    return first + second[1:-1]


def fmt(n):
    text = f"{n:.{PRECISION}f}".rstrip("0").rstrip(".")
    return "0" if text in ("-0", "") else text


def path(points, close):
    pts = [(round(x, PRECISION), round(-y, PRECISION)) for x, y in points]
    pts = [p for i, p in enumerate(pts) if i == 0 or p != pts[i - 1]]
    if close and len(pts) < 3:
        return ""
    if len(pts) < 2:
        return ""
    parts = [f"M{fmt(pts[0][0])} {fmt(pts[0][1])}"]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        parts.append(f"l{fmt(x1 - x0)} {fmt(y1 - y0)}")
    return "".join(parts) + ("z" if close else "")


def clip_ring(ring, box):
    """Sutherland–Hodgman against an axis-aligned box (west, south, east, north).
    New edges run along the box, which sits outside the visible map."""
    west, south, east, north = box
    edges = [
        (lambda p: p[0] >= west, lambda a, b: cross_x(a, b, west)),
        (lambda p: p[0] <= east, lambda a, b: cross_x(a, b, east)),
        (lambda p: p[1] >= south, lambda a, b: cross_y(a, b, south)),
        (lambda p: p[1] <= north, lambda a, b: cross_y(a, b, north)),
    ]
    points = list(ring)
    for inside, cross in edges:
        if not points:
            break
        out = []
        for i, cur in enumerate(points):
            prev = points[i - 1]
            if inside(cur):
                if not inside(prev):
                    out.append(cross(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(cross(prev, cur))
        points = out
    return points


def cross_x(a, b, x):
    t = (x - a[0]) / (b[0] - a[0])
    return [x, a[1] + t * (b[1] - a[1])]


def cross_y(a, b, y):
    t = (y - a[1]) / (b[1] - a[1])
    return [a[0] + t * (b[0] - a[0]), y]


def ring_paths(geometry, tolerance, box=None):
    out = []
    for polygon in polygons(geometry):
        for ring in polygon:
            if box:
                ring = clip_ring(ring, box)
                if len(ring) < 3:
                    continue
            d = path(simplify_ring(ring, tolerance), close=True)
            if d:
                out.append(d)
    return "".join(out)


def state_lines(admin1, focus, remap):
    """Edges shared by two differently-labelled states, chained into polylines."""
    key = lambda p: (round(p[0], 6), round(p[1], 6))
    owners = {}
    for feature in admin1:
        props = feature["properties"]
        code = props["adm0_a3"]
        label = props["name"] if code == focus else None
        for (c, prefix), target in remap.items():
            if code == c and props["name"].startswith(prefix):
                label = target
        if label is None:
            continue
        for polygon in polygons(feature["geometry"]):
            for ring in polygon:
                for a, b in zip(ring, ring[1:]):
                    edge = tuple(sorted((key(a), key(b))))
                    owners.setdefault(edge, set()).add(label)
    edges = [e for e, labels in owners.items() if len(labels) > 1]
    # Chain edges into polylines through vertices of degree 2.
    neighbours = {}
    for a, b in edges:
        neighbours.setdefault(a, []).append(b)
        neighbours.setdefault(b, []).append(a)
    seen = set()
    lines = []
    starts = [v for v, n in neighbours.items() if len(n) != 2] + list(neighbours)
    for start in starts:
        for nxt in neighbours[start]:
            edge = tuple(sorted((start, nxt)))
            if edge in seen:
                continue
            line = [start]
            prev, cur = start, nxt
            seen.add(edge)
            while True:
                line.append(cur)
                options = [n for n in neighbours[cur] if tuple(sorted((cur, n))) not in seen]
                if len(neighbours[cur]) != 2 or not options:
                    break
                prev, cur = cur, options[0]
                seen.add(tuple(sorted((prev, cur))))
            lines.append(line)
    return lines


def main(region_id, countries_path, admin1_path):
    region = REGIONS[region_id]
    bounds, tol = region["bounds"], region["tolerance"]
    with open(countries_path, encoding="utf-8") as handle:
        countries = json.load(handle)["features"]
    with open(admin1_path, encoding="utf-8") as handle:
        admin1 = json.load(handle)["features"]
    in_view = [f for f in countries if bbox_hits(f["geometry"], bounds)]
    focus = [f for f in in_view if f["properties"]["ADM0_A3"] == region["focus"]]
    if len(focus) != 1:
        raise SystemExit(f"Expected one {region['focus']} feature, got {len(focus)}")
    # Neighbours are only context: clip them just past the view and simplify harder.
    box = (bounds["west"] - 3, bounds["south"] - 3, bounds["east"] + 3, bounds["north"] + 3)
    context = "".join(ring_paths(f["geometry"], tol * 2.5, box) for f in in_view if f is not focus[0])
    nearby = [f for f in admin1 if bbox_hits(f["geometry"], bounds, margin=0)]
    lines = state_lines(nearby, region["focus"], region["remap"])
    states = "".join(path(simplify(line, tol), close=False) for line in lines)
    out = {
        "bounds": bounds,
        "countries": context,
        "focus": ring_paths(focus[0]["geometry"], tol),
        "states": states,
        "note": region["note"],
    }
    json.dump(out, sys.stdout, separators=(",", ":"), ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main(*sys.argv[1:4])
