const {spawnSync} = require('node:child_process');
const entry = {
  date: '2026-10-31', mode: 'redesign', depth: 'full', scope: 'app',
  shape: 'app screen', theme: 'brand', genre: 'modern-minimal',
  axes: 'light/geometric-sans/chromatic-green', hero: 'none, operational app screen',
  nav: 'kept collapsible sidebar with mobile drawer', footer: 'compact brand and sample-data disclosure',
  imagery: 'none; original operational data is the material', photos: [],
  entry: 'public/admin-dashboard.html',
  fingerprint: {lead:'order ledger',shell:'sidebar',summary:'flat stat strip',secondary:'spacious right rail',stock:'thin progress ledger',mobile:'urgent tasks before orders'},
  sections: ['operational heading','attention strip','stat strip','orders and action queue','stock and restock','footer'],
  signature: 'Florist order ledger with independent order, payment and shipment statuses',
  waived: [],
  prompt: 'Hallmark redesign admin dashboard; remove upper sample notice and redundant eyebrows, increase right-column space, and make stock progress thin and minimal.',
  kept: {links:'6/6',fields:'1/1',scriptHooks:'18/18',headings:'13/13',figures:'5/5'},
  review: {type:'subagent',verdict:'fix',findings:1,resolved:1,fix:'Mobile urgent work moved above the order queue; confirmed in final 375px capture'},
  checks: {floor:0,reflex:0,browserErrors:0,interactionReport:'storage/reports/hallmark/reports/dashboard-verification.json'}
};
const result = spawnSync(process.execPath,['.agents/skills/hallmark/scripts/theme.mjs','log','--entry',JSON.stringify(entry)],{encoding:'utf8'});
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
process.exitCode = result.status || 0;
