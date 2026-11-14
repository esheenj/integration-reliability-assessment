// Esheen Labs Integration Reliability Assessment v0.1.
// Original, deterministic SELF-REPORTED decision support. Never a certification.
export const CONTROLS = Object.freeze([
 {id:'identity', weight:5, group:'Access & trust',
  short:'Verify the sender', prompt:'Can the receiving service verify who sent each request before acting?',
  detail:'Signed webhooks, service identity or other authenticated channel',
  checks:'Capture a synthetic invalid-signature case; check rejection before business-side effects.',
  failure:'A spoofed or misrouted request may be accepted.',
  action:'Verify the request at the trust boundary and reject untrusted requests before parsing them into business actions.'},
 {id:'idempotency', weight:5, group:'Delivery integrity',
  short:'Prevent duplicate effects', prompt:'Are duplicate deliveries prevented from creating duplicate business actions?',
  detail:'Durable keys, atomic acceptance and a documented retention policy',
  checks:'Replay the same synthetic event while pending, after completion and after key expiry.',
  failure:'Retries may create repeated orders, notifications or data changes.',
  action:'Add tenant-scoped durable idempotency keys and atomic admission/replay state.'},
 {id:'retries', weight:4, group:'Delivery integrity',
  short:'Handle failures and retries', prompt:'Are timeouts, 429/5xx responses and delayed retries handled deliberately?',
  detail:'Backoff, budgets, dead-letter or recovery path, and documented timeouts',
  checks:'Simulate a timeout, rate limit and repeated failure; prove bounded recovery.',
  failure:'Transient failures may produce lost work or retry storms.',
  action:'Define retryable statuses, exponential backoff with jitter, hard limits and failure routing.'},
 {id:'schema', weight:4, group:'Change management',
  short:'Protect interface contracts', prompt:'Can a changed CRM, webhook or AI-tool schema be detected before release?',
  detail:'Versioned contracts and checks for required fields, enums and incompatible changes',
  checks:'Remove a known input field or change its type in a test fixture; ensure CI catches it.',
  failure:'Contract drift can silently break connected systems.',
  action:'Store versioned example payloads and run a schema-diff gate in CI.'},
 {id:'secrets', weight:4, group:'Access & trust',
  short:'Restrict credentials', prompt:'Are integration credentials scoped, rotated and kept out of logs and public code?',
  detail:'Least privilege, secret storage, rotation and redacted observability',
  checks:'Inspect a synthetic log and a test credential rotation; verify no token exposure.',
  failure:'Credential leakage can expose connected accounts.',
  action:'Review access scopes, use managed secret storage, rotate keys and redact sensitive telemetry.'},
 {id:'observability', weight:3, group:'Operations',
  short:'Trace every outcome', prompt:'Can a failed integration request be traced from receipt to final outcome?',
  detail:'Correlation IDs, structured failure reasons and alerts with owners',
  checks:'Choose a synthetic request ID; reconstruct its outcome without seeing private payloads.',
  failure:'Failures can remain invisible or difficult to diagnose.',
  action:'Log correlated delivery states and alert on failure rates without storing sensitive payloads.'},
 {id:'recovery', weight:5, group:'Operations',
  short:'Reconcile lost work', prompt:'Is there an owned process to detect and recover incomplete or mismatched transactions?',
  detail:'Reconciliation, durable queue/ledger and manual repair with replay safeguards',
  checks:'Interrupt a synthetic operation mid-flight; prove duplicate-safe reconciliation.',
  failure:'A handler can acknowledge work that was never completed.',
  action:'Add durable state transitions, reconciliation queries and a tested repair workflow.'},
 {id:'evidence', weight:3, group:'Change management',
  short:'Ground AI and data decisions', prompt:'Are automated decisions and important claims linked to inspectable inputs and source versions?',
  detail:'Versioned context, links to approved sources and decision receipts',
  checks:'Trace a fictional decision to its input version, source IDs and relevant evidence.',
  failure:'Incorrect or outdated evidence can be hard to detect after the fact.',
  action:'Record input and source versions, cite evidence, and mark unknown or unverified claims.'}
]);
export const OPTIONS=Object.freeze([
 {value:'tested',label:'Implemented and tested',description:'Evidence or repeatable checks exist'},
 {value:'implemented',label:'Implemented, not tested',description:'Control exists but has not been demonstrated'},
 {value:'missing',label:'Not implemented',description:'Known gap in this integration'},
 {value:'unknown',label:'Not sure / no evidence',description:'Needs discovery before a reliable assessment'}
]);
const validAnswers=new Set(OPTIONS.map(o=>o.value));
const validIds=new Set(CONTROLS.map(c=>c.id));
function safeText(value,label,max=100){
 if(typeof value!=='string'||value.length>max||/[\u0000-\u001F\u007F]/.test(value))
   throw new Error(label+' must be a string of at most '+max+' printable characters.');
 return value.trim();
}
export function normalizeAssessment(data){
 if(!data||typeof data!=='object'||Array.isArray(data))
   throw new Error('Expected a JSON assessment object.');
 const project=safeText(data.project??'', 'project',80);
 const scenario=safeText(data.scenario??'API and workflow integration', 'scenario',100);
 if(!data.answers||typeof data.answers!=='object'||Array.isArray(data.answers))
   throw new Error('answers must be an object with eight named controls.');
 for(const key of Object.keys(data.answers)){
   if(!validIds.has(key))throw new Error('Unsupported control ID: '+key);
 }
 const answers={};
 for(const control of CONTROLS){
   const value=data.answers[control.id]??'unknown';
   if(!validAnswers.has(value))
     throw new Error('Invalid selection for '+control.id+'. Choose tested, implemented, missing or unknown.');
   answers[control.id]=value;
 }
 return {project,scenario,answers};
}
const riskFraction={tested:0,implemented:0.5,missing:1,unknown:null};
const outcomeFor=(answer)=>{
 if(answer==='missing')return {priority:'HIGH',code:'KNOWN_GAP',word:'Missing control'};
 if(answer==='implemented')return {priority:'MEDIUM',code:'UNTESTED_CONTROL',word:'Evidence needed'};
 if(answer==='unknown')return {priority:'REVIEW',code:'UNKNOWN_CONTROL',word:'Unassessed'};
 return {priority:'LOW',code:'SELF_REPORTED_TEST',word:'Self-reported test'};
};
const priorityOrder={HIGH:0,REVIEW:1,MEDIUM:2,LOW:3};
function clamp(n){return Math.max(0,Math.min(100,Math.round(n)));}
export function assess(input){
 const data=typeof input==='string'?JSON.parse(input):input;
 const {project,scenario,answers}=normalizeAssessment(data);
 const totalWeight=CONTROLS.reduce((a,c)=>a+c.weight,0);
 let knownWeight=0,weightedRisk=0;
 const items=CONTROLS.map(c=>{
   const answer=answers[c.id],ratio=riskFraction[answer],impact=outcomeFor(answer);
   if(ratio!==null){knownWeight+=c.weight;weightedRisk+=ratio*c.weight;}
   return {id:c.id,short:c.short,group:c.group,answer,weight:c.weight,
     priority:impact.priority,code:impact.code,status:impact.word,
     problem:c.failure,action:c.action,validation:c.checks,
     priorityScore:ratio===null?c.weight*0.85:ratio*c.weight};
 });
 const coveragePct=clamp(knownWeight/totalWeight*100);
 const confidence=coveragePct===100?'FULLY_ANSWERED_SELF_REPORTED':coveragePct>=60?'PARTIAL_SELF_REPORTED':'INSUFFICIENT_EVIDENCE';
 const riskIndex=coveragePct<60?null:clamp(weightedRisk/knownWeight*100);
 const knownGaps=items.filter(x=>x.answer==='missing').length;
 const needTests=items.filter(x=>x.answer==='implemented').length;
 const unknown=items.filter(x=>x.answer==='unknown').length;
 const tested=items.filter(x=>x.answer==='tested').length;
 const actions=items.filter(x=>x.answer!=='tested').sort((a,b)=>priorityOrder[a.priority]-priorityOrder[b.priority]||b.priorityScore-a.priorityScore||a.short.localeCompare(b.short));
 const completed=items.filter(x=>x.answer==='tested');
 const summary={controls:CONTROLS.length,tested,knownGaps,needTests,unknown,coveragePct,riskIndex,
   assessmentState:confidence,interpretedRisk:riskIndex===null?'NOT_SCORED':riskIndex>=65?'HIGH_SELF_REPORTED_EXPOSURE':riskIndex>=35?'MODERATE_SELF_REPORTED_EXPOSURE':'LOWER_SELF_REPORTED_EXPOSURE'};
 const rows=items.map(({priorityScore,...rest})=>rest);
 return {schema:'esheen-integration-readiness-v1',scope:{project:project||'Unnamed integration',scenario},
   summary,items:rows,prioritizedActions:actions.map(({priorityScore,...rest})=>rest),strengths:completed.map(x=>x.short),
   limits:'Questionnaire responses are self-reported. Coverage is not independently verified. Risk index uses only answered control weights and is withheld below 60% coverage. This is not a security, SOC 2, ISO, webhook provider, AI model, uptime or legal certification. No remote integration test, deployment, identity check, payment or customer onboarding has occurred.'};
}
export function toMarkdown(result){
 if(!result||result.schema!=='esheen-integration-readiness-v1')throw Error('Provide an assessment report.');
 const s=result.summary;
 const lines=[
 '# Integration reliability review — self-reported',
 '',
 'Integration: '+result.scope.project,
 'Scenario: '+result.scope.scenario,
 '',
 'Coverage: '+s.coveragePct+'% of weighted controls',
 'Risk exposure index: '+(s.riskIndex===null?'Not scored (insufficient answers)':s.riskIndex+'/100 (higher means more exposure)'),
 'Self-reported tested: '+s.tested+' / '+s.controls,
 'Known gaps: '+s.knownGaps+'; untested: '+s.needTests+'; unknown: '+s.unknown,
 '',
 '## Next actions'
 ];
 if(result.prioritizedActions.length===0)lines.push('All eight controls were reported tested. Independently verify the evidence before relying on this report.');
 else for(const [i,a] of result.prioritizedActions.entries()){
   lines.push((i+1)+'. **'+a.priority+' — '+a.short+'** ('+a.status+'). '+a.action);
   lines.push('   Validation: '+a.validation);
 }
 lines.push('','## Limitations',result.limits,'','Generated offline by Esheen Labs Integration Reliability Assessment. No data transmitted.');
 return lines.join('\n');
}
