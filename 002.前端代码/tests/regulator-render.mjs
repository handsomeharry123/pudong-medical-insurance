import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:3001/login');
 const count=await page.evaluate(async()=>{sessionStorage.setItem('pudong-auth-user','user-000');const e=await import('/src/pages/home/regulator/engine.ts'),d=await import('/src/pages/home/regulator/data.ts');const sessions=e.catalog.map((n,k)=>{const result=e.respond(n.prompt,{...e.newContext(),scene:n.scene,institution:d.DEFAULT_INST.code,batch:d.currentCheck.batch,analysis:[16,18,25,35,37,40,43]});return{id:'qa-'+k,title:`验收${k+1} · ${n.prompt}`,updatedAt:'刚刚',context:result.context,messages:[{id:'qa-msg-'+k,role:'assistant',content:result.content,result}]};});sessionStorage.setItem('pudong-regulator-conversations-v1',JSON.stringify(sessions));return sessions.length;});
 await page.goto('http://localhost:3001/app/home/overview');
 for(let i=0;i<count;i++){await page.locator('.reg-sidebar').getByTestId('home-v1-side-session-qa-'+i).click();await page.locator('.reg-results .reg-result').first().waitFor();assert.ok(await page.locator('.reg-results .reg-result').count());if([0,9,16,24,38,50,53].includes(i)){await page.waitForTimeout(200);await page.screenshot({path:`/tmp/pudong-regulator-qa/render-${i}.png`});}}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({rendered:count,errors}));
}finally{await browser.close();}
