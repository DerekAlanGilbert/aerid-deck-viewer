"""Resolve src/revisions.json card names via Scryfall -> src/revisions.data.json.
Reuses deck.json entries when the card is already in the deck. Run: python3 scripts/fetch_revisions.py"""
import json,time,urllib.request,urllib.parse,sys
H={'User-Agent':'ForgeDeckViewer/1.0','Accept':'application/json'}
deck={c['name']:c for c in json.load(open('src/deck.json'))}
cache={}
def card(n):
    if n in deck: return {**deck[n],'qty':1,'commander':False}
    if n in cache: return cache[n]
    time.sleep(0.1)
    d=json.load(urllib.request.urlopen(urllib.request.Request("https://api.scryfall.com/cards/named?exact="+urllib.parse.quote(n),headers=H)))
    faces=d.get('card_faces') if 'image_uris' not in d else None
    imgs=[f['image_uris'] for f in faces] if faces else [d['image_uris']]
    cache[n]=dict(qty=1,name=d['name'],commander=False,type_line=(faces[0]['type_line'] if faces else d['type_line']),
      mana_cost=(faces[0].get('mana_cost') if faces else d.get('mana_cost','')),
      faces=[dict(normal=i['normal'],large=i['large'],png=i.get('png')) for i in imgs],uri=d['scryfall_uri'],set=d['set'],cn=d['collector_number'])
    return cache[n]
out=[];bad=[]
for r in json.load(open('src/revisions.json')):
    o={'name':r['name'],'removed':[],'added':[]}
    for k in ('removed','added'):
        for n in r[k]:
            try:o[k].append(card(n))
            except Exception as e:bad.append((r['name'],n,str(e)))
    out.append(o)
json.dump(out,open('src/revisions.data.json','w'),indent=1)
print(len(out),'revisions; failures:',bad)
sys.exit(1 if bad else 0)
