#!/usr/bin/env python3
"""List all 753 local levels (palikas) of Nepal with a point for each.

Run by hand (not a build step), standard library only. Resumable: it keeps
what it already has and only asks Nominatim (~1 request per second) for the rest.

    python3 games/pin-drop/tools/nepal-palikas.py npl_admin3.geojson npl_adminpoints.geojson \
        games/pin-drop/tools/nepal-cities-source.json

Sources:
- Survey Department of Nepal admin boundaries via OCHA HDX
  (https://data.humdata.org/dataset/cod-ab-npl, CC BY 3.0 IGO): name, type,
  district and province of each palika, and its polygon. The pcode's 7th digit
  is the type: 1 metropolitan, 2 sub-metropolitan, 3 municipality,
  4 rural municipality (5 = protected areas, not palikas; skipped).
- OpenStreetMap via Nominatim (ODbL): the town or village itself, which is
  where people think the place is, rather than the middle of its polygon.
  A hit only counts if it lies inside that palika; otherwise the survey's
  own label point is used. OSM's wikidata tag comes along (for fame tiers).

With the cities source file it also finds the towns named there (district
HQs like Salleri inside Solududhkunda, old names like Bhairahawa) inside their
palika, stored as `town`.

Writes tools/nepal-palikas.json, one palika per line.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "nepal-palikas.json")
ENDPOINT = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "panipuri-minigames/0.2 (https://github.com/anuragsubedi/panipuri-minigames)"
PAUSE_S = 1.1
TYPES = {"1": "metropolitan", "2": "sub-metropolitan", "3": "municipality", "4": "rural"}


def polygons(geometry):
    return [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]


def inside(lon, lat, geometry):
    hit = False
    for polygon in polygons(geometry):
        for ring in polygon:
            for (xi, yi), (xj, yj) in zip(ring, ring[1:] + ring[:1]):
                if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
                    hit = not hit
    return hit


def search(text):
    query = urllib.parse.urlencode({"q": text, "countrycodes": "np", "format": "jsonv2", "featureType": "settlement", "limit": 5, "extratags": 1})
    request = urllib.request.Request(f"{ENDPOINT}?{query}", headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except (urllib.error.HTTPError, urllib.error.URLError) as error:
            if getattr(error, "code", 429) not in (429, 500, 502, 503, 504):
                raise
            time.sleep(5 * (attempt + 1))
    raise SystemExit(f"Nominatim kept refusing on {text!r}; rerun later (progress is kept)")


def town_in(palika, geometry):
    """First OSM settlement node inside the palika, trying the bare name, then with the district."""
    for text in (palika["name"], f"{palika['name']}, {palika['district']}"):
        hits = search(text)
        time.sleep(PAUSE_S)
        for hit in hits:
            if hit["category"] == "place" and inside(float(hit["lon"]), float(hit["lat"]), geometry):
                return hit
    return None


def save(rows):
    rows = sorted(rows.values(), key=lambda r: r["pcode"])
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write("[\n" + ",\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n]\n")


def add_towns(rows, features, source_path):
    """Look up each named town inside its palika (bazaar names, district HQs)."""
    with open(source_path, encoding="utf-8") as handle:
        source = json.load(handle)
    wanted = [(palika, district, town) for district, (palika, town) in source["hq"].items() if town]
    wanted += [tuple(a) for a in source["aliases"]]
    by_name = {(r["name"], r["district"]): r for r in rows.values()}
    shapes = {f["properties"]["adm3_pcode"]: f["geometry"] for f in features}
    for palika, district, town in wanted:
        row = by_name.get((palika, district))
        if row is None:
            raise SystemExit(f"No palika {palika!r} in {district!r}; check the survey spelling")
        if row.get("town", {}).get("name") == town:
            continue
        found = None
        for text in (town, f"{town}, {district}"):
            for hit in search(text):
                if hit["category"] == "place" and inside(float(hit["lon"]), float(hit["lat"]), shapes[row["pcode"]]):
                    found = hit
                    break
            time.sleep(PAUSE_S)
            if found:
                break
        if not found:
            print(f"  town {town!r} not found inside {palika}; keeping the palika point", file=sys.stderr)
            row["town"] = {"name": town, "lat": row["lat"], "lon": row["lon"], "osm": None}
            continue
        row["town"] = {"name": town, "lat": round(float(found["lat"]), 4), "lon": round(float(found["lon"]), 4), "osm": f"{found['osm_type']}/{found['osm_id']}"}
        print(f"  {town} in {palika}: {row['town']['osm']}", file=sys.stderr)


def main(admin3_path, points_path, source_path=None):
    with open(admin3_path, encoding="utf-8") as handle:
        features = json.load(handle)["features"]
    with open(points_path, encoding="utf-8") as handle:
        labels = {f["properties"]["adm3_pcode"]: f["geometry"]["coordinates"] for f in json.load(handle)["features"] if f["properties"]["admin_level"] == 3}
    rows = {}
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as handle:
            rows = {r["pcode"]: r for r in json.load(handle)}
    todo = [f for f in features if f["properties"]["adm3_pcode"][6] in TYPES and f["properties"]["adm3_pcode"] not in rows]
    print(f"{len(rows)} kept, {len(todo)} to look up", file=sys.stderr)
    for n, feature in enumerate(todo, 1):
        p = feature["properties"]
        palika = {
            "pcode": p["adm3_pcode"],
            "name": p["adm3_name"],
            "type": TYPES[p["adm3_pcode"][6]],
            "district": p["adm2_name"],
            "province": p["adm1_name"],
        }
        hit = town_in(palika, feature["geometry"])
        if hit:
            palika.update(lat=round(float(hit["lat"]), 4), lon=round(float(hit["lon"]), 4), osm=f"{hit['osm_type']}/{hit['osm_id']}")
            wikidata = (hit.get("extratags") or {}).get("wikidata")
            if wikidata:
                palika["wikidata"] = wikidata
        else:
            lon, lat = labels[palika["pcode"]]
            palika.update(lat=round(lat, 4), lon=round(lon, 4), osm=None)
        rows[palika["pcode"]] = palika
        print(f"{n}/{len(todo)} {palika['name']} ({palika['district']}): {palika['osm'] or 'survey label point'}", file=sys.stderr)
        if n % 25 == 0:
            save(rows)
    if source_path:
        add_towns(rows, features, source_path)
    save(rows)


if __name__ == "__main__":
    main(*sys.argv[1:4])
