"""Build src/proposal.data.json for the Artifact Maximalism (proposed) tab."""
import json, time, urllib.request, urllib.parse
UA = {"User-Agent": "aerid-deck-viewer/1.0", "Accept": "application/json"}
P = json.load(open("src/proposal.json"))
known = {c["name"]: c for c in json.load(open("src/deck.json"))}
for r in json.load(open("src/revisions.data.json")):
    for c in r["added"]: known[c["name"]] = c
def get(url):
    time.sleep(0.12)
    try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA)))
    except Exception: return None
def card(j):
    fs = j.get("card_faces") if "image_uris" not in j else None
    faces = [f["image_uris"] for f in fs] if fs else [j["image_uris"]]
    return {"qty": 1, "name": j["name"], "commander": False, "type_line": j.get("type_line", ""), "mana_cost": j.get("mana_cost", ""),
            "faces": [{"normal": f["normal"], "large": f["large"], "png": f.get("png")} for f in faces], "uri": j["scryfall_uri"], "set": j["set"], "cn": j["collector_number"]}
def resolve(spec):
    if isinstance(spec, str): spec = {"name": spec}
    n = spec["name"]
    if "set" not in spec:
        m = known.get(n) or next((c for k, c in known.items() if k.startswith(n)), None)
        if m: return m
        j = get("https://api.scryfall.com/cards/named?fuzzy=" + urllib.parse.quote(n))
    else:
        j = get(f"https://api.scryfall.com/cards/{spec['set'].lower()}/{spec['cn']}")
    if j and j.get("name", "").lower().startswith(n.lower().split(",")[0]) : return card(j)
    print("NOT FOUND:", spec)
    return {"qty": 1, "name": n, "commander": False, "type_line": "", "mana_cost": "", "faces": [], "uri": "", "set": spec.get("set", ""), "cn": spec.get("cn", ""), "placeholder": True}
out = {**P, "phases": [{**ph, "swaps": [{"out": resolve(o), "in": resolve(i)} for o, i in ph["swaps"]]} for ph in P["phases"]]}
json.dump(out, open("src/proposal.data.json", "w"), indent=1)
