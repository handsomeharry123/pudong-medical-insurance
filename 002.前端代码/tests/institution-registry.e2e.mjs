import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3001/login');await page.getByPlaceholder('工号 / 手机号 / 姓名').fill('admin');await page.getByPlaceholder('请输入密码',{exact:true}).fill('admin');await page.getByRole('button',{name:'登 录',exact:true}).click();await page.waitForURL('**/portal');
 await page.goto('http://localhost:3001/app/modules/analysis/institution-profiles');await page.locator('.profile-table tbody tr').first().waitFor();assert.equal(await page.locator('.profile-distribution strong').innerText(),'231');assert.deepEqual(await page.locator('.profile-risk-value').allTextContents(),['12家','28家','191家']);
 assert.equal(await page.locator('th').nth(2).innerText(),'机构类型');
 await page.getByTitle('全部机构类型',{exact:true}).click();await page.getByTitle('养老内设',{exact:true}).click();await page.getByRole('button',{name:'查询',exact:true}).click();assert.ok((await page.locator('tbody tr td:nth-child(3)').allTextContents()).every(t=>t==='养老内设'));
 await page.getByRole('link',{name:'查看详情'}).first().click();await page.locator('.institution-business-card').waitFor();assert.ok((await page.locator('.institution-business-card').innerText()).includes('机构类型\n养老内设'));assert.deepEqual(errors,[]);console.log('PASS: 231 total, 12/28/191 risk counts, type column, filter and detail card');
}finally{await browser.close()}
