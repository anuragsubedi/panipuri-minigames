#!/usr/bin/env python3
"""Build a Nepal landmarks or nature pack from OpenStreetMap (Nominatim), checked
against the Survey Department's district polygons.

Run by hand (not a build step), standard library only, ~1 request per second:

    python3 games/pin-drop/tools/geocode-nepal.py games/pin-drop/tools/nepal-nature-source.json \
        games/pin-drop/data/packs/nepal-nature.json npl_admin2.geojson npl_admin0.geojson \
        hotosm_npl_waterways.geojson

Like geocode-landmarks.py, the source holds the hand-made part (name, detail
"District, Province", tier, region, blurb, optional query). In addition:
- A hit only counts if it lies in the named district (a same-named temple
  elsewhere is skipped) and isn't a business named after the place (a café
  called "… Boudhanath"); hits OSM links to Wikidata come first. Places with
  no such hit are listed with where the candidates were, so the query can be
  fixed by hand. Every match still gets a human look (D-033).
- "shape": "line" (rivers) or "area" (parks, lakes) keeps OSM's geometry:
  lines are clipped to Nepal, everything is simplified to ≈ 300 m, and the
  hit counts if any of it touches the named district.
- "water": {"names": [...], "districts": [...]} builds a river or lake from
  the HOT OSM waterways export (https://data.humdata.org/dataset/hotosm_npl_waterways,
  ODbL) by its exact OSM names, joining all its pieces; Nominatim only
  returns part of a long river.
- "point": {"lat", "lon", "wikidata"} is for the few places OSM lacks or
  tags oddly: coordinates copied from that Wikidata item (CC0).
- "todo": "why" leaves a place out until it has trustworthy coordinates.
- "also": [districts] for places on a district line; "anywhere": true skips
  the check (summits on the border, the Koshi Barrage).
Data © OpenStreetMap contributors, ODbL 1.0. Boundaries: Survey Department of
Nepal via OCHA HDX (CC BY 3.0 IGO).
"""

import importlib.util
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ENDPOINT = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "panipuri-minigames/0.2 (https://github.com/anuragsubedi/panipuri-minigames)"
PAUSE_S = 1.1
SHAPE_TOLERANCE = 0.003  # degrees, ≈ 300 m
# Display spellings → survey spellings.
SURVEY_DISTRICT = {"Dhanusha": "Dhanusa", "Chitwan": "Chitawan", "Tanahun": "Tanahu", "Kapilvastu": "Kapilbastu", "Parasi": "Nawalparasi West", "Nawalpur": "Nawalparasi East"}
# Businesses and buildings that borrow a landmark's name ("La Casita Di Boudhanath").
# Temples are amenity=place_of_worship, so amenities are filtered by type, not wholesale.
SKIP = {"shop", "office", "highway", "craft", "healthcare", "railway"}
SKIP_TYPES = {"hotel", "guest_house", "hostel", "motel", "apartment", "information", "travel_agency", "restaurant", "cafe",
              "bar", "fast_food", "school", "college", "university", "bank", "pharmacy", "clinic", "hospital", "bus_stop", "parking"}
GEOMETRY = {"line": ("LineString", "MultiLineString"), "area": ("Polygon", "MultiPolygon")}

# Reuse the map builder's Douglas–Peucker.
_spec = importlib.util.spec_from_file_location("build_region_map", os.path.join(HERE, "build-region-map.py"))
_brm = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_brm)
simplify, simplify_ring = _brm.simplify, _brm.simplify_ring


def polygons(geometry):
    return [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]


def inside_rings(lon, lat, rings):
    hit = False
    for ring in rings:
        for (xi, yi), (xj, yj) in zip(ring, ring[1:] + ring[:1]):
            if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
                hit = not hit
    return hit


def area_rings(geometry, tolerance=0.0):
    rings = [ring for polygon in polygons(geometry) for ring in polygon]
    return [simplify_ring(r, tolerance) for r in rings] if tolerance else rings


def lines_of(geometry):
    return [geometry["coordinates"]] if geometry["type"] == "LineString" else geometry["coordinates"]


def vertices(geometry):
    if geometry["type"] in GEOMETRY["line"]:
        return [p for line in lines_of(geometry) for p in line]
    return [p for ring in area_rings(geometry) for p in ring]


