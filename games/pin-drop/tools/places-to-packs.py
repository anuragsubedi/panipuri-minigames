#!/usr/bin/env python3
"""Build Pin Drop's "capitals" and "cities" packs from Natural Earth places.

Run by hand (not a build step), standard library only:

    python3 games/pin-drop/tools/places-to-packs.py \
        ne_50m_populated_places_simple.geojson ne_50m_admin_0_countries.geojson \
        games/pin-drop/data/packs

Sources (public domain): https://github.com/nvkelso/natural-earth-vector
Coordinates come straight from the data; the hand-made choices are the lists
below (which capital a country gets, names, fame tiers).
"""

import json
import os
import sys

SCORE_SCALE_KM = 1500

# Capitals: UN member states plus the Vatican. Left out: places whose capital
# or statehood is disputed, to keep the game neutral.
SKIP_COUNTRIES = {"ISR", "KOS", "SOL", "SAH", "TWN"}

# Countries with several capitals or a stale entry: the city we ask for.
CAPITAL_CHOICE = {
    "BEN": "Porto-Novo", "BOL": "Sucre", "CIV": "Yamoussoukro", "TZA": "Dodoma",
    "LKA": "Sri Jayawardenepura Kotte", "MMR": "Naypyidaw", "NLD": "Amsterdam",
    "MYS": "Kuala Lumpur", "SWZ": "Mbabane", "ZAF": "Pretoria", "JPN": "Tokyo",
    "CHL": "Santiago", "PHL": "Manila", "NGA": "Abuja", "MAR": "Rabat",
}

RENAME_PLACE = {
    "Nur-Sultan": "Astana", "København": "Copenhagen", "Bogota": "Bogotá",
    "Washington,  D.C.": "Washington, D.C.", "St.  Petersburg": "Saint Petersburg",
    "Shenyeng": "Shenyang", "Xian": "Xi'an", "Ōsaka": "Osaka",
}

RENAME_COUNTRY = {
    "Congo (Brazzaville)": "Republic of the Congo", "Congo (Kinshasa)": "DR Congo",
    "Guinea Bissau": "Guinea-Bissau", "United States of America": "United States",
    "eSwatini": "Eswatini", "Federated States of Micronesia": "Micronesia",
    "East Timor": "Timor-Leste", "Turkey": "Türkiye", "Ivory Coast": "Côte d'Ivoire",
    "Hong Kong S.A.R.": "China", "Hong Kong": "China", "The Bahamas": "Bahamas", "The Gambia": "Gambia",
}

# Natural Earth's continent, folded into six regions used to spread rounds out.
REGION_FIX = {"MDV": "Asia", "MUS": "Africa", "SYC": "Africa", "SSD": "Africa", "CYP": "Europe"}

# Fame tiers: 1 = most people could place it, 3 = for geography fans.
CAPITAL_TIER_1 = set(
    "USA CAN MEX BRA ARG CHL PER COL GBR FRA DEU ITA ESP PRT NLD BEL CHE AUT SWE NOR DNK FIN IRL "
    "GRC POL RUS UKR TUR EGY KEN ZAF NGA MAR ETH SAU ARE IRN IND PAK CHN JPN KOR THA VNM IDN PHL "
    "AUS NZL SGP CUB HUN CZE".split()
)
CAPITAL_TIER_2 = set(
    "ISL LUX MCO VAT JAM URY CRI PAN QAT KWT LBN MLT CYP EST LVA LTU SVN HRV BIH ALB MKD MNE MNG "
    "GEO ARM NAM BWA BHS FJI".split()
)
SMALL_COUNTRY_POP = 5_000_000

CITY_SKIP = {"Delhi", "Amaravati"}  # too close to New Delhi; bad population data
CITY_TIER_1 = {
    "Saint Petersburg", "Montréal", "Vancouver", "Ho Chi Minh City", "Kolkata", "Chennai",
    "Bengaluru", "Karachi", "Guangzhou", "Shenzhen", "Kyoto", "Seattle", "Houston", "Venice",
}
CITY_MIN_POP = 1_000_000
CITY_TIER_2_POP = 3_000_000


