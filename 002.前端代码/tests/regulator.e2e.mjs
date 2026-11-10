import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
const output='/tmp/pudong-regulator-qa';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.BASE_URL||'http://localhost:3001';
const doc=await readFile(new URL('../../001.产品文档/浦东新区医保智能体-对话场景-需求说明V1.0.md',import.meta.url),'utf8');
try{
 await page.goto(base+'/login');await page.getByPlaceholder('工号 / 手机号 / 姓名').fill('admin');await page.getByPlaceholder('请输入密码',{exact:true}).fill('admin');await page.getByRole('button',{name:'登 录',exact:true}).click();await page.waitForURL('**/app/home/dashboard');await page.locator('.platform-switch a').last().click();await page.getByTestId('home-v1').waitFor();
 const results=await page.evaluate(async()=>{
  const e=await import('/src/pages/home/regulator/engine.ts'),d=await import('/src/pages/home/regulator/data.ts'),report=await import('/src/pages/home/regulator/report.ts');
  const base={...e.newContext(),institution:d.DEFAULT_INST.code,batch:d.currentCheck.batch,analysis:[16,18,25,35,37,40,43]};
  const coverage=e.catalog.map((n,k)=>{const r=e.respond(n.prompt,{...base,scene:n.scene});return {k,node:r.node,views:r.views.length,unfilled:/XX|X家|X次|X元/.test(r.content),prompt:n.prompt};});
  const initial=e.respond(e.catalog[0].prompt,e.newContext());const rising=e.respond(e.catalog[1].prompt,initial.context),profile=e.respond(e.catalog[16].prompt,rising.context),analysis=e.respond(e.catalog[18].prompt,profile.context),r=e.respond(e.catalog[30].prompt,analysis.context);
  const noComparison=report.reportSections(r.context).find(s=>s.title.includes('分析覆盖范围'))?.body;
  const candidate=e.respond(e.catalog[10].prompt,initial.context);
  const mismatch=e.respond('查看浦东新区人民医院FXJC-2026-011批次的监管检查情况。',profile.context);
  const pending=e.respond('这家机构为什么风险比较高？',e.newContext()),after=e.respond('浦东新区中医医院',pending.context);
  const compare=e.respond('帮我和浦东新区人民医院具体比较一下。',{...base,scene:3});
  return {coverage,counts:{high:d.institutions.filter(i=>i.risk==='高风险').length,medium:d.institutions.filter(i=>i.risk==='中风险').length,low:d.institutions.filter(i=>i.risk==='低风险').length,open:d.checks.filter(b=>b.stage!=='形成结果').length,overdue:d.checks.filter(b=>b.overdue).length,newOverdue:d.checks.filter(b=>b.overdue&&b.entered.startsWith('2026-11')).length,highOpen:d.checks.filter(b=>d.institutions.find(i=>i.code===b.code)?.risk==='高风险'&&b.stage!=='形成结果').length,indicators:d.indicators(d.currentCheck).length,total:d.indicators(d.currentCheck).reduce((s,r)=>s+r.amount,0)},noComparison,candidate:candidate.views,mismatch:mismatch.content,pending:pending.content,after:after.node,comparisonInstitution:compare.context.institution};
 });
 assert.equal(results.coverage.length,55);
 for(const row of results.coverage){assert.ok(doc.includes(row.prompt));assert.equal(row.node,row.k,`route ${row.k}`);assert.ok(row.views>0,`view ${row.k}`);assert.equal(row.unfilled,false);}
 assert.deepEqual(results.counts,{high:12,medium:28,low:84,open:37,overdue:7,newOverdue:5,highOpen:9,indicators:128,total:360000});
 assert.match(results.noComparison,/横向对标尚未开展/);assert.ok(results.candidate.includes('candidates'));assert.match(results.mismatch,/不匹配/);assert.equal(results.after,18);assert.equal(results.comparisonInstitution,'PDYB-310115-001');
 await page.screenshot({path:output+'/01-home.png'});
 async function ask(text){await page.getByRole('textbox',{name:'监管问题输入'}).fill(text);await page.getByRole('button',{name:'发送问题'}).click();await page.getByRole('button',{name:'停止生成'}).waitFor({state:'hidden'});await page.locator('.reg-message-assistant').last().waitFor();}
 await ask('我想了解全区医疗机构监管结果。');await page.locator('[data-view="overview"]').waitFor();await page.screenshot({path:output+'/02-overview.png'});
 await ask('本月风险等级上升的机构有哪些？');await page.locator('[data-view="institutions"]').last().waitFor();
 await ask('帮我查看浦东新区中医医院的监管画像。');await page.locator('[data-view="profile"]').last().waitFor();
 await ask('这家机构为什么风险比较高？');await page.locator('[data-view="attribution"]').last().waitFor();
 await ask('请根据刚才的分析生成这家机构的监管画像报告。');await page.locator('[data-view="report"]').last().waitFor();
 await ask('把重复收费分析写得详细一些，并补充涉及的检查和项目。');const report=page.locator('[data-view="report"]').last();await report.getByText(/V2/).first().waitFor();
 const word=page.waitForEvent('download');await report.getByRole('button',{name:'导出Word'}).click();await(await word).saveAs(output+'/profile-v2.docx');
 const pdf=page.waitForEvent('download');await report.getByRole('button',{name:'导出PDF'}).click();await(await pdf).saveAs(output+'/profile-v2.pdf');
 await report.getByRole('button',{name:'在线预览'}).click();await page.locator('.reg-report-preview').waitFor();await page.waitForTimeout(450);await page.screenshot({path:output+'/03-report.png'});await page.locator('.ant-drawer-close').last().click();
 await ask('我想看看这家机构的单次检查情况。');await page.locator('[data-view="checks"]').last().waitFor();
 await ask('查看FXJC-2026-011这次检查。');await page.locator('[data-view="check"]').last().waitFor();
 await ask('帮我只看串换药品、住院、本地这三个条件下的情况。');const matrix=page.locator('[data-view="matrix"]').last();await matrix.waitFor();assert.match(await matrix.textContent(),/12,960/);
 await matrix.getByRole('button',{name:/串换药品 · 住院/}).click();await page.getByText('串换药品 · 住院 指标依据').waitFor();await page.getByRole('button',{name:'Close',exact:true}).last().click();
 await ask('这次检查和同类型医疗机构相比，风险水平怎么样？');await page.locator('[data-view="benchmark"]').last().waitFor();
 await ask('根据刚才的分析，帮我生成这次监管检查的分析报告。');await ask('重点突出重复违规和与同类型机构差异较大的问题。');
 await page.screenshot({path:output+'/04-check-report.png'});
 await ask('查看浦东新区中医医院FXJC-2026-011批次的进度详情。');await page.locator('[data-view="timeline"]').last().waitFor();assert.match(await page.locator('[data-view="timeline"]').last().textContent(),/网审分工/);
 await page.getByText('新建任务',{exact:true}).first().click();
 await ask('高风险机构中还有哪些检查没有办结？');await ask('按照需要优先处理的程度给我排一下。');await page.locator('[data-view="tasks"]').last().waitFor();await ask('打开第一项任务。');await page.locator('[data-view="task"]').last().waitFor();
 await page.reload();await page.getByTestId('home-v1').waitFor();await page.getByTestId('home-v1-side-session-s2').click();await page.locator('[data-view="profile"]').last().waitFor();
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'工作台',exact:true}).click();await page.getByText('新建任务',{exact:true}).last().click();await page.waitForTimeout(450);await page.screenshot({path:output+'/05-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({catalog:55,counts:results.counts,flows:'3 scenes, cross-scene context, report V2, Word/PDF, history restore, mobile',errors}));
}finally{await browser.close();}
