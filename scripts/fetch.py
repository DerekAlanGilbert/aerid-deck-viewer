import json,re,time,urllib.request,urllib.parse,xml.etree.ElementTree as ET
lines=open('/workspace/cock/Aerid_moxfield.txt').read().splitlines()
sec=None;deck=[]
for l in lines:
    l=l.strip()
    if not l: continue
    m=re.match(r'(\d+)\s+(.+)',l)
    if not m: sec=l;continue
    n=re.sub(r'\s+\([A-Z0-9]+\)\s+\S+$','',m[2]).strip()
    deck.append((int(m[1]),n,sec=='Commander'))
root=ET.parse('/workspace/cock/Aerid_new.cod').getroot()
pr={}
for c in root.iter('card'):
    pr.setdefault(c.get('name'),(c.get('setShortName'),c.get('collectorNumber')))
H={'User-Agent':'ForgeDeckViewer/1.0','Accept':'application/json'}
def get(u):
    time.sleep(0.1);return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=H)))
out=[];fb=[]
for q,n,cmd in deck:
    p=pr.get(n) or pr.get(n.split(' // ')[0]);d=None
    if p:
        try:d=get(f"https://api.scryfall.com/cards/{p[0].lower()}/{urllib.parse.quote(p[1])}")
        except Exception as e:pass
    if not d:
        fb.append(n);d=get("https://api.scryfall.com/cards/named?exact="+urllib.parse.quote(n))
    faces=d.get('card_faces') if 'image_uris' not in d else None
    imgs=[f['image_uris'] for f in faces] if faces else [d['image_uris']]
    out.append(dict(qty=q,name=d['name'],commander=cmd,type_line=(faces[0]['type_line'] if faces else d['type_line']),
      mana_cost=(faces[0].get('mana_cost') if faces else d.get('mana_cost','')),
      faces=[dict(normal=i['normal'],large=i['large'],png=i.get('png')) for i in imgs],uri=d['scryfall_uri'],set=d['set'],cn=d['collector_number']))
json.dump(out,open('src/deck.json','w'),indent=1)
print(sum(c['qty'] for c in out),'cards; commander:',[c['name'] for c in out if c['commander']],'fallbacks:',fb)