def load(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def regions_by_country(countries):
    regions = {}
    for feature in countries["features"]:
        p = feature["properties"]
        regions[p["ADM0_A3"]] = (REGION_FIX.get(p["ADM0_A3"]) or p["CONTINENT"], p["POP_EST"])
    return regions


def place(p, tier, region):
    return {
        "name": RENAME_PLACE.get(p["name"], p["name"]),
        "detail": RENAME_COUNTRY.get(p["adm0name"], p["adm0name"]),
        "lat": round(p["latitude"], 3),
        "lon": round(p["longitude"], 3),
        "tier": tier,
        "region": region,
    }


def region_of(code, regions):
    region = REGION_FIX.get(code) or regions.get(code, ("?", 0))[0]
    if region in ("Antarctica", "Seven seas (open ocean)", "?"):
        raise SystemExit(f"No region for {code}; add it to REGION_FIX")
    return region


def capitals(places, regions):
    by_country = {}
    for p in places:
        code = p["adm0_a3"]
        if not p["featurecla"].startswith("Admin-0 capital") or code in SKIP_COUNTRIES:
            continue
        wanted = CAPITAL_CHOICE.get(code)
        if wanted and p["name"] != wanted:
            continue
        if not wanted and p["featurecla"] != "Admin-0 capital":
            continue
        if code in by_country:
            raise SystemExit(f"Two capitals for {code}: add it to CAPITAL_CHOICE")
        by_country[code] = p
    out = []
    for code, p in by_country.items():
        pop = regions.get(code, (None, 0))[1]
        if code in CAPITAL_TIER_1:
            tier = 1
        elif code in CAPITAL_TIER_2 or pop >= SMALL_COUNTRY_POP:
            tier = 2
        else:
            tier = 3
        out.append(place(p, tier, region_of(code, regions)))
    return out, {p["name"] for p in by_country.values()}


def cities(places, regions, capital_names):
    candidates = [
        p for p in places
        if p["featurecla"] in ("Admin-1 capital", "Admin-1 region capital", "Populated place", "Admin-0 capital", "Admin-0 capital alt", "Admin-0 region capital")
        and p["name"] not in capital_names
        and p["name"] not in CITY_SKIP
        and (p["pop_max"] >= CITY_MIN_POP or p["worldcity"] > 0 or RENAME_PLACE.get(p["name"], p["name"]) in CITY_TIER_1)
    ]
    # Same name twice (e.g. two Hyderabads): keep the bigger one, so a clue without its country isn't ambiguous.
    best = {}
    for p in candidates:
        if p["name"] not in best or p["pop_max"] > best[p["name"]]["pop_max"]:
            best[p["name"]] = p
    out = []
    for p in best.values():
        name = RENAME_PLACE.get(p["name"], p["name"])
        if p["worldcity"] > 0 or name in CITY_TIER_1:
            tier = 1
        elif p["pop_max"] >= CITY_TIER_2_POP:
            tier = 2
        else:
            tier = 3
        out.append(place(p, tier, region_of(p["adm0_a3"], regions)))
    return out


def write(folder, pack):
    pack["places"].sort(key=lambda p: (p["tier"], p["name"]))
    # One place per line keeps diffs readable.
    head = {k: v for k, v in pack.items() if k != "places"}
    lines = [json.dumps(p, ensure_ascii=False) for p in pack["places"]]
    text = json.dumps(head, ensure_ascii=False, indent=2)[:-2] + ',\n  "places": [\n    ' + ",\n    ".join(lines) + "\n  ]\n}\n"
    with open(os.path.join(folder, f"{pack['id']}.json"), "w", encoding="utf-8") as handle:
        handle.write(text)


def main(places_path, countries_path, folder):
    places = [f["properties"] for f in load(places_path)["features"]]
    regions = regions_by_country(load(countries_path))
    caps, capital_names = capitals(places, regions)
    source = "Natural Earth (public domain)"
    common = {"map": "world", "scoreScaleKm": SCORE_SCALE_KM, "source": source}
    write(folder, {"id": "capitals", "name": "Capitals", **common, "places": caps})
    write(folder, {"id": "cities", "name": "Cities", **common, "places": cities(places, regions, capital_names)})


if __name__ == "__main__":
    main(*sys.argv[1:4])
