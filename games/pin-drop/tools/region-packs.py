#!/usr/bin/env python3
"""Build a region's "capitals" and "cities" packs from Natural Earth 1:10m places.

Run by hand (not a build step), standard library only:

    python3 games/pin-drop/tools/region-packs.py india ne_10m_populated_places.geojson games/pin-drop/data/packs

Source (public domain): https://github.com/nvkelso/natural-earth-vector
Fame tiers come from `tools/fame.json` (Wikipedia language editions per
Wikidata id, written by fetch-fame.py). Without it every city is tier 2;
run this, then fetch-fame.py, then this again.
"""

import json
import os
import sys

FAME_PATH = os.path.join(os.path.dirname(__file__), "fame.json")

REGIONS = {
    "india": {
        "country": "IND",
        "map": "india",
        "scoreScaleKm": 250,
        # Natural Earth spellings → current names.
        "rename_state": {
            "Orissa": "Odisha", "Uttaranchal": "Uttarakhand",
            "Dadra and Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
        },
        "rename_place": {
            "Simla": "Shimla", "Dehra Dun": "Dehradun", "Bangalore": "Bengaluru", "Allahabad": "Prayagraj",
            "Vishakhapatnam": "Visakhapatnam", "Nasik": "Nashik", "Jullundur": "Jalandhar", "Sholapur": "Solapur",
            "Gurgaon": "Gurugram", "Haora": "Howrah", "Barddhaman": "Bardhaman", "Raurkela": "Rourkela",
            "Baramula": "Baramulla", "Faizabad": "Ayodhya",
        },
        # Same name twice (keep the more famous one), renamed since the data was made.
        "rename_by_state": {("Aurangabad", "Maharashtra"): "Chhatrapati Sambhajinagar"},
        # One capital per state/UT. Chandigarh serves three; Daman is the merged UT's capital.
        "capitals": {
            "Port Blair": "Andaman and Nicobar", "Amaravati": "Andhra Pradesh", "Itanagar": "Arunachal Pradesh",
            "Dispur": "Assam", "Patna": "Bihar", "Chandigarh": "Punjab & Haryana", "Raipur": "Chhattisgarh",
            "Daman": "Dadra and Nagar Haveli and Daman and Diu", "Gandhinagar": "Gujarat", "New Delhi": "Delhi",
            "Panaji": "Goa", "Simla": "Himachal Pradesh", "Srinagar": "Jammu and Kashmir", "Ranchi": "Jharkhand",
            "Bengaluru": "Karnataka", "Thiruvananthapuram": "Kerala", "Leh": "Ladakh", "Kavaratti": "Lakshadweep",
            "Bhopal": "Madhya Pradesh", "Mumbai": "Maharashtra", "Imphal": "Manipur", "Shillong": "Meghalaya",
            "Aizawl": "Mizoram", "Kohima": "Nagaland", "Bhubaneswar": "Odisha", "Puducherry": "Puducherry",
            "Jaipur": "Rajasthan", "Gangtok": "Sikkim", "Chennai": "Tamil Nadu", "Hyderabad": "Telangana",
            "Agartala": "Tripura", "Lucknow": "Uttar Pradesh", "Dehra Dun": "Uttarakhand", "Kolkata": "West Bengal",
        },
        # Spread rounds across the country, not just across the Gangetic plain.
        "zones": {
            "North": ["Jammu and Kashmir", "Ladakh", "Himachal Pradesh", "Punjab", "Punjab & Haryana", "Haryana",
                      "Chandigarh", "Delhi", "Uttarakhand", "Uttar Pradesh"],
            "Central": ["Madhya Pradesh", "Chhattisgarh"],
            "West": ["Rajasthan", "Gujarat", "Maharashtra", "Goa", "Dadra and Nagar Haveli and Daman and Diu"],
            "South": ["Karnataka", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Puducherry",
                      "Lakshadweep", "Andaman and Nicobar"],
            "East": ["Bihar", "Jharkhand", "West Bengal", "Odisha"],
            "Northeast": ["Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
                          "Tripura", "Sikkim"],
        },
        # Wikipedia language editions: ≥ tier1 → 1, ≥ tier2 → 2, ≥ keep → 3, else dropped.
        "city_fame": {"tier1": 90, "tier2": 45, "keep": 35},
        "capital_fame": {"tier1": 100, "tier2": 60},
        # Amaravati: bad population data, already a capital. Delhi: on top of New Delhi.
        # Aurangabad (Bihar): its name now belongs to the Maharashtra city's old name only.
        "city_skip": {"Amaravati", "Delhi", ("Aurangabad", "Bihar")},
    },
}


