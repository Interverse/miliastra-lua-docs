"""Build offline prose catalogs from the extracted public documentation.

Run scripts/collect-localization.cjs first. No translation service is used by the site.
"""
import concurrent.futures, json, pathlib, re, sys, time, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
source = json.loads((ROOT / 'tmp/localization-source.json').read_text(encoding='utf-8'))
extra = ['Method arguments', 'Easing preview', 'Explore easing curves', 'Curve', 'Elapsed time',
         'Standard illustrative curve; game behavior may vary.',
         'Easing progress plotted against elapsed time',
         'Translated editor terms may differ in game.']
texts = list(dict.fromkeys(source['texts'] + source['comments'] + source['strings'] + extra))
identifiers = sorted([x for x in source['identifiers'] + ['MiliLua'] if re.search(r'[A-Z_.]', x)], key=len, reverse=True)
pattern = re.compile(r'(?<!\w)(?:' + '|'.join(map(re.escape, identifiers)) + r')(?!\w)')
targets = {'zhs':'zh-CN','zht':'zh-TW','ja':'ja','ko':'ko','es':'es','fr':'fr','ru':'ru',
           'th':'th','vi':'vi','de':'de','id':'id','pt':'pt','tr':'tr','it':'it'}
directory = ROOT / 'tmp/locale-cache'
directory.mkdir(exist_ok=True)
existing_file=ROOT/'locale-content.js'
existing=json.loads(existing_file.read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';')) if existing_file.exists() else {'catalogs':{}}

def prepare(text):
    if text in source['strings']:return text, []
    protected=[]
    def replace(match):
        protected.append(match[0]); return f'987654321{len(protected)-1:04d}123456789'
    return pattern.sub(replace,text), protected

def translate_batch(entries, target):
    prepared=[prepare(s) for s in entries]
    query='\n'.join(f'123456789{i:04d}987654321\n{s[0]}' for i,s in enumerate(prepared))
    url='https://translate.googleapis.com/translate_a/single?' + urllib.parse.urlencode(
        {'client':'gtx','sl':'en','tl':target,'dt':'t','q':query})
    for attempt in range(4):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(req,timeout=35) as response:
                result=json.load(response)
            translated=''.join(item[0] for item in result[0] if item[0])
            pieces=re.split(r'123456789\d{4}987654321\s*',translated)[1:]
            if len(pieces)!=len(entries): raise ValueError('Translation boundary mismatch')
            output={}
            for original,part,(_,protected) in zip(entries,pieces,prepared):
                for i,identifier in enumerate(protected):
                    part,count=re.subn(rf'987654321{i:04d}123456789',lambda _:identifier,part)
                    if count!=1: raise ValueError('API identifier placeholder mismatch')
                if re.search(r'987654321\d{4}123456789|123456789\d{4}987654321',part):raise ValueError('Unresolved placeholder')
                output[original]=part.strip()
            return output
        except Exception:
            if attempt==3:
                if len(entries)>1:
                    midpoint=len(entries)//2
                    return translate_batch(entries[:midpoint],target)|translate_batch(entries[midpoint:],target)
                raise
            time.sleep(1+attempt)

def translate_single(text, target):
    prepared,protected=prepare(text)
    url='https://translate.googleapis.com/translate_a/single?' + urllib.parse.urlencode(
        {'client':'gtx','sl':'en','tl':target,'dt':'t','q':prepared})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url,timeout=35) as response:result=json.load(response)
            translated=''.join(item[0] for item in result[0] if item[0])
            for i,identifier in enumerate(protected):
                translated,count=re.subn(rf'987654321{i:04d}123456789',lambda _:identifier,translated)
                if count!=1:raise ValueError('API identifier placeholder mismatch')
            return translated.strip()
        except Exception:
            if attempt==3:raise
            time.sleep(1+attempt)

def language(code,target):
    cache=directory/f'{code}.json'
    catalog=existing['catalogs'].get(code,{}) | (json.loads(cache.read_text(encoding='utf-8')) if cache.exists() else {})
    missing=[text for text in texts if text not in catalog]
    batches=[];batch=[];size=0
    for text in missing:
        length=len(prepare(text)[0].encode('utf-8'))+30
        if batch and size+length>2800:batches.append(batch);batch=[];size=0
        batch.append(text);size+=length
    if batch:batches.append(batch)
    for i,batch in enumerate(batches):
        catalog.update(translate_batch(batch,target))
        cache.write_text(json.dumps(catalog,ensure_ascii=False),encoding='utf-8')
        if i%10==0:print(f'{code}: {i+1}/{len(batches)} batches',flush=True)
    # Some short paragraphs are passed through by batch translation. Retry them
    # individually; native names and one-word technical terms stay untouched.
    unchanged=[text for text in texts if catalog.get(text)==text and ' ' in text
               and re.search(r'\b[a-z]{3,}\b',text)]
    for text in unchanged:catalog[text]=translate_single(text,target)
    cache.write_text(json.dumps(catalog,ensure_ascii=False),encoding='utf-8')
    print(f'{code}: complete ({len(catalog)} entries)',flush=True)
    return code,catalog

if '--offline' in sys.argv:
    catalogs={code:existing['catalogs'].get(code,{}) | (json.loads((directory/f'{code}.json').read_text(encoding='utf-8')) if (directory/f'{code}.json').exists() else {}) for code in targets}
else:
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        catalogs=dict(pool.map(lambda pair:language(*pair),targets.items()))
overrides=json.loads((ROOT/'locale-overrides.json').read_text(encoding='utf-8'))
terms=json.loads((ROOT/'locale-terms.json').read_text(encoding='utf-8'))
for code,catalog in catalogs.items():
    catalog.update(overrides.get(code,{}))
    top,global_script,script_word,textbox=terms[code]
    previous=re.split(r'\s*>\s*OnInit\s*[-—]\s*',catalog.get('Top Level Code > OnInit - Global Script',''))
    for source_text,translated in list(catalog.items()):
        if 'Top Level Code' in source_text and len(previous)==2:
            translated=translated.replace(previous[0],top)
        if 'Global Script' in source_text:
            if len(previous)==2:translated=translated.replace(previous[1],global_script)
            translated=re.sub(r'\bScript\b',script_word,translated)
        catalog[source_text]=translated
    catalog['Top Level Code']=top
    catalog['Global Script']=global_script
    catalog['TextBox comment label']=textbox
    missing=set(texts)-catalog.keys()
    if missing:raise ValueError(f'{code}: {len(missing)} untranslated source entries')
payload={'catalogs':catalogs,'protectedStrings':source['protectedStrings']}
(ROOT/'locale-content.js').write_text('// Locally stored documentation translations; API identifiers are preserved.\n'
    +'window.MiliLocaleContent='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Wrote offline localization catalogs.',flush=True)
