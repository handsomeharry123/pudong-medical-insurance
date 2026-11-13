import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const labels=['查找或定位医疗机构','解读当前页面的指标和图表','分析机构风险变化及主要原因','查看区内排名或比较不同机构','定位需要重点关注的检查','生成监管建议或机构画像报告'];
try{
 await page.goto('http://localhost:3001/login');await page.getByPlaceholder('工号 / 手机号 / 姓名').fill('admin');await page.getByPlaceholder('请输入密码',{exact:true}).fill('admin');await page.getByRole('button',{name:'登 录',exact:true}).click();await page.waitForURL('**/app/home/dashboard');
 const url='http://localhost:3001/app/modules/analysis/institution-profiles';
 for(const surface of ['bubble','panel'])for(const [i,label] of labels.entries()){
  await page.goto(url);const hint=page.getByTestId('status-bubble'),entry=page.getByRole('button',{name:'唤起医小保对话，可拖拽到任意位置',exact:true});if(surface==='panel')await entry.click();const container=surface==='bubble'?hint:page.getByRole('dialog',{name:'医小保对话',exact:true});
  assert.equal(await container.locator('.profile-assistant-capability').count(),6);assert.equal(await container.locator('.profile-assistant-context').count(),0);assert.equal(await container.locator('.profile-assistant-bubble-actions').count(),0);assert.equal(await container.getByRole('button',{name:'查询一家医疗机构',exact:true}).count(),0);assert.equal(await container.getByRole('button',{name:'比较两家机构',exact:true}).count(),0);
  await container.getByRole('button',{name:label,exact:true}).click();const dialog=page.getByRole('dialog',{name:'医小保对话',exact:true});await dialog.locator('.profile-assistant-message.user').filter({hasText:label}).waitFor();const response=dialog.locator('.profile-assistant-message.assistant').last();assert.ok((await response.innerText()).length>10);
  if([0,2,3,4].includes(i))await dialog.getByRole('combobox',{name:'选择医疗机构',exact:true}).waitFor();
  if(i===1)assert.ok((await response.innerText()).includes('列表共124家机构'));
  if(i===5){await response.getByRole('button',{name:'生成机构画像报告',exact:true}).click();await dialog.getByRole('combobox',{name:'选择医疗机构',exact:true}).waitFor();}
  if(i===2||i===4||i===5){await dialog.getByRole('combobox',{name:'选择医疗机构',exact:true}).fill('PDYB-310115-001');await page.getByTitle('浦东新区中医医院 / PDYB-310115-001',{exact:true}).click();await dialog.getByRole('button',{name:'开始分析',exact:true}).click();const drawer=page.getByRole('dialog',{name:'监管分析',exact:true});await drawer.locator(`[data-step="${i===2?'trend':i===4?'checks':'modules'}"]`).waitFor();}
 }
 await page.goto(url);await page.getByRole('button',{name:'唤起医小保对话，可拖拽到任意位置',exact:true}).click();await page.waitForTimeout(300);await page.screenshot({path:'/tmp/profile-capabilities-panel.png'});await page.setViewportSize({width:390,height:844});assert.equal(await page.getByTestId('assistant-chat-panel').evaluate(el=>el.scrollWidth>el.clientWidth),false);assert.deepEqual(errors,[]);console.log('PASS: all six capabilities on bubble and panel, business routing, removed redundant controls, mobile');
}finally{await browser.close();}
