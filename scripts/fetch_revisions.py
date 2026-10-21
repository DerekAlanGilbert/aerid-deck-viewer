"""Resolve src/revisions.json card names via Scryfall -> src/revisions.data.json.
Reuses deck.json entries when the card is already in the deck. Run: python3 scripts/fetch_revisions.py"""
import json,time,urllib.request,urllib.parse,sys
H={'User-Agent':'ForgeDeckViewer/1.0','Accept':'application/json'}
deck={c['name']:c for c in json.load(open('src/deck.json'))}
cache={}
def card(e):
    # e is a card name, or {"name","set","cn"} to pin a specific printing
    n=e if isinstance(e,str) else e['name']
    pin=None if isinstance(e,str) else (e['set'].lower(),str(e['cn']))
    if n in deck and (not pin or (deck[n]['set'],deck[n]['cn'])==pin): return {**deck[n],'qty':1,'commander':False}
    key=(n,pin)
    if key in cache: return cache[key]
    url=(f"https://api.scryfall.com/cards/{pin[0]}/{urllib.parse.quote(pin[1])}" if pin else "https://api.scryfall.com/cards/named?exact="+urllib.parse.quote(n))
    time.sleep(0.1)
    d=json.load(urllib.request.urlopen(urllib.request.Request(url,headers=H)))
    if n not in (d['name'],d['name'].split(' // ')[0]): raise ValueError(f"printing {pin} is {d['name']}, not {n}")
    faces=d.get('card_faces') if 'image_uris' not in d else None
    imgs=[f['image_uris'] for f in faces] if faces else [d['image_uris']]
    cache[key]=dict(qty=1,name=d['name'],commander=False,type_line=(faces[0]['type_line'] if faces else d['type_line']),
      mana_cost=(faces[0].get('mana_cost') if faces else d.get('mana_cost','')),
      faces=[dict(normal=i['normal'],large=i['large'],png=i.get('png')) for i in imgs],uri=d['scryfall_uri'],set=d['set'],cn=d['collector_number'])
    return cache[key]
out=[];bad=[]
for r in json.load(open('src/revisions.json')):
    o={'name':r['name'],'removed':[],'added':[]}
    for k in ('removed','added'):
        for n in r[k]:
            try:o[k].append(card(n))
            except Exception as ex:bad.append((r['name'],n,str(ex)))
    out.append(o)
json.dump(out,open('src/revisions.data.json','w'),indent=1)
print(len(out),'revisions; failures:',bad)
sys.exit(1 if bad else 0)
