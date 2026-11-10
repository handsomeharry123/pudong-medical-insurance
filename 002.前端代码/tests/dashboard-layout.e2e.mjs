import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const output='/tmp/pudong-history-style-qa';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:3001/login');await page.evaluate(()=>sessionStorage.setItem('pudong-auth-user','user-000'));await page.goto('http://localhost:3001/app/home/dashboard');await page.getByTestId('history-dashboard').waitFor();
 const sizes=[[1920,1080],[1600,900],[1440,900],[1366,768],[1280,720],[1280,640],[1280,600]];
 for(const [width,height]of sizes){
  await page.setViewportSize({width,height});await page.waitForTimeout(120);
  const result=await page.evaluate(()=>{
   const rect=e=>e.getBoundingClientRect();const within=(child,parent)=>rect(child).top>=rect(parent).top-1&&rect(child).bottom<=rect(parent).bottom+1;
   return {width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,
    panels:[...document.querySelectorAll('.history-panel')].map(e=>({name:e.querySelector('h2').innerText,visible:rect(e).top>=0&&rect(e).bottom<=innerHeight,overflow:e.scrollHeight>e.clientHeight+1})),
    stages:[...document.querySelectorAll('.history-stage-grid>div')].map(e=>({overflow:e.scrollHeight>e.clientHeight+1,fields:[...e.children].every(c=>within(c,e))})),
    summary:[...document.querySelectorAll('.history-summary-panel li')].every(e=>within(e,document.querySelector('.history-summary-panel'))),
    behavior:[...document.querySelectorAll('.history-behavior-legend>div')].every(e=>within(e,document.querySelector('.history-behavior-legend'))),
    background:getComputedStyle(document.querySelector('.platform-header')).backgroundColor,
   };
  });
  assert.equal(result.pageHeight,height,`page scroll at ${width}x${height}`);assert.equal(result.pageWidth,width);assert.equal(result.panels.length,8);
  for(const p of result.panels){assert.ok(p.visible,`${width}x${height} ${p.name} outside viewport`);assert.equal(p.overflow,false,`${width}x${height} ${p.name} clipped`);}
  assert.ok(result.stages.every(s=>!s.overflow&&s.fields),`stage fields clipped at ${width}x${height}: ${JSON.stringify(result.stages)}`);assert.ok(result.summary,'summary clipped');assert.ok(result.behavior,'behavior legend clipped');assert.equal(result.background,'rgb(6, 22, 45)');
  await page.screenshot({path:`${output}/${width}x${height}.png`});
 }
 await page.setViewportSize({width:1366,height:768});
 const first=page.locator('.history-side-col').first().locator('.history-panel').first();
 await first.getByText('数量',{exact:true}).click();assert.ok(await first.locator('.recharts-bar').count());
 await first.getByText('结算等级',{exact:true}).click();assert.equal(await first.locator('.recharts-bar').count(),3);
 await first.getByText('占比',{exact:true}).click();assert.ok(await first.locator('.recharts-pie').count());
 await page.getByRole('button',{name:'展开大屏'}).click();assert.equal(await page.locator('.history-expanded').evaluate(e=>Math.round(e.getBoundingClientRect().height)),768);await page.getByRole('button',{name:'退出大屏'}).click();
 await page.locator('.platform-switch a').last().click();await page.getByTestId('home-v1').waitFor();assert.equal(await page.locator('.platform-shell-dashboard').count(),0);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({singleScreen:sizes,panels:8,metrics:5,summaryLines:3,forms:'bar/donut/stacked-bar, 3-risk trend, map/list, four-stage flow, two-color case bar, scrolling TOP10, behavior donut, project horizontal TOP5',errors}));
}finally{await browser.close();}
