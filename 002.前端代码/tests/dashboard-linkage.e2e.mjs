import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1100}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.BASE_URL||'http://localhost:3001';
const path='/app/modules/analysis/institution-profiles/';
try{
 await page.goto(base+'/login');
 await page.getByPlaceholder('工号 / 手机号 / 姓名').fill('admin');
 await page.getByPlaceholder('请输入密码',{exact:true}).fill('admin');
 await page.getByRole('button',{name:'登 录',exact:true}).click();
 await page.waitForURL('**/app/home/dashboard');
 const coverage=await page.evaluate(async()=>{
  const d=await import('/src/pages/home/dashboard/model.ts');
  const p=await import('/src/pages/analysis/profileData.ts');
  return d.orgs.every(o=>{
   const i=p.profileInstitutions.find(i=>i.code===o.code),c=p.getProfileChecks(o.code);
   return i?.name===o.name&&i.risk===o.risk&&c.length===o.count&&c[0].score===o.latest&&c.reduce((n,c)=>n+c.fee,0)===o.fee;
  });
 });
 assert.ok(coverage,'All dashboard institutions and checks must match destination data');
 for(const mode of ['地图','机构列表'])for(const action of ['查看机构画像','查看历次检查']){
  await page.goto(base+'/app/home/dashboard');
  await page.getByTestId('history-dashboard').waitFor();
  if(mode==='机构列表')await page.getByTestId('core-view').getByText('机构列表',{exact:true}).click();
  await page.locator(mode==='地图'?'.history-map-point':'.history-org-row').first().click();
  const card=page.getByTestId('org-summary');
  const code=await card.locator(':scope>p').innerText();
  const name=await card.locator('h3').innerText();
  const count=await card.locator('dl>div').last().locator('dd').innerText();
  await card.getByRole('button',{name:action,exact:true}).click();
  await page.waitForURL(url=>url.pathname===path+code);
  assert.equal(new URL(page.url()).hash,action==='查看历次检查'?'#checks':'');
  await page.locator('.institution-profile-detail').waitFor();
  assert.ok((await page.locator('.profiles-page').innerText()).includes(name));
  assert.equal(await page.locator('.platform-subnav[aria-current="page"]').count(),1);
  assert.equal(await page.locator('.institution-check-table tbody tr').count(),Number(count.match(/\d+/)[0]));
  if(action==='查看历次检查'){
   await page.waitForTimeout(150);
   assert.ok(await page.locator('#checks').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.top<innerHeight/2;}));
   await page.reload();await page.locator('#checks').waitFor();await page.waitForTimeout(150);
   assert.equal(new URL(page.url()).hash,'#checks');
   assert.ok(await page.locator('#checks').evaluate(el=>el.getBoundingClientRect().top<innerHeight/2));
   await page.locator('.institution-check-table .profile-detail-link').first().click();
   await page.locator('.check-profile').first().waitFor();
  }
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: map/list × profile/checks, 124 institution identities and totals, menu selection, check count, refresh anchor, check detail, no page errors');
}finally{await browser.close();}
