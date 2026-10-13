const fs=require('fs');
const {chromium}=require('C:/Users/jiong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({headless:true,channel:'msedge'});
 const p=await b.newPage();await p.goto('http://127.0.0.1:8765/');
 const data=await p.evaluate(()=>{
  MiliLocale.apply('en');MiliLocale.applyDOM=()=>{};render();
  const texts=new Set(),codes=[];
  const original=codeBlock;codeBlock=function(text,method){codes.push(text);return original(text,method)};
  const collect=root=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())if(!node.parentElement.closest('code,pre,script,style,select,.enum-values')){const s=node.nodeValue.trim();if(/[a-zA-Z]{2}/.test(s))texts.add(s)};for(const el of root.querySelectorAll('[title],[aria-label],[placeholder]'))for(const a of ['title','aria-label','placeholder'])if(el.hasAttribute(a))texts.add(el.getAttribute(a));};
  collect(document.body);
  const root=document.createElement('div');
  for(const item of API.functions){root.innerHTML=referenceContent('example-'+item.owner+'-'+item.name).html;collect(root);for(const param of item.params.filter(x=>/^function/.test(x.type))){root.innerHTML=callbackGuide(item);collect(root)}}
  for(const item of API.types){root.innerHTML=referenceContent('type-'+item.name)?.html||'';collect(root)}
  codes.push(...[...document.querySelectorAll('pre code')].map(x=>x.textContent));
  const protectedStrings=new Set();
  for(const code of codes)for(const m of code.matchAll(/(?:GetChild|FindChild|FindClientUIRoot|GetParam|GetGlobalCustomVariableValue|SetGlobalCustomVariableValue|Register\w*|Unregister\w*|SendSignal)\s*\([^\n]*?["']([^"']+)["']/g))protectedStrings.add(m[1]);
  const comments=new Set(),strings=new Set();
  for(const code of codes)for(const m of code.matchAll(/--[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g)){if(m[0].startsWith('--'))comments.add(m[0].slice(2).trim());else{const s=m[0].slice(1,-1);if(/[a-zA-Z]{2}/.test(s)&&!protectedStrings.has(s))strings.add(s)}}
  const identifiers=new Set(['Lua','Miliastra','Wonderland','Tween','TextBox','Image','ContainerControl','CursorEventData','UI','API','ScoreChanged','Score','Speed',...protectedStrings]);
  for(const group of [API.functions,API.properties,API.types,API.enums])for(const item of group){identifiers.add(item.name);if(item.owner)identifiers.add(item.owner);for(const p of item.params||[])identifiers.add(p.name);for(const v of item.values||[])identifiers.add(v)}
  return {texts:[...texts],comments:[...comments],strings:[...strings],protectedStrings:[...protectedStrings],identifiers:[...identifiers]};
 });fs.writeFileSync('tmp/localization-source.json',JSON.stringify(data,null,2));console.log(Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length])));await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
