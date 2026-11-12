import type { Context } from './engine';
import { institutions, history, behaviorData, indicators, BEHAVIORS, VISITS, SNAPSHOT, PARAM_VERSION, STAGES } from './data';
import { portraitHistory, risk } from './portrait';
import { projectRows } from '../dashboard/model';
export type ReportTable={columns:string[];rows:string[][]};
export type ReportGraphic={kind:'line'|'bar'|'matrix'|'percentile';title:string;labels:string[];series:{name:string;values:number[]}[];notes?:string[]};
export type ReportPart={title?:string;paragraphs?:string[];table?:ReportTable;graphic?:ReportGraphic;metrics?:[string,string][]};
export type PortraitSection={title:string;body:string;parts:ReportPart[]};
export type PortraitReport={title:string;generatedAt:string;metadata:[string,string][];notice:string;sections:PortraitSection[];version:number};
const f=(n:number)=>Number.isFinite(n)?n.toFixed(2):'—';
const wan=(n:number)=>f(n/10000);
const percent=(n:number,d:number)=>d?f(n/d*100):'0.00';
export const portraitTemplateChapters=['领导摘要','一、机构基本情况','二、历次风险变化','三、重点风险分析','四、横向对标分析','五、重点检查概览','六、检查办理情况','七、监管建议','八、数据范围与指标说明'];
// Number only the chapters that survived module selection. The executive summary is unnumbered.
export function renumberPortraitSections(sections:PortraitSection[]):PortraitSection[]{
 const numerals=['一','二','三','四','五','六','七','八'];let number=0;
 return sections.map(section=>{
  if(section.title==='领导摘要')return section;
  const next=++number,old=section.parts.find(p=>/^\d+\./.test(p.title||''))?.title?.match(/^(\d+)\./)?.[1];
  const parts=section.parts.map(part=>({...part,title:part.title?.replace(/^\d+\./,`${next}.`)}));
  return {...section,title:`${numerals[next-1]}、${section.title.replace(/^[一二三四五六七八]+、/,'')}`,parts,body:old?section.body.replace(new RegExp(`^${old}\\.(\\d+)`,'gm'),`${next}.$1`):section.body};
 });
}
export function buildPortraitReport(c:Context):PortraitReport{
 const org=institutions.find(i=>i.code===c.institution),h=portraitHistory(c),selected=new Set(c.reportModules||[]),sections:PortraitSection[]=[];
 const generatedAt=c.reportGeneratedAt||'未记录（历史报告，请重新生成）';
 const start=c.start||h[h.length-1]?.date||'无数据',end=c.end||h[0]?.date||'无数据';
 const add=(title:string,parts:ReportPart[])=>sections.push({title,parts,body:parts.map(p=>[p.title,...p.paragraphs||[],...(p.metrics||[]).map(r=>r.join('：')),p.table?[p.table.columns.join(' | '),...p.table.rows.map(r=>r.join(' | '))].join('\n'):undefined,p.graphic?'图表：'+p.graphic.title:undefined].filter(Boolean).join('\n')).join('\n\n')});
 const base:Omit<PortraitReport,'sections'>={title:`${org?.name||'未选择机构'}医疗机构监管画像报告`,generatedAt,metadata:[['报告时间范围',`${start}—${end}`],['数据更新至',SNAPSHOT],['报告生成时间',generatedAt],['机构代码',org?.code||'未选择'],['结算等级',org?.level||'未选择']],notice:'本报告基于医疗机构档案、历次监管检查、风险评价、违规费用及检查办理进度等数据自动生成，用于辅助掌握医疗机构监管情况。报告结论和建议不替代人工核查及行政处理决定。',version:c.reportVersion||1};
 if(!org||!h.length){add('一、机构基本情况',[{title:'1.1 机构基础信息',paragraphs:['当前机构或指定范围内无有效检查记录，暂不生成风险、费用及监管结论。']}]);add('八、数据范围与指标说明',[{title:'8.1 数据范围',paragraphs:[`查询范围：${start}至${end}，有效检查0次。请调整查询条件。`]}]);return {...base,sections:renumberPortraitSections(sections)};}
 const total=h.reduce((s,b)=>s+b.fee,0),avg=h.reduce((s,b)=>s+b.score,0)/h.length,latest=h[0],open=h.filter(b=>b.stage!=='形成结果'),closed=h.length-open.length,chrono=[...h].reverse();
 const behaviors=BEHAVIORS.map(name=>({name,amount:h.reduce((s,b)=>s+(behaviorData(b).find(d=>d.name===name)?.amount||0),0),contribution:h.reduce((s,b)=>s+(behaviorData(b).find(d=>d.name===name)?.contribution||0),0),count:h.filter(b=>(behaviorData(b).find(d=>d.name===name)?.amount||0)>0).length})).sort((a,b)=>b.contribution-a.contribution),top=behaviors[0],second=behaviors[1],nonzero=behaviors.filter(b=>b.amount>0),contributions=behaviors.reduce((s,b)=>s+b.contribution,0);
 const matrix=BEHAVIORS.map(name=>VISITS.map(visit=>h.reduce((s,b)=>s+indicators(b).filter(i=>i.behavior===name&&i.visit===visit).reduce((s,r)=>s+r.amount,0),0)));
 const combinations=matrix.flatMap((values,i)=>values.map((amount,j)=>({behavior:BEHAVIORS[i],visit:VISITS[j],amount}))).sort((a,b)=>b.amount-a.amount),combo=combinations[0];
 const projects=Array.from(new Set(projectRows.filter(p=>h.some(b=>b.batch===p.batch)).map(p=>p.code))).map(code=>{const rows=projectRows.filter(p=>p.code===code&&h.some(b=>b.batch===p.batch));return {name:rows[0].name,code,amount:rows.reduce((s,p)=>s+p.amount,0),count:new Set(rows.map(p=>p.batch)).size};}).sort((a,b)=>b.amount-a.amount);
 const delta=chrono.slice(1).map((b,i)=>({b,previous:chrono[i],value:b.score-chrono[i].score})).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value)),key=delta[0],highest=[...h].sort((a,b)=>b.score-a.score)[0],lowest=[...h].sort((a,b)=>a.score-b.score)[0];
 const differences=chrono.slice(1).map((b,i)=>b.score-chrono[i].score),trend=!differences.length?'数据不足，暂不判断变化':differences.every(n=>n===0)?'稳定':differences.every(n=>n>=0)?'上升':differences.every(n=>n<=0)?'下降':'波动';
 let consecutive=0;for(let j=chrono.length-1;j>0;j--){const current=behaviorData(chrono[j]).find(d=>d.name===top.name)!.amount,previous=behaviorData(chrono[j-1]).find(d=>d.name===top.name)!.amount;if(current>previous)consecutive++;else break;}
 const typeRows=['飞行检查','专项检查','日常检查'].map(name=>{const rows=h.filter(b=>b.type===name);return {name,count:rows.length,average:rows.length?rows.reduce((s,b)=>s+b.score,0)/rows.length:0,fee:rows.reduce((s,b)=>s+b.fee,0)};}).filter(t=>t.count),topType=[...typeRows].sort((a,b)=>b.average-a.average)[0];
 const metrics=(code:string)=>{const rows=portraitHistory({...c,institution:code}),sum=rows.reduce((s,b)=>s+b.fee,0);return {count:rows.length,score:rows.length?rows.reduce((s,b)=>s+b.score,0)/rows.length:0,total:sum,average:rows.length?sum/rows.length:0};};
 const group=institutions.filter(i=>c.reportScope==='同结算等级'?i.level===org.level:c.reportScope==='指定机构'?i.code===org.code||i.name===c.comparison:true).map(i=>({...i,...metrics(i.code)})).filter(i=>i.count),target=metrics(org.code);
 const rank=(field:'score'|'total'|'average')=>1+group.filter(i=>i[field]>target[field]).length;
 const groupMean=(field:'score'|'total'|'average')=>group.length?group.reduce((s,i)=>s+i[field],0)/group.length:0;
 const scope=c.reportScope==='同结算等级'?'同结算等级机构':c.reportScope==='指定机构'?`指定机构（${c.comparison||'尚未选择'}）`:'全区机构';
 const benchmarkReady=!!c.reportScope&&(c.reportScope!=='指定机构'||!!c.comparison)&&group.length>1;
 const benchmarkText=selected.has('横向对标分析')?(benchmarkReady?`在${group.length}家${scope}中，历次风险值均分排名第${rank('score')}，处于前${percent(rank('score'),group.length)}%；违规费用总额排名第${rank('total')}，次均费用排名第${rank('average')}。`:'参照范围或可比样本不足，暂不生成排名及分位结论。'):'本报告未选择横向对标分析，不生成区内对标结论。';
 const keyChecks=h.filter(b=>b.score>60||b.stage!=='形成结果'||b.fee===Math.max(...h.map(b=>b.fee))||b.batch===key?.b.batch||nonzero.some(d=>d.count>1&&(behaviorData(b).find(i=>i.name===d.name)?.amount||0)>0)).sort((a,b)=>b.score-a.score);
 const checkTable=(rows:typeof h):ReportTable=>({columns:['检查批次','检查时间 / 类型','风险值 / 等级','违规费用（万元）','监管阶段'],rows:rows.map(b=>[b.batch,`${b.date} / ${b.type}`,`${f(b.score)} / ${risk(b.score)}`,wan(b.fee),b.stage])});
 const advice1=`针对${top.name}和${second.name}复核原始收费及结算凭证，重点核查${projects[0]?.name||'相关高费用项目'}及${combo.visit}费用，关联检查${latest.batch}。`;
 const advice2=open.length?`加快推进${open.map(b=>b.batch).join('、')}检查，核实${open.map(b=>`${b.batch}（${b.stage}）`).join('、')}的待办材料和审核事项；具体待完成事项未接入，须由承办人员确认。`:'所选范围内无未办结检查，建议复核已办结批次结论及归档材料。';
 const repeatProject=projects.find(p=>p.count>1),advice3=repeatProject?`对${repeatProject.name}开展重复问题核验，该项目在${repeatProject.count}次检查中出现，逐批复核原始项目记录，不能将重复出现直接认定为整改无效。`:'当前无可证明重复出现的项目记录，暂不提出重复项目认定结论。';
 if(selected.has('领导摘要'))add('领导摘要',[{paragraphs:[`截至${SNAPSHOT}，${org.name}在报告范围内共涉及${h.length}次有效监管检查，当前风险等级为${org.risk}，历次风险值均分${f(avg)}分，最新一次检查风险值${f(latest.score)}分。`,`1. 风险总体情况：累计违规费用${wan(total)}万元，次均${wan(total/h.length)}万元，涉及${nonzero.length}类非零违规行为。`,`2. 主要风险来源：主要集中在${top.name}、${second.name}及${combo.visit}费用；${top.name}风险贡献最高。`,`3. 风险变化情况：历次检查风险呈${trend}趋势。${key?`关键变化批次${key.b.batch}，较前次${key.value>=0?'上升':'下降'}${f(Math.abs(key.value))}分。`:'仅一次检查，无法判断关键变化。'}`,`4. 区内对标情况：${benchmarkText}`,`5. 重点检查情况：按所列规则识别${keyChecks.length}次，风险值最高为${highest.batch}，主要涉及${top.name}。`,`6. 监管建议：近期复核${latest.batch}的${top.name}原始凭证；持续监测${combo.visit}费用及重点项目，跟踪${open.length}次未办结检查。`]}]);
 add('一、机构基本情况',[
 {title:'1.1 机构基础信息',table:{columns:['信息项','内容'],rows:[['机构名称',org.name],['机构代码',org.code],['结算等级',org.level],['机构类型',org.category],['数据更新时间',SNAPSHOT]]}},
 {title:'1.2 风险总体概览',paragraphs:[`${org.name}当前风险等级为${org.risk}，报告范围内历次风险值均分${f(avg)}分。最新一次检查为${latest.date}开展的${latest.type}，批次号${latest.batch}，单次风险值${f(latest.score)}分，风险等级为${risk(latest.score)}。`,`截至${SNAPSHOT}，报告范围内累计违规费用${wan(total)}万元，次均${wan(total/h.length)}万元，涉及${nonzero.length}类非零违规行为。`],metrics:[['当前风险等级',org.risk],['历次风险值均分',`${f(avg)}分`],['最新检查风险值',`${f(latest.score)}分`],['违规费用总额',`${wan(total)}万元`],['次均违规费用',`${wan(total/h.length)}万元`],['未办结检查',`${open.length}次`]]},
 {title:'1.3 历次检查记录',paragraphs:['按检查时间倒序展示报告范围内全部有效检查记录。'],table:checkTable(h)}]);
 if(selected.has('历次风险变化'))add('二、历次风险变化',[
 {title:'2.1 风险值变化趋势',graphic:{kind:'line',title:'历次检查风险值折线图',labels:chrono.map(b=>b.date),series:[{name:'单次风险值（分）',values:chrono.map(b=>b.score)}],notes:chrono.map(b=>`${b.date} ${b.type} · ${risk(b.score)} · ${b.batch}${b.batch===highest.batch?' · 最高值':''}${b.batch===lowest.batch?' · 最低值':''}${b.batch===key?.b.batch?' · 最大变化点':''}`)},paragraphs:[`${org.name}历次检查风险总体呈${trend}趋势。最高为${highest.date} ${highest.type}（${highest.batch}），${f(highest.score)}分；最低${f(lowest.score)}分（${lowest.batch}）。`,key?`${key.b.batch}较前一次${key.previous.batch}${key.value>=0?'上升':'下降'}${f(Math.abs(key.value))}分，变化幅度最大。费用构成主要涉及${top.name}和${second.name}；正式变化原因尚需原始风险评价证据核验。`:'仅一次有效检查，无前次可比记录。']},
 {title:'2.2 不同检查类型风险情况',paragraphs:[`${topType.name}平均风险值相对较高，为${f(topType.average)}分。其费用主要涉及${top.name}，正式评分风险维度待核验。`],table:{columns:['检查类型','次数','平均风险值（分）','费用总额（万元）','次均费用（万元）'],rows:typeRows.map(t=>[t.name,String(t.count),f(t.average),wan(t.fee),wan(t.fee/t.count)])}}]);
 if(selected.has('重点风险分析'))add('三、重点风险分析',[
 {title:'3.1 风险归因结论',paragraphs:[`1. ${top.name}风险贡献最高，贡献合计${f(top.contribution)}分，占贡献总和${percent(top.contribution,contributions)}%。`,`2. ${top.name}在${top.count}次检查中出现，${second.name}在${second.count}次检查中出现。重复出现须关联批次核查，不能直接认定持续违规。`,`3. ${top.name}费用最近${consecutive}次相邻检查上升；风险贡献与费用占比分开计算，不将费用变化直接等同于风险成因。`,...(c.reportChanges?.includes('详细')?[`补充核验：逐批关联${h.map(b=>b.batch).join('、')}的原始评分规则、项目凭证和整改记录，区分金额变化、业务量变化及评分变化。`]:[])]},
 {title:'3.2 违规行为构成',graphic:{kind:'bar',title:'8类违规行为费用及风险贡献排序图',labels:behaviors.map(d=>d.name),series:[{name:'违规费用（万元）',values:behaviors.map(d=>d.amount/10000)},{name:'风险贡献（分，独立标尺）',values:behaviors.map(d=>d.contribution)}]},table:{columns:['违规行为','费用（万元）','费用占比','风险贡献（分）','贡献占比'],rows:behaviors.map(d=>[d.name,wan(d.amount),`${percent(d.amount,total)}%`,f(d.contribution),`${percent(d.contribution,contributions)}%`])}},
 {title:'3.3 行为认定与就医类型分析',graphic:{kind:'matrix',title:'行为认定×就医类型热力矩阵（万元）',labels:VISITS,series:BEHAVIORS.map((name,i)=>({name,values:matrix[i].map(n=>n/10000)}))},paragraphs:[`费用较高的组合为“${combo.behavior}＋${combo.visit}”，累计违规费用${wan(combo.amount)}万元，占总体费用${percent(combo.amount,total)}%。`,`险种：未接入职保、居保的可靠分项数据，暂不判断哪类险种较高。本异地：当前数据本地费用占80%、异地占20%；相关正式评分贡献待核验。`]},
 {title:'3.4 重点违规项目',graphic:{kind:'bar',title:'违规金额排名前5项目条形图',labels:projects.slice(0,5).map(p=>p.name),series:[{name:'违规费用（万元）',values:projects.slice(0,5).map(p=>p.amount/10000)}]},paragraphs:[projects.length?`${projects[0].name}累计费用最高，为${wan(projects[0].amount)}万元；${repeatProject?`${repeatProject.name}在${repeatProject.count}次检查中出现，建议核验。`:'暂无重复项目记录。'}`:'当前范围无可用项目明细。','正式项目名称、行为归属及评分关联须以原始明细核验。'],table:{columns:['项目名称 / 代码','累计费用（万元）','涉及检查次数'],rows:projects.slice(0,5).map(p=>[`${p.name} / ${p.code}`,wan(p.amount),String(p.count)])}}]);
 if(selected.has('横向对标分析'))add('四、横向对标分析',[
 {paragraphs:[`对标范围：${scope}。参照组使用相同检查时间、检查类型；并列值采用相同名次（竞赛排名），分位＝名次÷有效参照组机构数。`]},
 {title:'4.1 区内排名与分位',paragraphs:[`截至${SNAPSHOT}，${benchmarkText}`],...(benchmarkReady?{graphic:{kind:'percentile' as const,title:'目标机构风险值分位图',labels:[org.name],series:[{name:'前百分比（%）',values:[rank('score')/group.length*100]}],notes:[`风险值排名第${rank('score')} / ${group.length}家；前百分比越小，排名越靠前。`]}}:{})},
 {title:'4.2 主要指标对比',table:{columns:['指标','目标机构','参照组均值','差值'],rows:[['历次风险值均分（分）',f(target.score),benchmarkReady?f(groupMean('score')):'数据不足',benchmarkReady?f(target.score-groupMean('score')):'—'],['违规费用总额（万元）',wan(total),benchmarkReady?wan(groupMean('total')):'数据不足',benchmarkReady?wan(total-groupMean('total')):'—'],['次均违规费用（万元）',wan(total/h.length),benchmarkReady?wan(groupMean('average')):'数据不足',benchmarkReady?wan(total/h.length-groupMean('average')):'—']]}},
 {title:'4.3 对标差异结论',paragraphs:[benchmarkReady?`主要比较维度为历次风险均分、累计费用及次均费用，差值见上表。各维度单位不同，不跨单位相加或直接认定贡献大小。行为、检查类型及项目层面的正式差异贡献未接入，暂不判断首要差异来源。`:'可比样本或指定比较对象不足，暂不生成差异归因结论。']}]);
 if(selected.has('重点检查概览'))add('五、重点检查概览',[{paragraphs:[`按照风险值大于60分、相邻变化幅度最大、费用最高、同一行为重复出现或尚未办结等条件，识别${keyChecks.length}次重点检查。`,`其中${highest.batch}单次风险值最高，为${f(highest.score)}分，主要涉及${top.name}和${second.name}；${open.length?`${open[0].batch}尚未办结，处于${open[0].stage}阶段。`:'当前无未办结检查。'}单次风险值最高不等同正式机构风险贡献最高。`],table:{columns:['批次','风险值','重点关注依据','当前阶段'],rows:keyChecks.map(b=>[b.batch,f(b.score),[b.score>60?'风险值较高':'',b.stage!=='形成结果'?'未办结':'',b.batch===key?.b.batch?'变化最大':'',b.fee===Math.max(...h.map(b=>b.fee))?'费用最高':'',nonzero.some(d=>d.count>1)?'重复出现行为待核验':''].filter(Boolean).join('；'),b.stage])}}]);
 if(selected.has('检查办理情况'))add('六、检查办理情况',[
 {title:'6.1 总体办理情况',paragraphs:[`该机构报告范围内共有${h.length}次有效检查，${closed}次已办结，${open.length}次尚未办结，办结率${percent(closed,h.length)}%。`],graphic:{kind:'bar',title:'已办结与未办结检查数量对比',labels:['已办结','未办结'],series:[{name:'检查次数',values:[closed,open.length]}]}},
 {title:'6.2 未办结检查',paragraphs:[`当前需跟进${open.length}次检查。${open.length?`阶段分布：${STAGES.filter(s=>s!=='形成结果').map(s=>`${s}${open.filter(b=>b.stage===s).length}次`).join('、')}。`:'没有未办结检查。'}`],table:{columns:['检查批次','当前监管阶段','进入阶段时间','停留天数','承办部门'],rows:open.map(b=>[b.batch,b.stage,b.entered,String(Math.max(0,Math.floor((Date.parse(SNAPSHOT)-Date.parse(b.entered))/86400000))),b.department])}}]);
 if(selected.has('监管建议'))add('七、监管建议',[
 {title:'7.1 近期处置建议',paragraphs:[`1. ${advice1}`,`2. ${advice2}`,`3. ${advice3}`]},
 {title:'7.2 持续监测建议',paragraphs:[`1. 持续监测${top.name}费用与风险值变化，重点关注${combo.visit}；依据批次${latest.batch}。`,projects[0]?`2. 对${projects[0].name}设置观察项，跟踪费用和发生频次，关联${projects[0].count}次历史检查明细。`:'2. 补齐项目明细后设置观察项。',`3. 定期与${scope}按相同时间及检查类型对标，跟踪排名和分位；${benchmarkReady&&selected.has('横向对标分析')?'本次参照数据见横向对标分析章节。':'本次未纳入可靠对标结果，需另行补充分析。'}`]},
 {title:'7.3 后续检查建议',paragraphs:[`1. 下一次检查建议覆盖${combo.visit}及${top.name}相关收费、结算记录，依据${highest.batch}。`,`2. 优先抽取${top.name}和${projects[0]?.name||'高费用项目'}原始明细。`,`3. 结合${h.slice(0,3).map(b=>b.batch).join('、')}历史问题复核，确认问题范围及整改情况。`,'每条建议仅作监管辅助参考，不替代人工核查及行政处理决定。']}]);
 add('八、数据范围与指标说明',[
 {title:'8.1 数据范围',paragraphs:[`本报告使用的数据时间范围为${start}至${end}，数据更新至${SNAPSHOT}，纳入${h.length}次有效监管检查。筛选依据为检查时间（含起止日），检查类型为${c.checkType||'全部类型'}。当前风险等级来自机构最新评级，范围内均分及最新检查按报告筛选条件计算，两者时点口径分别保留。`,'数据主要来源包括：医疗机构基础档案；监管检查记录；检查结果及违规费用明细；风险评价结果；检查办理进度；其他数据来源：项目关联明细。',`生成时间${generatedAt}（Asia/Shanghai）；报告V${base.version}；模板：机构画像报告模板（业务侧）-V1.0。${c.reportChanges?'本次修改：'+c.reportChanges:''}`]},
 {title:'8.2 主要指标口径',table:{columns:['指标','计算口径 / 说明'],rows:[['有效检查数量','范围内唯一有效批次，按检查时间倒序展示；起止日均包含。'],['当前风险等级','机构档案中的最新有效评级；不以最高单次检查值替代。'],['历次风险值均分','报告范围内单次风险值的算术平均，保留两位小数。'],['最新检查风险值','报告范围内检查时间最近一条有效记录的单次风险值。'],['违规费用总额 / 次均费用','分别为范围内费用求和及除以有效检查次数；统一万元，保留两位小数。'],['风险贡献 / 费用占比',`风险贡献使用${PARAM_VERSION}分配值，非正式评分依据；贡献占比以贡献分合计为分母，费用占比以费用总额为分母。`],['风险等级阈值','当前规则：单次值>60高风险，20至60中风险，<20低风险，非正式业务阈值。'],['已办结 / 未办结','形成结果阶段认定已办结，其余阶段未办结；办结率＝已办结次数÷有效检查次数。'],['排名 / 分位','相同时间与检查类型；风险值取历次均分；并列同名次；前百分比＝名次÷有效参照组数量。'],['缺失数据处理','险种、正式评分贡献、正式项目关联及整改结论未接入时明确标记，不补造。']]}}]);
 return {...base,sections:renumberPortraitSections(sections)};
}
export const portraitSections=(c:Context)=>buildPortraitReport(c).sections;
