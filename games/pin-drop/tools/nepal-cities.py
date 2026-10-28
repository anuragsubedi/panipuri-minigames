#!/usr/bin/env python3
"""Build Pin Drop's Nepal cities pack: every one of the 753 palikas.

Run by hand (not a build step), standard library only, after nepal-palikas.py:

    python3 games/pin-drop/tools/nepal-cities.py > games/pin-drop/data/packs/nepal-cities.json

Joins tools/nepal-palikas.json (survey + OSM points) with the hand-made
tools/nepal-cities-source.json (district HQs, spellings, famous towns) and
tools/fame.json (Wikipedia language editions per Wikidata id, from fetch-fame.py).

Tiers: metropolitan and sub-metropolitan cities and the hand list are 1;
district HQs, province capitals and towns with enough Wikipedia editions are 2;
every other municipality and all rural municipalities are 3 (Hard only).
A district HQ or alias is placed at its town (e.g. Salleri), named
"Salleri (Solududhkunda)"; rural municipalities are "X Rural Municipality".
A name used in more than one district gets the district added.
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TIER2_LINKS = 25  # Wikipedia language editions that make a municipality "well-known"


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as handle:
        return json.load(handle)


def main():
    source = load("nepal-cities-source.json")
    palikas = load("nepal-palikas.json")
    fame = load("fame.json") if os.path.exists(os.path.join(HERE, "fame.json")) else {}
    spell = lambda name: source["spelling"].get(name, name)
    tier1 = {tuple(x) for x in source["tier1"]}
    tier2 = {tuple(x) for x in source["tier2"]}
    hqs = {(palika, district) for district, (palika, _) in source["hq"].items()}
    districts_seen = set()
    places = []
    for p in palikas:
        key = (p["name"], p["district"])
        name = spell(p["name"])
        if p["type"] == "rural":
            name += " Rural Municipality"
        point = p
        if p.get("town"):
            name = f"{p['town']['name']} ({spell(p['name'])})"
            point = p["town"]
        links = fame.get(p.get("wikidata"), 0)
        if p["type"] in ("metropolitan", "sub-metropolitan") or key in tier1:
            tier = 1
        elif key in hqs or key in tier2 or links >= TIER2_LINKS:
            tier = 2
        else:
            tier = 3
        district = source["districts"].get(p["district"], p["district"])
        province = source["provinces"].get(p["province"], p["province"])
        districts_seen.add(district)
        place = {
            "name": name,
            "detail": f"{district}, {province}",
            "lat": round(point["lat"], 3),
            "lon": round(point["lon"], 3),
            "tier": tier,
            "region": province,
        }
        if p.get("wikidata"):
            place["wikidata"] = p["wikidata"]
        places.append(place)
    # Same name in two districts (e.g. four Madis): add the district so each is unique.
    counts = {}
    for place in places:
        counts[place["name"]] = counts.get(place["name"], 0) + 1
    for place in places:
        if counts[place["name"]] > 1:
            place["name"] += f" ({place['detail'].split(',')[0]})"
    missing_hq = [d for d, (palika, _) in source["hq"].items() if (palika, d) not in {(p["name"], p["district"]) for p in palikas}]
    if missing_hq or len(districts_seen) != 77:
        sys.exit(f"Expected 77 districts with HQs; missing HQ palikas for {missing_hq}, saw {len(districts_seen)} districts")
    places.sort(key=lambda p: (p["tier"], p["region"], p["name"]))
    head = {
        **source["pack"],
        "source": "Palikas: Survey Department of Nepal via OCHA HDX (CC BY 3.0 IGO); town points © OpenStreetMap contributors (ODbL)",
    }
    lines = [json.dumps(p, ensure_ascii=False) for p in places]
    sys.stdout.write(json.dumps(head, ensure_ascii=False, indent=2)[:-2] + ',\n  "places": [\n    ' + ",\n    ".join(lines) + "\n  ]\n}\n")
    counts = {t: sum(p["tier"] == t for p in places) for t in (1, 2, 3)}
    print(f"{len(places)} places, tiers {counts}", file=sys.stderr)


if __name__ == "__main__":
    main()
