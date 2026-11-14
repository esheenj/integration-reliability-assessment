#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {assess,toMarkdown} from './assessment.mjs';
const [file,flag]=process.argv.slice(2);
if(!file||!['--markdown',undefined].includes(flag)){
 console.error('Usage: node src/cli.mjs assessment.json [--markdown]');
 process.exitCode=1;
}else{
 try{
  const input=await readFile(file,'utf8');
  if(input.length>1048576)throw Error('Maximum input size is 1 MiB.');
  const report=assess(input);
  console.log(flag==='--markdown'?toMarkdown(report):JSON.stringify(report,null,2));
 }catch(e){console.error('Input error: '+e.message);process.exitCode=1;}
}
