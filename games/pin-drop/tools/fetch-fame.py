#!/usr/bin/env python3
"""Count how many Wikipedia language editions cover each place: a simple,
neutral "how famous is it" signal used to set fame tiers.

One command, no options, standard library only:

    python3 games/pin-drop/tools/fetch-fame.py

Reads every `wikidata` id in games/pin-drop/data/packs/*.json, asks the
Wikidata query service in batches, and writes tools/fame.json
({"Q9141": 191, ...}). Wikidata is CC0: no credit needed.
"""

import glob
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PACKS = os.path.join(HERE, "..", "data", "packs", "*.json")
OUT = os.path.join(HERE, "fame.json")
ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "panipuri-minigames/0.1 (https://github.com/anuragsubedi/panipuri-minigames)"
BATCH = 200


def ask(ids):
    values = " ".join(f"wd:{q}" for q in ids)
    query = f"SELECT ?item ?links WHERE {{ VALUES ?item {{ {values} }} ?item wikibase:sitelinks ?links }}"
    request = urllib.request.Request(
        f"{ENDPOINT}?{urllib.parse.urlencode({'query': query})}",
        headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
    )
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                rows = json.load(response)["results"]["bindings"]
            return {row["item"]["value"].rsplit("/", 1)[1]: int(row["links"]["value"]) for row in rows}
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504):
                raise
            wait = 10 * (attempt + 1)
            print(f"  Wikidata says slow down; waiting {wait}s…")
            time.sleep(wait)
    sys.exit("Wikidata kept refusing. Nothing was changed; try again in a few minutes.")


def main():
    ids = set()
    for path in glob.glob(PACKS):
        with open(path, encoding="utf-8") as handle:
            ids |= {p["wikidata"] for p in json.load(handle)["places"] if p.get("wikidata")}
    ids = sorted(ids)
    print(f"Looking up {len(ids)} places on Wikidata…")
    fame = {}
    for i in range(0, len(ids), BATCH):
        fame.update(ask(ids[i : i + BATCH]))
        print(f"  {min(i + BATCH, len(ids))} / {len(ids)}")
        time.sleep(2)
    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(dict(sorted(fame.items())), handle, indent=0)
        handle.write("\n")
    print(f"Done: wrote {os.path.relpath(OUT)}. To save it:")
    print("  git add games/pin-drop/tools/fame.json && git commit -m 'Update fame counts' && git push")


if __name__ == "__main__":
    main()
