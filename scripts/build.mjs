import {mkdir,rm,copyFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const path of ['index.html','style.css','app.mjs'])await copyFile('site/'+path,'dist/'+path);
await copyFile('src/assessment.mjs','dist/assessment.mjs');
console.log('Standalone offline assessment assembled at dist/');
