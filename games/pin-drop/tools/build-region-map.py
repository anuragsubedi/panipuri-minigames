#!/usr/bin/env python3
"""Build a regional map file for Pin Drop.

Run by hand (not a build step), standard library only:

    python3 games/pin-drop/tools/build-region-map.py india \
        ne_10m_admin_0_countries_ind.geojson ne_10m_admin_1_states_provinces.geojson \
        > games/pin-drop/data/maps/india.json
    python3 games/pin-drop/tools/build-region-map.py nepal \
        ne_10m_admin_0_countries_nep.geojson npl_admin0.geojson npl_admin3.geojson \
        games/pin-drop/data/packs/nepal-nature.json > games/pin-drop/data/maps/nepal.json

Sources: Natural Earth 1:10m (public domain, https://github.com/nvkelso/natural-earth-vector).
The countries file is a Natural Earth *point-of-view* file (e.g. `_ind`), so
borders are drawn as that country's official map draws them.
Nepal ("cod" regions) instead takes its outline and inner lines from the
Survey Department of Nepal's boundaries as published on OCHA HDX
(https://data.humdata.org/dataset/cod-ab-npl, CC BY 3.0 IGO): npl_admin0 for
the outline, npl_admin3 (local levels) for province, district and local
lines, so every layer shares the same vertices. Natural Earth then only
supplies the neighbours. An optional pack adds its rivers (places with a
line shape, from OpenStreetMap) as a faint base-map layer.

Output, in the same map units as world.json (x = lon, y = -lat):
    bounds    the playable area
    countries every country in view (drawn muted, for context)
    focus     the region's country outline (drawn as land)
    states    internal state lines only: shared edges between two different
              states of the focus country. Admin-1 data follows de facto
              control, so pieces administered by a neighbour are relabelled
              to the state the point-of-view map puts them in (REMAP);
              lines of control therefore never show up as state lines.
    districts (cod only) district lines that aren't province lines
    locals    (cod only) local-level (palika) lines that aren't district lines
    rivers    (cod only, optional) river courses from a pack's line shapes
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
    "nepal": {
        "focus": "NPL",
        "bounds": {"west": 79.7, "east": 88.5, "north": 30.75, "south": 26.0},
        "admin": "cod",
        "precision": 4,
        # Douglas–Peucker tolerance per layer, in degrees (0.001 ≈ 100 m).
        "tolerance": 0.0012,
        "layer_tolerance": {"states": 0.0012, "districts": 0.0015, "locals": 0.0025},
        "note": "Borders: Nepal Survey Dept. (official) · HDX · rivers © OSM",
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


EDGE_KEY = lambda p: (round(p[0], 6), round(p[1], 6))


def edge_owners(features, label_of):
    """Map each polygon edge to the set of labels whose rings use it."""
    owners = {}
    for feature in features:
        label = label_of(feature["properties"])
        if label is None:
            continue
        for polygon in polygons(feature["geometry"]):
            for ring in polygon:
                for a, b in zip(ring, ring[1:]):
                    edge = tuple(sorted((EDGE_KEY(a), EDGE_KEY(b))))
                    owners.setdefault(edge, set()).add(label)
    return owners


def state_lines(admin1, focus, remap):
    """Edges shared by two differently-labelled states, chained into polylines."""
    def label_of(props):
        label = props["name"] if props["adm0_a3"] == focus else None
        for (c, prefix), target in remap.items():
            if props["adm0_a3"] == c and props["name"].startswith(prefix):
                label = target
        return label

    owners = edge_owners(admin1, label_of)
    return chain([e for e, labels in owners.items() if len(labels) > 1])


def cod_lines(locals_):
    """Province, district and local lines from one local-level file. Each shared
    edge goes to the coarsest level it separates, so no line is drawn twice."""
    owners = edge_owners(locals_, lambda p: (p["adm1_name"], p["adm2_name"], p["adm3_pcode"]))
    layers = {"states": [], "districts": [], "locals": []}
    for edge, labels in owners.items():
        if len(labels) < 2:
            continue
        if len({l[0] for l in labels}) > 1:
            layers["states"].append(edge)
        elif len({l[1] for l in labels}) > 1:
            layers["districts"].append(edge)
        else:
            layers["locals"].append(edge)
    return {name: chain(edges) for name, edges in layers.items()}


def chain(edges):
    """Chain edges into polylines through vertices of degree 2."""
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


def load_features(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)["features"]


def main(region_id, countries_path, *admin_paths):
    global PRECISION
    region = REGIONS[region_id]
    bounds, tol = region["bounds"], region["tolerance"]
    PRECISION = region.get("precision", PRECISION)
    countries = load_features(countries_path)
    in_view = [f for f in countries if bbox_hits(f["geometry"], bounds)]
    focus = [f for f in in_view if f["properties"]["ADM0_A3"] == region["focus"]]
    if len(focus) != 1:
        raise SystemExit(f"Expected one {region['focus']} feature, got {len(focus)}")
    # Neighbours are only context: clip them just past the view and simplify harder.
    box = (bounds["west"] - 3, bounds["south"] - 3, bounds["east"] + 3, bounds["north"] + 3)
    context = "".join(ring_paths(f["geometry"], tol * 2.5, box) for f in in_view if f is not focus[0])
    out = {"bounds": bounds, "countries": context}
    if region.get("admin") == "cod":
        outline_path, locals_path, *rivers_pack = admin_paths
        out["focus"] = ring_paths(load_features(outline_path)[0]["geometry"], tol)
        layer_tol = region["layer_tolerance"]
        for name, lines in cod_lines(load_features(locals_path)).items():
            out[name] = "".join(path(simplify(line, layer_tol[name]), close=False) for line in lines)
        if rivers_pack:
            with open(rivers_pack[0], encoding="utf-8") as handle:
                shapes = [p["shape"] for p in json.load(handle)["places"] if p.get("shape", {}).get("kind") == "line"]
            out["rivers"] = "".join(path(line, close=False) for shape in shapes for line in shape["paths"])
    else:
        nearby = [f for f in load_features(admin_paths[0]) if bbox_hits(f["geometry"], bounds, margin=0)]
        lines = state_lines(nearby, region["focus"], region["remap"])
        out["focus"] = ring_paths(focus[0]["geometry"], tol)
        out["states"] = "".join(path(simplify(line, tol), close=False) for line in lines)
    out["note"] = region["note"]
    json.dump(out, sys.stdout, separators=(",", ":"), ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main(*sys.argv[1:])
