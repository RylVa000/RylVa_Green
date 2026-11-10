const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const url = pathToFileURL(path.resolve('public/pages/staff/admin-dashboard.html')).href;
const source = fs.readFileSync('public/pages/staff/admin-dashboard.html', 'utf8');
for (const [,script] of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) if(script.trim()) new vm.Script(script);
(async () => {
  const browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true});
  const page = await browser.newPage();
  if (process.argv.includes('--offline')) {
    await page.setRequestInterception(true);
    page.on('request', request => /^https?:/.test(request.url()) ? request.abort() : request.continue());
  }
  const failures = [];
  page.on('pageerror', e => failures.push(e.message));
  try {
    await page.setViewport({width:1440,height:900});
    await page.goto(url, {waitUntil:'networkidle0'});
    assert.equal(await page.$eval('#orders-table', el => el.children.length),6);
    assert.equal(await page.$eval('#sidebar', el => el.getBoundingClientRect().left),0);
    assert.equal(await page.$$eval('[data-superadmin-only]', nodes => nodes.filter(el => el.getClientRects().length).length),0);
    assert.equal(await page.$$eval('.stock-track', nodes => nodes.every(el => el.getBoundingClientRect().height === 3)),true);
    await page.click('[data-filter="Siap Diproses"]');
    assert.equal(await page.$eval('#order-count', el => el.textContent),'3 pesanan');
    await page.click('[data-filter="Sedang Disiapkan"]');
    assert.equal(await page.$eval('#order-count', el => el.textContent),'2 pesanan');
    await page.click('[data-filter="Dikirim"]');
    assert.equal(await page.$eval('#order-count', el => el.textContent),'1 pesanan');
    await page.click('#clear-filter');
    await page.type('#search-orders','Budi');
    assert.equal(await page.$eval('#order-count', el => el.textContent),'1 pesanan');
    assert.match(await page.$eval('#orders-table', el => el.textContent), /COD, Menunggu \/ UNPAID/);
    await page.click('[data-filter="Dikirim"]');
    assert.match(await page.$eval('#orders-table', el => el.textContent), /Tidak ada pesanan yang cocok/);
    await page.click('#clear-filter');
    assert.equal(await page.$eval('#order-count', el => el.textContent),'6 pesanan');
    await page.focus('[data-filter="all"]');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.$eval('[data-filter="Siap Diproses"]', el => el.getAttribute('aria-selected')),'true');
    await page.click('#sidebar-toggle');
    assert.equal(await page.$eval('#sidebar', el => el.getBoundingClientRect().width),80);
    await page.click('#sidebar-toggle');
    await page.goto(url+'?role=superadmin',{waitUntil:'networkidle0'});
    assert.equal(await page.$$eval('[data-superadmin-only]', nodes => nodes.filter(el => el.getClientRects().length).length),3);
    assert.match(await page.$eval('#payment-review-note', el => el.textContent),/hanya oleh SuperAdmin/);
    for(const width of [320,375,768,1024,1280,1440,1920]) {
      await page.setViewport({width,height:900});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`horizontal overflow at ${width}`);
    }
    await page.setViewport({width:375,height:844});
    await page.goto(url,{waitUntil:'networkidle0'});
    assert.equal(await page.$eval('#orders-cards', el => el.children.length),6);
    assert.equal(await page.$eval('#search-orders', el => !!el.getClientRects().length),true);
    assert.equal(await page.evaluate(() => document.querySelector('.right-column').getBoundingClientRect().top < document.querySelector('#pesanan').getBoundingClientRect().top),true);
    await page.click('#mobile-open');
    assert.equal(await page.$eval('#mobile-open', el => el.getAttribute('aria-expanded')),'true');
    assert.equal(await page.$eval('#sidebar', el => el.getBoundingClientRect().left),0);
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#mobile-open', el => el.getAttribute('aria-expanded')),'false');
    assert.equal(await page.evaluate(() => document.activeElement.id),'mobile-open');
    await page.setJavaScriptEnabled(false);
    await page.reload({waitUntil:'networkidle0'});
    assert.equal(await page.$eval('#orders-cards', el => el.children.length),6);
    assert.equal(await page.$eval('#orders-table', el => el.children.length),6);
    assert.deepEqual(failures,[]);
    const report = {passed:true, offline:process.argv.includes('--offline'), checks:['inline JavaScript syntax','6 unchanged sample orders','Admin/SuperAdmin visibility','COD remains unpaid','all status filters','search and combined empty state','clear filter','keyboard tabs','desktop sidebar collapse','mobile open and Escape focus return','urgent tasks before orders on mobile','3px progress tracks','no horizontal overflow 320–1920px','order content without JavaScript'],browserErrors:failures};
    fs.writeFileSync('storage/reports/hallmark/reports/dashboard-verification.json',JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
