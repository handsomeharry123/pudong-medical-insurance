import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 const base=process.env.BASE_URL||'http://localhost:3001';
 await page.goto(base+'/login');await page.getByPlaceholder('工号 / 手机号 / 姓名').fill('admin');await page.getByPlaceholder('请输入密码',{exact:true}).fill('admin');await page.getByRole('button',{name:'登 录',exact:true}).click();await page.waitForURL('**/app/**');
 for(const code of ['PDYB-310115-002','PDYB-310115-003','PDYB-310115-009']){
 await page.goto(base+'/app/modules/analysis/institution-profiles/'+code);
 await page.getByRole('tab',{name:'违规费用结构',exact:true}).waitFor();
 assert.equal(await page.getByRole('tab',{name:'违规费用结构',exact:true}).getAttribute('aria-selected'),'true');
 for(const name of ['行为与就医类型','风险值趋势','监管关注建议'])await page.getByRole('tab',{name,exact:true}).click();
 await page.getByRole('tab',{name:/检查记录/}).click();
 await page.getByRole('button',{name:'查询检查记录'}).click();await page.waitForTimeout(200);
 const visible=page.locator('.ant-table-tbody');assert.ok(await visible.innerText());
 await page.setViewportSize({width:900,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:1440,height:1000});
 }
 assert.deepEqual(errors,[]);console.log('V1.1: empty, fallback and valid profiles; tabs, query and responsive layout passed');
} finally {await browser.close();}
