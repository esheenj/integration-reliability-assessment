# Integration Reliability Assessment

**Find the weak link before it breaks.**

A free, local-first readiness self-assessment for CRM handoffs, webhook consumers, API integrations and AI-enabled workflows. Answer eight concise questions, inspect a transparent weighted **self-reported exposure index**, and export a prioritized, testable remediation brief. No account, API key, telemetry or backend.

**Live browser demo:** https://esheenj.github.io/integration-reliability-assessment/

## Who this helps

- **Small businesses and service operators:** identify the questions to ask before connecting CRM, marketing, invoicing or workflow software.
- **Agencies and independent developers:** turn a vague integration request into a bounded review checklist with evidence requirements.
- **Technical teams:** prioritize duplicate prevention, sender verification, schema compatibility, controlled retries, telemetry, recovery, credential handling and evidence provenance.

The browser uses eight questions with four answers each: **Implemented and tested**, **Implemented, not tested**, **Not implemented**, or **Not sure**. The index is calculated only from answers given and is withheld until at least 60% of weighted controls have definite answers. Missing and unknown are shown separately. The resulting report lists prioritized fixes and exactly how to test each one. A self-reported result is **not proof** that any system passes those checks.

## Try the example / CLI

Requires Node.js 20+. Install nothing from npm:

\`\`\`bash
git clone https://github.com/esheenj/integration-reliability-assessment.git
cd integration-reliability-assessment
npm test
npm run demo
node src/cli.mjs examples/pilot-example.json --markdown
npm run build
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
\`\`\`

Open http://127.0.0.1:8000 to try the web version. Click **Load fictional example**, then **Generate my readiness report**. The example assesses a synthetic CRM-to-invoice workflow. The Markdown and JSON export buttons run locally.

For your own fictional assessment, create JSON containing \`project\` (optional), \`scenario\` (optional) and \`answers\` (object). Supported control IDs: \`identity\`, \`idempotency\`, \`retries\`, \`schema\`, \`secrets\`, \`observability\`, \`recovery\`, \`evidence\`. Each answer must be one of \`tested\`, \`implemented\`, \`missing\`, or \`unknown\`. Unspecified controls default to unknown. Rejects unknown control identifiers and out-of-range text.

## Transparent interpretation

- Control weights are public and source-readable in \`src/assessment.mjs\`; these are **illustrative engineering priorities**, not industry-calibrated probabilities or a published regulatory measure.
- For answered controls, risk fractions are \`tested = 0\`, \`implemented but untested = 0.5\`, \`missing = 1\`. Unknown is excluded from the numerical index but reduces separate coverage. Index is rounded to 0–100, with higher meaning more **reported** exposure.
- Weighted answer coverage is reported independently. With coverage under 60%, the index is withheld, never assumed good or bad.
- HIGH marks reported missing controls; REVIEW means unknown; MEDIUM indicates controls that reportedly exist without repeatable evidence.
- Suggested action order prioritizes known gaps, then unknowns, then untested controls, with explicit validation exercises.
- The index is **not** an independent security audit, legal advice, guarantee of uptime, ISO/SOC 2 attestation or acceptance of any vendor's webhook, CRM, API or AI behavior.

This application performs **no live API calls**, production tests, remote agent execution, authentication, secret storage, payment processing or tracking. Input and output remain in the current browser session unless you choose to export/copy. Keep private customer details and credentials out of any public GitHub issue.

## Practical pilot

[Open a scoped engineering pilot enquiry](https://github.com/esheenj/integration-reliability-assessment/issues/new?template=pilot.yml). An issue is an enquiry, not a confirmed service or checkout. A pilot can be proposed for one bounded integration: discovery, synthetic failure reproduction, acceptance checks and an engineering handoff. Feasibility, budget, schedule and access are agreed separately. Do not include secrets, personal information, production payloads or confidential documentation in an issue.

For underlying tools, see the [Webhook Idempotency Lab](https://esheenj.github.io/webhook-idempotency-lab/), [Agent Tool Schema Diff Lab](https://esheenj.github.io/agent-tool-schema-diff-lab/) and [Citation Provenance Inspector](https://esheenj.github.io/citation-provenance-inspector/). Those are distinct, separately maintained public MVPs.

## Development and support

- \`src/assessment.mjs\`: pure deterministic scoring and Markdown report module
- \`src/cli.mjs\`: Node-only local script
- \`site/\`: accessible single-page browser form with no network calls
- \`scripts/build.mjs\`: reproduces the static GitHub Pages artifact
- \`tests/\`: answer-boundary, scoring, determinism, and invalid-input tests
- \`.github/workflows/\`: tests and tightly scoped Pages deployment

MIT licensed. Open a small issue with fictional examples and expected results to contribute. [Optional Esheen Labs support](https://esheenj.github.io/compound-intelligence-starter/support.html) is voluntary; no customer checkout or GitHub Sponsors enrollment is claimed.

© 2026 Esheen Labs. Public engineering tools are separate from private SIGMA trading, Cortex and Commander control systems.