def search(text, shape):
    params = {"q": text, "countrycodes": "np", "format": "jsonv2", "limit": 10, "extratags": 1}
    if shape:
        params.update(polygon_geojson=1, polygon_threshold=0.0005)
    request = urllib.request.Request(f"{ENDPOINT}?{urllib.parse.urlencode(params)}", headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except (urllib.error.HTTPError, urllib.error.URLError) as error:
            if getattr(error, "code", 429) not in (429, 500, 502, 503, 504):
                raise
            time.sleep(5 * (attempt + 1))
    raise SystemExit(f"Nominatim kept refusing on {text!r}; try again later")


def clip_line(line, nepal):
    """Keep the runs of a line that lie inside Nepal."""
    runs, run = [], []
    for lon, lat in line:
        if inside_rings(lon, lat, nepal):
            run.append([lon, lat])
        elif run:
            runs.append(run)
            run = []
    if run:
        runs.append(run)
    return [r for r in runs if len(r) >= 2]


def compact(paths):
    return [[[round(x, 3), round(y, 3)] for x, y in path] for path in paths]


def shape_of(kind, geometry, nepal):
    if kind == "line":
        paths = [simplify(run, SHAPE_TOLERANCE) for line in lines_of(geometry) for run in clip_line(line, nepal)]
    else:
        paths = [r for r in area_rings(geometry, SHAPE_TOLERANCE) if len(r) >= 3]
    paths = [p for p in compact(paths) if len(p) >= 2]
    return {"kind": kind, "paths": paths} if paths else None


def district_of(lon, lat, districts):
    return next((name for name, rings in districts.items() if inside_rings(lon, lat, rings)), "outside Nepal")


def load_water(path):
    """Named rivers (lines) and lakes (polygons) from the HOT OSM waterways export."""
    with open(path, encoding="utf-8") as handle:
        features = json.load(handle)["features"]
    keep = []
    for f in features:
        p = f["properties"]
        names = {p.get("name"), p.get("name_en"), p.get("name_ne")} - {None}
        if names and (p.get("waterway") == "river" or f["geometry"]["type"] in ("Polygon", "MultiPolygon")):
            keep.append((names, p.get("adm2_name"), f))
    return keep


def chain_lines(lines):
    """Join line pieces that share an end point, so a river is a few long paths."""
    lines = [list(l) for l in lines]
    joined = True
    while joined:
        joined = False
        for i, a in enumerate(lines):
            for j, b in enumerate(lines):
                if i == j:
                    continue
                if a[-1] == b[0]:
                    lines[i] = a + b[1:]
                elif a[-1] == b[-1]:
                    lines[i] = a + b[::-1][1:]
                else:
                    continue
                del lines[j]
                joined = True
                break
            if joined:
                break
    return lines


def from_water(item, water, nepal):
    """Shape and an inside-Nepal point from the HOT export, by exact OSM names."""
    spec = item["water"]
    names = set(spec["names"])
    allowed = set(spec.get("districts", [])) or None
    found = [f for n, district, f in water if n & names and (allowed is None or district in allowed)]
    if not found:
        return None, "no OSM water feature with those names"
    if item["shape"] == "line":
        pieces = [f["geometry"]["coordinates"] for f in found if f["geometry"]["type"] == "LineString"]
        geometry = {"type": "MultiLineString", "coordinates": chain_lines(pieces)}
    else:
        polys = [f for f in found if f["geometry"]["type"] in ("Polygon", "MultiPolygon")]
        polys.sort(key=lambda f: -len(vertices(f["geometry"])))
        geometry = polys[0]["geometry"] if polys else None
        if geometry is None:
            return None, "no polygon with those names"
    shape = shape_of(item["shape"], geometry, nepal)
    if not shape:
        return None, "shape vanished after clipping"
    longest = max(shape["paths"], key=len)
    lon, lat = longest[len(longest) // 2] if item["shape"] == "line" else centroid(longest)
    districts = sorted({district for _, district, f in water if f in found and district})
    return {"lat": lat, "lon": lon, "shape": shape, "osm": f"{len(found)} OSM features", "districts": districts}, None


def centroid(ring):
    xs, ys = zip(*ring)
    return [sum(xs) / len(xs), sum(ys) / len(ys)]


def from_nominatim(item, rings_ok, nepal):
    kind = item.get("shape")
    hits = search(item.get("query", item["name"]), kind)
    time.sleep(PAUSE_S)
    # Usable hits, best first: ones OSM links to Wikidata, then Nominatim's own order.
    hits = [h for h in hits if h.get("category") not in SKIP and h.get("type") not in SKIP_TYPES]
    hits.sort(key=lambda h: not (h.get("extratags") or {}).get("wikidata"))
    for hit in hits:
        geometry = hit.get("geojson", {})
        if kind:
            ok = geometry.get("type") in GEOMETRY[kind] and any(rings_ok(x, y) for x, y in vertices(geometry)[::5] + vertices(geometry)[-1:])
        else:
            ok = rings_ok(float(hit["lon"]), float(hit["lat"]))
        if not ok:
            continue
        out = {"lat": float(hit["lat"]), "lon": float(hit["lon"]), "osm": f"{hit['osm_type']}/{hit['osm_id']}", "label": hit["display_name"][:80]}
        if kind:
            out["shape"] = shape_of(kind, geometry, nepal)
            if not out["shape"]:
                return None, "shape vanished after clipping"
            # A river's OSM point can be downstream in India; use a point on the Nepal part instead.
            if not inside_rings(out["lon"], out["lat"], nepal):
                longest = max(out["shape"]["paths"], key=len)
                out["lon"], out["lat"] = longest[len(longest) // 2]
        wikidata = (hit.get("extratags") or {}).get("wikidata")
        if wikidata:
            out["wikidata"] = wikidata
        return out, None
    return None, "; ".join(f"{h.get('category')}/{h.get('type')} at {h['lat'][:6]},{h['lon'][:6]}" for h in hits[:4]) or "no hits"


def main(source_path, out_path, admin2_path, admin0_path, water_path=None):
    with open(source_path, encoding="utf-8") as handle:
        source = json.load(handle)
    with open(admin2_path, encoding="utf-8") as handle:
        districts = {f["properties"]["adm2_name"]: area_rings(f["geometry"], 0.002) for f in json.load(handle)["features"]}
    with open(admin0_path, encoding="utf-8") as handle:
        nepal = area_rings(json.load(handle)["features"][0]["geometry"], 0.002)
    water = load_water(water_path) if water_path else []
    places, problems = [], []
    for item in source["places"]:
        if item.get("todo"):
            print(f"{item['name']}: skipped, {item['todo']}", file=sys.stderr)
            continue
        # The stated district, plus any it straddles ("also"); "anywhere" skips the check
        # (border summits and the Koshi Barrage sit on the line itself).
        names = [item["detail"].split(",")[0].strip()] + item.get("also", [])
        ring_sets = [districts[SURVEY_DISTRICT.get(n, n)] for n in names]
        rings_ok = (lambda x, y: True) if item.get("anywhere") else (lambda x, y: any(inside_rings(x, y, r) for r in ring_sets))
        if "water" in item:
            found, why = from_water(item, water, nepal)
        elif "point" in item:
            point = item["point"]
            found = {"lat": point["lat"], "lon": point["lon"], "osm": None, "wikidata": point["wikidata"]}
            why = None if rings_ok(point["lon"], point["lat"]) else f"point is in {district_of(point['lon'], point['lat'], districts)}"
            found = found if why is None else None
        else:
            found, why = from_nominatim(item, rings_ok, nepal)
        if not found:
            problems.append(f"{item['name']}: {why}")
            continue
        place = {
            "name": item["name"],
            "detail": item["detail"],
            "lat": round(found["lat"], 3),
            "lon": round(found["lon"], 3),
            "tier": item["tier"],
            "region": item["region"],
            "blurb": item["blurb"],
        }
        if found.get("shape"):
            place["shape"] = found["shape"]
        if found.get("osm") and "/" in found["osm"]:
            place["osm"] = found["osm"]
        if found.get("wikidata"):
            place["wikidata"] = found["wikidata"]
        where = district_of(place["lon"], place["lat"], districts)
        print(f"{item['name']}: {found.get('label') or found.get('osm') or 'Wikidata ' + found['wikidata']} → {where}"
              + (f" · districts {', '.join(found['districts'])}" if found.get("districts") else ""), file=sys.stderr)
        places.append(place)
    if problems:
        print("\nNeeds a better query:\n  " + "\n  ".join(problems), file=sys.stderr)
    places.sort(key=lambda p: (p["tier"], p["name"]))
    head = {**source["pack"], "source": "Hand-picked; coordinates and shapes © OpenStreetMap contributors (ODbL), via Nominatim and the HOT export on HDX; a few points from Wikidata (CC0)"}
    lines = [json.dumps(p, ensure_ascii=False, separators=(",", ":")) if "shape" in p else json.dumps(p, ensure_ascii=False) for p in places]
    text = json.dumps(head, ensure_ascii=False, indent=2)[:-2] + ',\n  "places": [\n    ' + ",\n    ".join(lines) + "\n  ]\n}\n"
    with open(out_path, "w", encoding="utf-8") as handle:
        handle.write(text)
    if problems:
        sys.exit(1)


if __name__ == "__main__":
    main(*sys.argv[1:6])
