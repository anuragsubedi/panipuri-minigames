#!/usr/bin/env python3
"""Build Pin Drop's "landmarks" pack: coordinates from OpenStreetMap (Nominatim).

Run by hand (not a build step), standard library only, ~1 request per second
as Nominatim's usage policy asks:

    python3 games/pin-drop/tools/geocode-landmarks.py \
        games/pin-drop/tools/landmarks-source.json games/pin-drop/data/packs/landmarks.json

The source list holds what's hand-made: name, country label, fame tier,
region, ISO country codes (limits the search, so "Lalibela" can't match a
restaurant abroad) and an optional search text. Each place keeps its OSM id.
Data © OpenStreetMap contributors, ODbL 1.0.
"""

import json
import sys
import time
import urllib.parse
import urllib.request

ENDPOINT = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "panipuri-minigames/0.1 (https://github.com/anuragsubedi/panipuri-minigames)"
PAUSE_S = 1.1


def geocode(text, countries):
    query = urllib.parse.urlencode({"q": text, "countrycodes": countries, "format": "jsonv2", "limit": 1})
    request = urllib.request.Request(f"{ENDPOINT}?{query}", headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                hits = json.load(response)
            return hits[0] if hits else None
        except urllib.error.HTTPError as error:
            if error.code != 429:
                raise
            time.sleep(5 * (attempt + 1))
    raise SystemExit(f"Rate-limited on {text!r}; try again later")


def main(source_path, out_path):
    with open(source_path, encoding="utf-8") as handle:
        source = json.load(handle)
    places = []
    for item in source:
        hit = geocode(item.get("query", item["name"]), item["countries"])
        time.sleep(PAUSE_S)
        if not hit:
            raise SystemExit(f"No OSM match for {item['name']!r}; add a better 'query'")
        print(f"{item['name']}: {hit['display_name'][:70]}", file=sys.stderr)
        places.append({
            "name": item["name"],
            "detail": item["detail"],
            "lat": round(float(hit["lat"]), 3),
            "lon": round(float(hit["lon"]), 3),
            "tier": item["tier"],
            "region": item["region"],
            "osm": f"{hit['osm_type']}/{hit['osm_id']}",
        })
    places.sort(key=lambda p: (p["tier"], p["name"]))
    head = {
        "id": "landmarks",
        "name": "Landmarks",
        "map": "world",
        "scoreScaleKm": 1500,
        "source": "Hand-picked; coordinates © OpenStreetMap contributors (ODbL), via Nominatim",
    }
    lines = [json.dumps(p, ensure_ascii=False) for p in places]
    text = json.dumps(head, ensure_ascii=False, indent=2)[:-2] + ',\n  "places": [\n    ' + ",\n    ".join(lines) + "\n  ]\n}\n"
    with open(out_path, "w", encoding="utf-8") as handle:
        handle.write(text)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
