import {CONTROLS,OPTIONS,assess,toMarkdown} from './assessment.mjs';
const $=id=>document.getElementById(id);
const sample={
 project:'Fictional CRM to invoice workflow',
 scenario:'A CRM notification creates a draft invoice in a sample accounting system',
 answers:{
  identity:'implemented',idempotency:'missing',retries:'implemented',
  schema:'tested',secrets:'tested',observability:'implemented',
  recovery:'unknown',evidence:'unknown'
 }
};
let current=null;
function text(tag,content,cls){
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 node.textContent=content;
 return node;
}
function renderQuestions(){
 const root=$('controls');root.replaceChildren();
 for(const [index,c] of CONTROLS.entries()){
  const card=document.createElement('div');card.className='control-card';
  const fieldset=document.createElement('fieldset');
  const legend=document.createElement('legend');
  const heading=document.createElement('div');heading.className='control-head';
  heading.append(text('span',String(index+1).padStart(2,'0')+' / 08','control-index'),
    text('span',c.group.toUpperCase(),'control-group'));
  legend.append(heading,text('h3',c.short));
  const question=text('p',c.prompt,'control-question');
  const detail=text('p',c.detail,'control-detail');
  const choices=document.createElement('div');choices.className='choices';
  for(const o of OPTIONS){
    const label=document.createElement('label');label.className='choice';
    const input=document.createElement('input');
    input.type='radio';input.name='answer-'+c.id;input.value=o.value;
    input.id='answer-'+c.id+'-'+o.value;
    input.checked=o.value==='unknown';
    input.addEventListener('change',()=>{updateProgress();invalidateReport();});
    const right=document.createElement('span');
    right.append(text('span',o.label,'choice-label'),text('span',o.description,'choice-help'));
    label.append(input,right);choices.append(label);
  }
  fieldset.append(legend,question,detail,choices);card.append(fieldset);root.append(card);
 }
 updateProgress();
}
function answers(){
 return Object.fromEntries(CONTROLS.map(c=>{
   const selected=document.querySelector('input[name="answer-'+c.id+'"]:checked');
   return [c.id,selected?.value??'unknown'];
 }));
}
function updateProgress(){
 const filled=Object.values(answers()).filter(v=>v!=='unknown').length;
 $('answered').textContent=filled+' / 8 controls answered';
 $('stateHint').textContent=filled===8?'All questions answered. Check your responses before generating.':
   filled===0?'Choose what you actually know, not what you hope is implemented.':
   'Unknown controls will be reported as gaps in evidence, not assumed missing.';
}
function setAnswers(data){
 $('project').value=data.project??'';
 $('scenario').value=data.scenario??'';
 for(const c of CONTROLS){
  const option=data.answers?.[c.id]??'unknown';
  const radio=$('answer-'+c.id+'-'+option);
  if(radio)radio.checked=true;
 }
 updateProgress();invalidateReport();
}
function invalidateReport(){
 current=null;$('results').hidden=true;
 $('copyStatus').textContent='';
}
function formatRisk(value){return value===null?'—':value+'/100';}
function renderReport(report){
 current=report;
 $('results').hidden=false;
 const s=report.summary;
 $('risk').textContent=formatRisk(s.riskIndex);
 $('coverage').textContent=s.coveragePct+'%';
 $('gaps').textContent=String(s.knownGaps);
 $('reviewCount').textContent=String(s.needTests+s.unknown);
 $('riskDetail').textContent=s.riskIndex===null?'Insufficient answers to score':'Higher means more self-reported exposure';
 $('reportStatus').textContent=s.riskIndex===null?'NEEDS MORE EVIDENCE':'SELF-REPORTED ONLY';
 $('reportStatus').className='status '+(s.riskIndex===null||s.knownGaps?'warning':'good');
 $('reportNote').textContent=s.riskIndex===null
  ?'This is not scored: fewer than 60% of weighted controls have a definite answer. Confirm unknown controls before interpreting risk. No real system has been tested.'
  :'This index is a transparent weighted summary of your responses, not independently verified security or compliance. '+s.tested+' of 8 controls are reported tested. '+s.knownGaps+' known gaps, '+s.needTests+' untested and '+s.unknown+' unknown.';
 const list=$('actions');list.replaceChildren();
 if(report.prioritizedActions.length===0){
  const li=document.createElement('li');li.className='action-card';
  li.append(text('span','SELF-REPORTED','action-tag'),text('p','All eight controls were reported tested. Independently inspect and reproduce the evidence before relying on the assessment.'));
  list.append(li);
 }else{
  for(const [index,a] of report.prioritizedActions.entries()){
   const li=document.createElement('li');li.className='action-card';
   const flag=text('div',String(index+1).padStart(2,'0')+' / '+a.priority,'action-tag '+a.priority);
   const body=document.createElement('div');
   body.append(text('h4',a.short+' · '+a.status),text('p',a.action),text('small','Verify with: '+a.validation));
   li.append(flag,body);list.append(li);
  }
 }
 $('copyStatus').textContent='';
 $('results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
function generate(){
 try{renderReport(assess({project:$('project').value,scenario:$('scenario').value||'API and workflow integration',answers:answers()}));}
 catch(e){
  $('stateHint').textContent=e.message;
  $('stateHint').setAttribute('role','alert');
 }
}
function download(content,name,type){
 const blob=new Blob([content],{type});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);
 a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function markdown(){
 if(!current)return;
 download(toMarkdown(current),'integration-reliability-self-assessment.md','text/markdown;charset=utf-8');
}
function json(){
 if(!current)return;
 download(JSON.stringify(current,null,2),'integration-reliability-self-assessment.json','application/json');
}
async function copy(){
 if(!current)return;
 const s=current.summary;
 const summary='Integration: '+current.scope.project+'\nSelf-reported exposure: '+
   (s.riskIndex===null?'not scored':s.riskIndex+'/100')+'\nCoverage: '+s.coveragePct+
   '%\nKnown gaps: '+s.knownGaps+'; untested: '+s.needTests+'; unknown: '+s.unknown+
   '\nTop next step: '+(current.prioritizedActions[0]?.action??'Independently verify self-reported test evidence.')+
   '\nOffline self-assessment; no independent security verification.';
 try{
   if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable in this context.');
   await navigator.clipboard.writeText(summary);
   $('copyStatus').textContent='Summary copied.';
 }catch{
   $('copyStatus').textContent='Clipboard not available. Download the Markdown brief instead.';
 }
}
$('sample').addEventListener('click',()=>setAnswers(sample));
$('clear').addEventListener('click',()=>setAnswers({project:'',scenario:'',answers:{}}));
$('project').addEventListener('input',invalidateReport);
$('scenario').addEventListener('input',invalidateReport);
$('generate').addEventListener('click',generate);
$('exportMarkdown').addEventListener('click',markdown);
$('exportJson').addEventListener('click',json);
$('copySummary').addEventListener('click',copy);
renderQuestions();
