import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const api=JSON.parse(fs.readFileSync(path.join(root,'app.js'),'utf8').split('\n')[0].replace(/^const API=/,'').trim().replace(/;$/,''));
const file=path.join(root,'share-ids.js');
// Append only: published numbers must never change, even when entries disappear.
const ids=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8').split('=',2)[1].trim().replace(/;$/,'')):[];
const current=[
 ...api.functions.map(x=>'example-'+x.owner+'-'+x.name),
 ...api.functions.map(x=>x.owner+'-'+x.name),
 ...api.types.filter(x=>x.kind!=='editor-alias'&&!/^Enum(?:Item)?\./.test(x.name)).map(x=>'type-'+x.name),
 ...api.properties.map(x=>'property-'+x.owner+'-'+x.name),
 ...api.enums.map(x=>'enum-'+x.name),
 ...(api.guides||[]).map(x=>x.id),
 ...api.functions.flatMap(x=>x.params.filter(p=>/^function\b/.test(p.type)).map(p=>'callback-guide-'+x.owner+'-'+x.name+'-'+p.name))
];
for(const id of current)if(!ids.includes(id))ids.push(id);
fs.writeFileSync(file,'// Append-only identifiers for version 1 share links. Never reorder or remove.\nwindow.MiliShareIds='+JSON.stringify(ids)+';\n');
