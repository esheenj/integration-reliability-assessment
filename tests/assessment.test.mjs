import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTROLS,OPTIONS,normalizeAssessment,assess,toMarkdown} from '../src/assessment.mjs';
const all=status=>Object.fromEntries(CONTROLS.map(c=>[c.id,status]));
const run=(answers,extras={})=>assess({project:'Fictional flow',scenario:'Sample webhook',answers,...extras});
test('eight unique, positive-weight controls',()=>{
 assert.equal(CONTROLS.length,8);
 assert.equal(new Set(CONTROLS.map(c=>c.id)).size,8);
 assert.ok(CONTROLS.every(c=>Number.isInteger(c.weight)&&c.weight>0&&c.action&&c.checks));
});
test('known statuses are unique',()=>assert.equal(new Set(OPTIONS.map(o=>o.value)).size,4));
test('all tested yields full coverage, zero index, no followups',()=>{
 const r=run(all('tested'));
 assert.equal(r.summary.coveragePct,100);
 assert.equal(r.summary.riskIndex,0);
 assert.equal(r.summary.tested,8);
 assert.equal(r.prioritizedActions.length,0);
});
test('all absent yields exposure 100 and eight high actions',()=>{
 const r=run(all('missing'));
 assert.equal(r.summary.riskIndex,100);
 assert.equal(r.summary.knownGaps,8);
 assert.ok(r.prioritizedActions.every(x=>x.priority==='HIGH'));
});
test('all implemented without tests scores 50, not 0',()=>{
 const r=run(all('implemented'));
 assert.equal(r.summary.riskIndex,50);
 assert.equal(r.summary.needTests,8);
});
test('all unknown does not fake a score',()=>{
 const r=run(all('unknown'));
 assert.equal(r.summary.riskIndex,null);
 assert.equal(r.summary.coveragePct,0);
 assert.equal(r.summary.assessmentState,'INSUFFICIENT_EVIDENCE');
 assert.equal(r.prioritizedActions.length,8);
});
test('partial unknown coverage below 60% withholds index',()=>{
 const ans=all('unknown');
 for(const id of ['observability','evidence','retries'])ans[id]='tested';
 const r=run(ans);assert.ok(r.summary.coveragePct<60);assert.equal(r.summary.riskIndex,null);
});
test('answered majority has numeric self-report index',()=>{
 const ans=all('tested');ans.recovery='unknown';ans.evidence='unknown';
 const r=run(ans);assert.ok(r.summary.coveragePct>=60);assert.equal(r.summary.riskIndex,0);
 assert.equal(r.summary.unknown,2);
 assert.equal(r.summary.assessmentState,'PARTIAL_SELF_REPORTED');
});
test('critical missing idempotency appears before medium evidence',()=>{
 const ans=all('tested');ans.idempotency='missing';ans.evidence='implemented';
 const r=run(ans);assert.equal(r.prioritizedActions[0].id,'idempotency');
});
test('critical unknown stays review not known missing',()=>{
 const ans=all('tested');ans.identity='unknown';
 const r=run(ans);assert.equal(r.summary.knownGaps,0);
 assert.equal(r.summary.unknown,1);assert.equal(r.prioritizedActions[0].priority,'REVIEW');
});
test('each known control preserved in output even when all unknown',()=>{
 const r=run({});
 assert.equal(r.items.length,8);
 assert.deepEqual(r.items.map(x=>x.id),CONTROLS.map(c=>c.id));
});
test('report describes limitations and does not imply certification',()=>{
 const r=run(all('tested'));
 assert.match(r.limits,/not a security/i);
 assert.match(r.limits,/self-reported/i);
});
test('safe bounded free-text project',()=>{
 const r=run(all('tested'),{project:'  Test Flow  '});
 assert.equal(r.scope.project,'Test Flow');
 assert.throws(()=>run(all('tested'),{project:'a'.repeat(81)}),/project/);
 assert.throws(()=>run(all('tested'),{project:'bad\nflow'}),/project/);
});
test('missing optional project becomes neutral label',()=>assert.equal(run({},{project:''}).scope.project,'Unnamed integration'));
test('invalid status rejected fail closed',()=>{
 const ans=all('tested');ans.identity='yes';
 assert.throws(()=>run(ans),/Invalid selection/);
});
test('unknown control key rejected',()=>assert.throws(()=>run({...all('tested'),rootAccess:'tested'}),/Unsupported control/));
test('answers must be object',()=>assert.throws(()=>assess({answers:[]}),/answers/));
test('entire input must be object',()=>assert.throws(()=>assess(null),/Expected a JSON/));
test('stringified and object inputs give same result',()=>{
 const obj={project:'Example',scenario:'CRM',answers:all('missing')};
 assert.deepEqual(assess(obj),assess(JSON.stringify(obj)));
});
test('output deterministic across calls',()=>{const a=run(all('implemented'));assert.deepEqual(a,run(all('implemented')));});
test('Markdown exports clear scope, top priorities and limits',()=>{
 const r=run(all('missing'));
 const md=toMarkdown(r);
 assert.match(md,/Fictional flow/);
 assert.match(md,/Higher means more exposure|higher means more exposure/);
 assert.match(md,/## Next actions/);
 assert.match(md,/## Limitations/);
});
test('Markdown no-score is explicit',()=>assert.match(toMarkdown(run({})),/Not scored/));
test('Markdown rejects unrelated report type',()=>assert.throws(()=>toMarkdown({schema:'other'}),/assessment report/));
test('no remote call, URL, or credential needed to compute',()=>{
 const r=run(all('tested'));
 assert.equal(r.schema,'esheen-integration-readiness-v1');
 assert.ok(!JSON.stringify(r).includes('apiKey'));
});
test('weighted score reflects critical and ordinary differences',()=>{
 const a=all('tested'),b=all('tested');a.idempotency='missing';b.observability='missing';
 assert.ok(run(a).summary.riskIndex>run(b).summary.riskIndex);
});
test('summary counts reconcile exactly to controls',()=>{
 const a=all('tested');a.identity='missing';a.retries='implemented';a.secrets='unknown';
 const s=run(a).summary;
 assert.equal(s.tested+s.knownGaps+s.needTests+s.unknown,s.controls);
});
test('normalizer defaults unmentioned controls to unknown',()=>assert.equal(normalizeAssessment({answers:{identity:'tested'}}).answers.recovery,'unknown'));
test('computed risk always between 0 and 100 when present',()=>{
 for(const a of ['tested','implemented','missing']){
  const score=run(all(a)).summary.riskIndex;assert.ok(score>=0&&score<=100);
 }
});
test('every untested item has actionable fix and validation',()=>{
 const r=run(all('implemented'));
 assert.ok(r.prioritizedActions.every(a=>a.action&&a.validation&&a.problem));
});
test('no time-sensitive reference changes self-reported scoring',()=>{
 assert.deepEqual(run(all('tested'),{project:'Scope'}),run(all('tested'),{project:'Scope'}));
});
