import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>sessionStorage.setItem('pudong-auth-user','user-000'));
await page.goto('http://localhost:3001/app/home/overview');
await page.waitForSelector('.reg-module-card');
assert.equal(await page.locator('.reg-module-card').count(),4);
assert.equal(await page.locator('.reg-module-card:disabled').count(),3);
assert.match(await page.locator('.reg-assistant-header').innerText(),/面向医保业务的数据分析与监管助手/);
await page.locator('.reg-module-card').first().click();
await page.locator('.reg-module-card').last().click();
assert.equal(await page.locator('.reg-metric-card').count(),3);
await page.screenshot({path:'/tmp/yixiaobao-portrait-entry.png',fullPage:true});
for(const [title,expected] of [['高风险机构数',/共12家/],['本月风险等级上升机构数',/共5家/],['未办结检查数',/共37次/]]){
 await page.getByRole('button',{name:new RegExp('^'+title+' ')}).click();
 await page.waitForSelector('.reg-processing',{state:'hidden'});
 const last=await page.locator('.reg-message-assistant .reg-message-text').last().innerText();
 assert.match(last,expected,`${title}: ${last}`);
 console.log(title+' → '+last.slice(0,110));
}
await page.getByRole('textbox',{name:'监管问题输入'}).fill('查询长护险预警');
await page.getByRole('button',{name:'发送问题',exact:true}).click();
assert.match(await page.locator('.reg-message-assistant .reg-message-text').last().innerText(),/正在建设中/);
assert.deepEqual(errors,[]);
console.log('PASS: 三级入口、建设中禁用、三项指标名单、未开放业务提示及浏览器运行检查');
await browser.close();
