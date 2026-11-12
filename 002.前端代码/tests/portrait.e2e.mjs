import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:3001');
 const result=await page.evaluate(async()=>{
  const e=await import('/src/pages/home/regulator/engine.ts'),d=await import('/src/pages/home/regulator/data.ts'),r=await import('/src/pages/home/regulator/report.ts');
  let c={...e.newContext(),scene:2};const turns=[];const ask=t=>{const out=e.respond(t,c);c=out.context;turns.push({text:t,step:c.portraitStep,scene:c.scene,content:out.content});return out;};
  const welcome=e.switchScene(2,c);ask('查看浦东新区中医医院的监管画像');const code=c.institution;
  ask('这家机构近几年的风险有什么变化？');ask('按检查类型分析');ask('查看关键变化点');ask('追溯风险原因');ask('按就医及数据属性分析');ask('按行为认定分析');ask('按违规项目分析');ask('查看全区排名');ask('与浦东新区人民医院比较');const kept=c.institution===code;
  ask('生成监管建议');ask('查看重点检查');ask('查看风险最高的检查');const highest=d.history(code).reduce((a,b)=>a.score>b.score?a:b);const correct=c.batch===highest.batch;
  ask('生成机构画像报告');ask('确认模块并生成报告：历次风险变化、横向对标分析、领导摘要；全部有效检查');const sections=r.reportSections(c);
  ask('增加“重点检查概览”，删除“领导摘要”，把风险原因写得更详细');const revised=r.reportSections(c);
  ask('查看最近一次检查');const summaryScene=c.scene;ask('查看完整检查详情');
  const unknown=e.respond('查看不存在医院的画像',{...e.newContext(),scene:2});const multi=e.respond('查看浦东医院的画像',{...e.newContext(),scene:2});
  let bare=e.respond('查看浦东新区中医医院的监管画像',{...e.newContext(),scene:2});bare=e.respond('生成机构画像报告',bare.context);const noGate=bare.context.portraitStep;bare=e.respond('确认模块并生成报告：横向对标分析；全部有效检查',bare.context);const scope=bare.context.portraitStep;bare=e.respond('确认模块并生成报告：横向对标分析；同结算等级机构；全部有效检查',bare.context);
  return {turns,kept,correct,sections,revised,summaryScene,finalScene:c.scene,unknown:unknown.context.portraitStep,multi:multi.context.portraitCandidates?.length,welcome:welcome.views,noGate,scope,finished:bare.context.portraitStep};
 });
 assert.deepEqual(result.welcome,['portrait']);assert.ok(result.kept);assert.ok(result.correct);assert.equal(result.summaryScene,2);assert.equal(result.finalScene,3);assert.equal(result.noGate,'modules');assert.equal(result.scope,'report');assert.equal(result.finished,'report');assert.equal(result.unknown,'select');assert.ok(result.multi>1);assert.ok(result.sections.some(s=>s.title.includes('领导摘要')));assert.ok(!result.revised.some(s=>s.title.includes('领导摘要')));assert.ok(result.revised.some(s=>s.title.includes('重点检查概览')));
 const expected=['overview','trend','types','changes','attribution','dimensions','behavior','projects','benchmark','benchmark','advice','checks','summary','modules','report','report','summary','summary'];assert.deepEqual(result.turns.map(t=>t.step),expected);console.log('PASS: A–F branches, matching, context, report selection/supplement/version, E→scene 3');
 await page.goto('http://localhost:3001/login');await page.getByPlaceholder('工号 / 手机号 / 姓名').fill('admin');await page.getByPlaceholder('请输入密码',{exact:true}).fill('admin');await page.getByRole('button',{name:'登 录',exact:true}).click();await page.waitForURL('**/app/home/dashboard');await page.goto('http://localhost:3001/app/home/overview');await page.getByTestId('home-v1').waitFor();
 await page.getByRole('textbox',{name:'监管问题输入'}).fill('医疗机构监管履历画像');await page.getByRole('button',{name:'发送问题'}).click();await page.getByRole('button',{name:'医疗机构监管画像',exact:true}).click();await page.getByRole('combobox',{name:'机构名称'}).fill('浦东新区中医医院');await page.getByTitle('浦东新区中医医院',{exact:true}).click();await page.getByRole('button',{name:'查询画像',exact:true}).click();await page.locator('[data-step="overview"]').waitFor();await page.screenshot({path:'/tmp/portrait-overview.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS: linked institution selector → portrait UI without runtime errors');
}catch(e){console.log(await page.locator('body').innerText());await page.screenshot({path:'/tmp/portrait-failure.png'});throw e;}finally{await browser.close();}
