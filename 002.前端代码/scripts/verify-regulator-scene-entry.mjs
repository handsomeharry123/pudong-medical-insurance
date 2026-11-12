import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>sessionStorage.setItem('pudong-auth-user','user-000'));
 await page.goto('http://localhost:3001/app/home/overview');
 await page.waitForSelector('.reg-module-card');
 const group=page.getByRole('group',{name:'业务场景',exact:true});
 assert.equal(await group.count(),0,'首页隐藏监管场景');
 await page.locator('.reg-module-card').first().click();
 assert.equal(await group.count(),0,'医保数据分析层级隐藏监管场景');
 await page.locator('.reg-module-card').last().click();
 assert.equal(await group.locator('button[aria-pressed="true"]').count(),0,'进入功能后三项默认未选中');
 assert.equal(await group.locator('button.active').count(),0,'默认不显示选中样式');
 for(const name of ['浦东新区医疗机构监管概况','医疗机构监管画像','监管履历查询']){
  const before=await page.locator('.reg-message').count();
  await group.getByRole('button',{name,exact:true}).click();
  assert.equal(await page.locator('.reg-message').count(),before+2,'点击场景追加业务对话');
  assert.equal(await group.locator('button[aria-pressed="true"]').count(),1);
  assert.equal(await group.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');
 }
 const input=page.getByRole('textbox',{name:'监管问题输入'});
 await input.fill('返回首页');await page.getByRole('button',{name:'发送问题',exact:true}).click();
 assert.equal(await group.count(),0,'返回首页隐藏场景');
 await input.fill('查看高风险机构');await page.getByRole('button',{name:'发送问题',exact:true}).click();
 await page.waitForSelector('.reg-processing',{state:'hidden'});
 assert.equal(await group.count(),0,'普通问答不能触发监管场景');
 assert.deepEqual(errors,[]);
 console.log('PASS: 入口限制、默认未选中、三个场景对话切换、返回隐藏、普通问答隔离');
} finally {await browser.close();}
