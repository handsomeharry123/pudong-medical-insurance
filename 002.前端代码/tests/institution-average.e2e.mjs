import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3001/login');await page.getByPlaceholder('工号 / 手机号 / 姓名').fill('admin');await page.getByPlaceholder('请输入密码',{exact:true}).fill('admin');await page.getByRole('button',{name:'登 录',exact:true}).click();await page.waitForURL('**/portal');
 const result=await page.evaluate(async()=>{const {profileInstitutions,getProfileChecks,hasProfileResult}=await import('/src/pages/analysis/profileData.ts');return profileInstitutions.map(i=>{const valid=getProfileChecks(i.code).filter(hasProfileResult);return {code:i.code,score:i.score,hasScore:i.hasScore,expected:valid.length?valid.reduce((s,c)=>s+c.score,0)/valid.length:0,count:valid.length}})});
 for(const r of result){assert.equal(r.hasScore,r.count>0);assert.ok(Math.abs(r.score-r.expected)<1e-9)}
 const example=result.find(r=>r.code==='PDYB-310115-002');assert.equal(example.count,1);assert.equal(example.score,85.05);assert.ok(result.some(r=>!r.hasScore));assert.ok(result.some(r=>r.count>1));
 for(const r of [example,result.find(r=>!r.hasScore)]){await page.goto('http://localhost:3001/app/modules/analysis/institution-profiles/'+r.code);await page.locator('.institution-risk-summary').waitFor();assert.equal(await page.locator('.institution-risk-summary>div').nth(1).locator('p strong').innerText(),r.hasScore?r.score.toFixed(2):'—');}
 console.log('PASS: all 231 institution averages, single score 85.05, multiple scores, and no-score display');
}finally{await browser.close()}
