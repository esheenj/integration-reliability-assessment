import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const site=readFileSync('site/index.html','utf8');
const css=readFileSync('site/style.css','utf8');
const js=readFileSync('site/app.mjs','utf8');
const robots=readFileSync('site/robots.txt','utf8');
const sitemap=readFileSync('site/sitemap.xml','utf8');

test('site has one h1 and keyboard skip link',()=>{
 assert.equal((site.match(/<h1\b/g)||[]).length,1);
 assert.match(site,/class="skip-link" href="#assessment"/);
});
test('exact verified Sigma Code email contact is explicit user action',()=>{
 assert.match(site,/href="mailto:info@sigmacode\.co\.za\?subject=Integration%20reliability%20pilot%20enquiry"/);
 assert.match(site,/https:\/\/sigmacode\.co\.za\//);
 assert.equal(js.includes('mailto:'),false);
});
test('GitHub pilot issue template remains a separate option',()=>{
 assert.match(site,/https:\/\/github\.com\/esheenj\/integration-reliability-assessment\/issues\/new\?template=pilot\.yml/);
});
test('business offer has no unsupported purchase or booking claim',()=>{
 assert.match(site,/not a payment or confirmed service/);
 assert.match(site,/scoped separately/);
});
test('canonical site and open graph reference the actual project',()=>{
 assert.match(site,/<link rel="canonical" href="https:\/\/esheenj\.github\.io\/integration-reliability-assessment\/">/);
 assert.match(site,/property="og:title"/);
 assert.match(site,/property="og:description"/);
 assert.match(site,/name="twitter:card"/);
});
test('robots and sitemap refer to the canonical URL',()=>{
 assert.match(robots,/Sitemap: https:\/\/esheenj\.github\.io\/integration-reliability-assessment\/sitemap\.xml/);
 assert.match(sitemap,/<loc>https:\/\/esheenj\.github\.io\/integration-reliability-assessment\/<\/loc>/);
});
test('site remains local-first with no remote script tags',()=>{
 assert.match(site,/connect-src 'none'/);
 assert.doesNotMatch(site,/<script[^>]+src="https?:\/\//i);
 assert.doesNotMatch(js,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b/);
});
test('each form field and action has explicit controls',()=>{
 for(const id of ['project','scenario','sample','clear','generate','results','actions','exportJson','exportMarkdown','copySummary']){
  assert.match(site,new RegExp('id="'+id+'"'));
 }
});
test('no unseen external assets or third-party fonts',()=>{
 assert.doesNotMatch(css,/@import\s+url/);
 assert.doesNotMatch(site,/<img[^>]+src="https?:\/\//i);
});
test('small screens have their own responsive layout and reduced-motion support',()=>{
 assert.match(css,/@media\(max-width:740px\)/);
 assert.match(css,/@media\(max-width:400px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
