import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const output='/tmp/pudong-map-3d-qa';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:3001/login');await page.evaluate(()=>sessionStorage.setItem('pudong-auth-user','user-000'));await page.goto('http://localhost:3001/app/home/dashboard');
 const map=page.locator('.history-map-scene');await map.waitFor();assert.ok(await map.getAttribute('class').then(c=>c.includes('is-3d')));assert.equal(await page.locator('.history-map-point').count(),124);
 const amount=page.locator('.history-behavior-chart .history-donut-center strong');assert.equal(await amount.innerText(),'1109.75');assert.ok(await amount.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=27));
 const numeric=await amount.evaluate(e=>{const ctx=document.createElement('canvas').getContext('2d'),s=getComputedStyle(e),parent=document.querySelector('.history-behavior-chart');ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;return{width:ctx.measureText(e.textContent).width,hole:(Math.min(parent.clientHeight,parent.clientWidth)-10)*.78};});assert.ok(numeric.width<numeric.hole,JSON.stringify(numeric));
 await map.screenshot({path:output+'/3d.png'});const before=await map.screenshot();await page.waitForTimeout(600);const after=await map.screenshot();assert.notDeepEqual(before,after,'map animation should change pixels');
 await page.getByRole('button',{name:'暂停动效',exact:true}).click();assert.equal(await map.getAttribute('data-motion'),'off');assert.equal(await map.locator('.map-boundary-trace').first().evaluate(e=>getComputedStyle(e).animationPlayState),'paused');
 await page.getByRole('button',{name:'开启动效',exact:true}).click();assert.equal(await map.getAttribute('data-motion'),'on');
 await page.getByTitle('切换2D平面视图',{exact:true}).click();assert.ok(await map.getAttribute('class').then(c=>c.includes('is-flat')));assert.equal(await page.locator('.history-map-point').count(),124);await map.screenshot({path:output+'/flat.png'});
 await page.getByTitle('切换3D立体视图',{exact:true}).click();await page.getByTestId('kpi-high').click();assert.equal(await page.locator('.history-map-point').count(),12);await page.getByTestId('kpi-high').click();
 await page.locator('.history-map-point').first().focus();await page.keyboard.press('Enter');await page.getByTestId('org-summary').waitFor();assert.equal(await map.getAttribute('data-motion'),'off');await page.getByRole('button',{name:'关闭机构摘要'}).click();
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await map.locator('.map-boundary-trace').first().evaluate(e=>getComputedStyle(e).animationName),'none');await page.reload();await map.waitFor();assert.equal(await page.getByRole('button',{name:'开启动效',exact:true}).getAttribute('aria-pressed'),'false');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({extrudedMap:true,animatedPixels:true,motionControl:true,flatView:true,keyboardSelection:true,pointFilter:12,reducedMotion:true,donut:numeric,errors}));
}finally{await browser.close();}
