import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3001/login');await page.getByPlaceholder('工号 / 手机号 / 姓名').fill('admin');await page.getByPlaceholder('请输入密码',{exact:true}).fill('admin');await page.getByRole('button',{name:'登 录',exact:true}).click();await page.waitForURL('**/portal');
 await page.goto('http://localhost:3001/app/home/dashboard');await page.locator('.history-trend-plot .recharts-yAxis').waitFor();
 for(const [width,height] of [[1512,800],[1920,1080],[1280,720]]){await page.setViewportSize({width,height});await page.waitForTimeout(250);const ticks=await page.locator('.history-trend-plot .recharts-yAxis .recharts-cartesian-axis-tick-value').allTextContents();assert.deepEqual(ticks,['0','50','100','150','200','250']);}
 const trends=await page.evaluate(async()=> (await import('/src/pages/home/dashboard/model.ts')).trends);for(const rows of Object.values(trends)){rows.forEach(r=>assert.equal(r.高风险+r.中风险+r.低风险,231));assert.deepEqual([rows.at(-1).高风险,rows.at(-1).中风险,rows.at(-1).低风险],[12,28,191]);}
 console.log('PASS: full Y-axis ticks at three desktop sizes; every period totals 231 and ends at 12/28/191');
}finally{await browser.close()}
