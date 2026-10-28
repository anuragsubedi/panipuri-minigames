#!/usr/bin/env python3
"""Promote landmarks that Wikidata shows are famous: a place's tier becomes the
better (lower) of its hand-set tier and its fame tier. Never demotes, because
Wikipedia language counts are a *global* signal and undersell places famous
mainly inside one country. Safe to run again.

    python3 games/pin-drop/tools/apply-fame.py games/pin-drop/data/packs/india-landmarks.json 60 30

Arguments: the pack, then the minimum Wikipedia language counts for tier 1 and tier 2.
Reads tools/fame.json (written by fetch-fame.py).
"""

import json
import os
import sys

FAME_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fame.json")


def main(pack_path, tier1, tier2):
    tier1, tier2 = int(tier1), int(tier2)
    with open(FAME_PATH, encoding="utf-8") as handle:
        fame = json.load(handle)
    with open(pack_path, encoding="utf-8") as handle:
        text = handle.read()
    pack = json.loads(text)
    promoted = []
    for place in pack["places"]:
        links = fame.get(place.get("wikidata"))
        if links is None:
            continue
        fame_tier = 1 if links >= tier1 else 2 if links >= tier2 else 3
        if fame_tier < place["tier"]:
            promoted.append(f"{place['name']} {place['tier']}→{fame_tier} ({links})")
            place["tier"] = fame_tier
    pack["places"].sort(key=lambda p: (p["tier"], p["name"]))
    head = {k: v for k, v in pack.items() if k != "places"}
    lines = [json.dumps(p, ensure_ascii=False) for p in pack["places"]]
    out = json.dumps(head, ensure_ascii=False, indent=2)[:-2] + ',\n  "places": [\n    ' + ",\n    ".join(lines) + "\n  ]\n}\n"
    with open(pack_path, "w", encoding="utf-8") as handle:
        handle.write(out)
    print("Promoted: " + (", ".join(promoted) or "none"))


if __name__ == "__main__":
    main(*sys.argv[1:4])