def load(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def write(folder, pack):
    pack["places"].sort(key=lambda p: (p["tier"], p["name"]))
    head = {k: v for k, v in pack.items() if k != "places"}
    lines = [json.dumps(p, ensure_ascii=False) for p in pack["places"]]
    text = json.dumps(head, ensure_ascii=False, indent=2)[:-2] + ',\n  "places": [\n    ' + ",\n    ".join(lines) + "\n  ]\n}\n"
    with open(os.path.join(folder, f"{pack['id']}.json"), "w", encoding="utf-8") as handle:
        handle.write(text)


def main(region_id, places_path, folder):
    r = REGIONS[region_id]
    fame = load(FAME_PATH) if os.path.exists(FAME_PATH) else {}
    zone_of = {state: zone for zone, states in r["zones"].items() for state in states}
    places = [f["properties"] for f in load(places_path)["features"] if f["properties"]["ADM0_A3"] == r["country"]]

    def entry(p, detail, tier):
        qid = p.get("WIKIDATAID")
        name = r.get("rename_by_state", {}).get((p["NAME"], detail)) or r["rename_place"].get(p["NAME"], p["NAME"])
        out = {
            "name": name,
            "detail": detail,
            "lat": round(p["LATITUDE"], 3),
            "lon": round(p["LONGITUDE"], 3),
            "tier": tier,
            "region": zone_of[detail],
        }
        if qid:
            out["wikidata"] = qid
        return out

    def tier_for(p, thresholds, default):
        links = fame.get(p.get("WIKIDATAID"))
        if links is None:
            return default
        if links >= thresholds["tier1"]:
            return 1
        if links >= thresholds["tier2"]:
            return 2
        return 3 if links >= thresholds.get("keep", 0) else None

    capitals, capital_names = [], set()
    for p in places:
        state = r["capitals"].get(p["NAME"])
        if state and p["NAME"] not in capital_names:
            capital_names.add(p["NAME"])
            capitals.append(entry(p, state, tier_for(p, r["capital_fame"], 2) or 3))
    missing = set(r["capitals"]) - capital_names
    if missing:
        raise SystemExit(f"Capitals not found in Natural Earth: {sorted(missing)}")

    cities = []
    for p in places:
        state = r["rename_state"].get(p["ADM1NAME"], p["ADM1NAME"])
        if p["NAME"] in capital_names or p["NAME"] in r["city_skip"] or (p["NAME"], state) in r["city_skip"]:
            continue
        if state not in zone_of:
            raise SystemExit(f"No zone for state {state!r} ({p['NAME']})")
        tier = tier_for(p, r["city_fame"], 2)
        if tier:
            cities.append(entry(p, state, tier))

    source = "Natural Earth (public domain); fame tiers from Wikidata (CC0)"
    common = {"map": r["map"], "scoreScaleKm": r["scoreScaleKm"], "source": source}
    write(folder, {"id": f"{region_id}-capitals", "name": "State capitals", **common, "places": capitals})
    write(folder, {"id": f"{region_id}-cities", "name": "Cities", **common, "places": cities})
    print(f"{len(capitals)} capitals, {len(cities)} cities", file=sys.stderr)


if __name__ == "__main__":
    main(*sys.argv[1:4])
