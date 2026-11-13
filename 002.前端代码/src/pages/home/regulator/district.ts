import { institutions, checks, history, riskTrend, BEHAVIORS, behaviorData, indicators, SNAPSHOT, money, STAGES } from './data';
import type { Context, Result } from './engine';
export type DistrictStep='overview'|'trend'|'changes'|'regions'|'focus'|'common'|'levels'|'compare'|'levelTrend'|'list'|'progress'|'checkList'|'long'|'institutionSummary'|'checkSummary';
export type DistrictQuery={step:DistrictStep;branch?:'A'|'B'|'C'|'D';year?:string;from?:string;to?:string;level?:string;risk?:string;town?:string;change?:'rising'|'changed';annualChange?:boolean;annual?:boolean;focus?:boolean;behavior?:string;stage?:string;unfinished?:boolean;checkType?:string;referenceDays?:number};
export const districtQuestions=['查看全区医疗机构风险分布及变化趋势','查询高风险或风险等级上升的机构','按结算等级分析机构风险情况','查看本年度检查办理进度及未办结检查'];
export const districtWelcome='您好！我是医小保。\n\n您可以直接告诉我想了解的全区医疗机构监管情况，支持按**风险等级、结算等级、时间范围、监管阶段**等维度进行查询和分析。\n\n我将为您展示监管概览、机构清单和趋势分析，并支持进一步查看机构画像或单次检查详情。';
// Explicit demo fixtures. Replace this adapter with dated, valid rating records when a service is connected.
export const towns=['陆家嘴街道','花木街道','张江镇','北蔡镇','川沙新镇','金桥镇'];
export function ratings(year=SNAPSHOT.slice(0,4)){
 const snapshot=riskTrend.find(r=>r.year===year);if(!snapshot)return [];
 return institutions.slice(0,snapshot.high+snapshot.medium+snapshot.low).map((i,k)=>{
  const current=year===SNAPSHOT.slice(0,4),risk=current?i.risk:k<snapshot.high?'高风险':k<snapshot.high+snapshot.medium?'中风险':'低风险';
  const score=current?i.score:risk==='高风险'?65+(snapshot.high-k)*1.1:risk==='中风险'?25+(snapshot.high+snapshot.medium-k)*.65:8+(k%30)*.3;
  const prev=riskTrend.find(t=>+t.year===+year-1),previous=current?i.previous:prev?(k<prev.high?'高风险':k<prev.high+prev.medium?'中风险':'低风险'):undefined;
  const previousScore=current?i.score+(i.rising?-8:i.previous!==i.risk?8:0):undefined;
  return {...i,risk,score:+score.toFixed(2),previous,previousScore,town:k===123?'地址待匹配':towns[k%towns.length],year};
 });
}
export type Rating=ReturnType<typeof ratings>[number];
export const latestInspection=(i:Rating)=>history(i.code).find(b=>b.date.slice(0,4)<=i.year);
export const displayRiskValue=(i:Rating)=>i.year===SNAPSHOT.slice(0,4)?latestInspection(i)?.score??i.score:i.score;
const rank=(risk:string)=>['低风险','中风险','高风险'].indexOf(risk);
export function isRising(i:Rating,annual=false){const previous=annual?ratings(String(+i.year-1)).find(r=>r.code===i.code):undefined;return annual?!!previous&&(i.score>previous.score||rank(i.risk)>rank(previous.risk)):!!i.previous&&rank(i.risk)>rank(i.previous);}
export function institutionRows(q:DistrictQuery){return ratings(q.year).filter(i=>(!q.level||i.level===q.level)&&(!q.risk||i.risk===q.risk)&&(!q.town||i.town===q.town)&&(!q.change||(q.change==='rising'?isRising(i,q.annualChange):i.previous!==i.risk))&&(!q.focus||i.risk==='高风险'||isRising(i))&&(!q.behavior||checks.some(b=>b.code===i.code&&b.date.startsWith(q.year||SNAPSHOT.slice(0,4))&&behaviorData(b).some(d=>d.name===q.behavior&&d.amount>0)))).sort((a,b)=>q.change==='changed'?Number(isRising(b))-Number(isRising(a))||b.score-a.score:b.score-a.score);}
export const stay=(b:typeof checks[number])=>b.stage==='形成结果'?b.days:Math.max(0,Math.floor((Date.parse(SNAPSHOT)-Date.parse(b.entered))/86400000));
export function checkRows(q:DistrictQuery){return checks.filter(b=>b.date.startsWith(q.year||SNAPSHOT.slice(0,4))&&(!q.stage||b.stage===q.stage)&&(!q.unfinished||b.stage!=='形成结果')&&(!q.checkType||b.type===q.checkType)).sort((a,b)=>stay(b)-stay(a));}
export function levelRows(q:DistrictQuery){const all=ratings(q.year);return ['1级','2级','3级'].map(level=>{const rows=all.filter(i=>i.level===level),high=rows.filter(i=>i.risk==='高风险').length;return {name:level,total:rows.length,high,medium:rows.filter(i=>i.risk==='中风险').length,low:rows.filter(i=>i.risk==='低风险').length,rate:rows.length?+(high/rows.length*100).toFixed(1):0,average:rows.length?+(rows.reduce((s,i)=>s+i.score,0)/rows.length).toFixed(2):0,rising:rows.filter(i=>isRising(i)).length};});}
export function regionRows(q:DistrictQuery){const all=ratings(q.year);return [...towns,'地址待匹配'].map(name=>{const rows=all.filter(i=>i.town===name),high=rows.filter(i=>i.risk==='高风险').length;return {name,total:rows.length,high,rate:rows.length?+(high/rows.length*100).toFixed(1):0};}).sort((a,b)=>b.high-a.high);}
export function commonRows(q:DistrictQuery){const codes=new Set(institutionRows({...q,focus:true,risk:undefined,change:undefined}).map(i=>i.code)),rows=checks.filter(b=>codes.has(b.code)&&b.date.startsWith(q.year||SNAPSHOT.slice(0,4)));return BEHAVIORS.map(name=>({name,amount:rows.reduce((s,b)=>s+(behaviorData(b).find(d=>d.name===name)?.amount||0),0),contribution:+rows.reduce((s,b)=>s+(behaviorData(b).find(d=>d.name===name)?.contribution||0),0).toFixed(2)})).sort((a,b)=>b.amount-a.amount);}
export function respondDistrict(text:string,previous:Context):Result|null{
 if(previous.scene!==1)return null;
 const c:Context={...previous,analysis:[...previous.analysis]},prior=previous.district;
 let q:DistrictQuery={...(prior||{step:'overview'}),year:prior?.year||SNAPSHOT.slice(0,4)};
 const clean=()=>{q={step:'overview',year:SNAPSHOT.slice(0,4)};c.institution=undefined;c.batch=undefined;};
 const years=[...text.matchAll(/(20\d{2})年?/g)].map(m=>m[1]);
 const level=text.match(/([一二三123])级(?:结算)?/)?.[1];
 const selectedLevel=level?`${({'一':'1','二':'2','三':'3'} as Record<string,string>)[level]||level}级`:undefined;
 if(/高风险.*(?:未办结|没有办结)/.test(text))return null;
 const inst=institutions.find(i=>text.includes(i.code)||text.includes(i.name));
 const batch=text.match(/(?:FXJC|ZXJC|RCJC)-\d{4}-\d{3}/i)?.[0].toUpperCase();
 let content='',steps:string[]=[],actions:string[]=[];
 if(batch){const b=checks.find(b=>b.batch===batch);if(!b)return result(`未找到检查批次${batch}，请核对批次号。`,[]);if(inst&&inst.code!==b.code)return result('机构与检查批次不匹配，请核对后重试。',[]);c.institution=b.code;c.batch=b.batch;q.step='checkSummary';content=`${b.name} ${b.batch}为${b.type}，单次检查风险值${b.score.toFixed(2)}分，${b.score>60?'高风险':b.score<20?'低风险':'中风险'}，违规费用${money(b.fee)}元。主要涉及${behaviorData(b).filter(d=>d.amount>0).sort((a,b)=>b.amount-a.amount).slice(0,2).map(d=>d.name).join('、')}。当前处于${b.stage}阶段，已停留${stay(b)}天。`;actions=['查看单次检查详情'];}
 else if(inst){c.institution=inst.code;c.batch=history(inst.code)[0]?.batch;q.step='institutionSummary';const h=history(inst.code),b=h[0];content=`${inst.name}当前为${inst.risk}，历次风险值均分${(h.reduce((s,b)=>s+b.score,0)/h.length).toFixed(2)}分，最新检查风险值${b.score.toFixed(2)}分。主要风险集中在${behaviorData(b).sort((a,b)=>b.amount-a.amount).slice(0,2).map(d=>d.name).join('、')}；最新检查为${b.date} ${b.type}，目前处于${b.stage}阶段。`;actions=['查看完整机构画像'];}
 else{
 if(/风险分布及变化趋势|全区.*监管结果|全区监管概览/.test(text)){clean();q.step='overview';q.branch='A';}
 else if(/高风险或风险等级上升/.test(text)){clean();q.step='focus';q.branch='B';}
 else if(/本年度检查办理进度及未办结|监管进度情况|检查办理进度|进度概览/.test(text)){clean();q.step='progress';q.branch='D';}
 else if(/按结算等级分析/.test(text)){clean();q.step='levels';q.branch='C';}
 else if(/共性风险|重点机构.*问题/.test(text)){q.step='common';q.branch='B';q.focus=true;q.risk=undefined;q.change=undefined;}
 else if(/区域分布|集中在哪些区域/.test(text)){q={step:'regions',branch:'A',year:q.year};}
 else if(/本月.*风险变化|本月.*风险等级.*变化/.test(text)){q={step:'changes',branch:'A',year:q.year,change:'changed'};}
 else if(/等级.*趋势|结算等级.*变化趋势/.test(text)){q={step:'levelTrend',branch:'C',year:q.year};}
 else if(/比较结算等级|哪个结算等级|不同结算等级.*比较/.test(text)){q={step:'compare',branch:'C',year:q.year};}
 else if(/查看指定等级/.test(text)){return result('请选择要查看的结算等级。',['查看一级结算机构中的高风险机构','查看二级结算机构中的高风险机构','查看三级结算机构中的高风险机构']);}
 else if(/历史趋势|近几年|近[五5]年|风险结构.*变化|变化趋势/.test(text)){q={step:'trend',branch:'A',year:q.year};q.from=/近[五5]年/.test(text)?String(+SNAPSHOT.slice(0,4)-4):'2023';q.to=SNAPSHOT.slice(0,4);}
 else if(/办理时间.*长|停留.*长|超期/.test(text)){q.step='long';q.branch='D';q.unfinished=true;}
 else if(/未办结|尚未办结|未完成检查|阶段.*检查|处于.*阶段|只看.*检查/.test(text)){q.step='checkList';q.branch='D';if(/未办结|未完成/.test(text))q.unfinished=true;}
 else if(/高风险|中风险|低风险|风险.*上升|上升.*机构|机构名单|机构明细|涉及.*重点机构/.test(text)){q.step='list';}
 else if(/结算等级/.test(text)){q.step='levels';q.branch='C';}
 else return null;
 if(years.length){q.year=years[years.length-1];if(q.step==='list')q.annual=true;if(q.step==='trend'||q.step==='levelTrend'){q.from=years[0];q.to=years[years.length-1];if(years.length===1)q.from=q.year;}}
 if(/本年度|今年/.test(text))q.year=SNAPSHOT.slice(0,4);
 if(selectedLevel)q.level=selectedLevel;
 if(q.step==='list'){
  q.risk=['高风险','中风险','低风险'].find(r=>text.includes(r))||q.risk;
  if(/上升/.test(text)){q.change='rising';q.risk= /只看.*新增高风险/.test(text)?'高风险':undefined;q.annualChange=years.length>0||prior?.step==='levelTrend';}
  else if(/风险机构|高风险名单/.test(text)){q.change=undefined;q.annualChange=false;q.focus=false;q.behavior=undefined;}
  const town=towns.find(t=>text.includes(t));if(town)q.town=town;
  const behavior=BEHAVIORS.find(b=>text.includes(b));if(behavior){q.behavior=behavior;q.focus=true;q.risk=undefined;q.change=undefined;}
 }
 if(q.branch==='D'){
  if(prior?.branch!=='D')q={step:q.step,branch:'D',year:q.year,unfinished:q.unfinished};
  const stage=STAGES.find(s=>text.includes(s));if(stage){q.stage=stage;q.unfinished=stage!=='形成结果';}
  const type=['飞行检查','专项检查','日常检查'].find(t=>text.includes(t));if(type)q.checkType=type;
  const limit=text.match(/(?:时限|参考|超过)\s*(\d+)\s*天/);if(limit)q.referenceDays=+limit[1];
 }
 const all=ratings(q.year),rows=institutionRows(q),high=all.filter(i=>i.risk==='高风险'),up=all.filter(i=>isRising(i)),down=all.filter(i=>i.previous&&rank(i.risk)<rank(i.previous));
 if(!all.length&&q.branch!=='D')return result(`${q.year}年暂无可用评级记录，无法生成结论。请选择有数据的年度。`,riskTrend.map(r=>`查看${r.year}年高风险机构`),[]);
 const select=()=>rows.slice(0,3).map(i=>`查看${i.name}的具体情况`);
 if(q.step==='overview'){const nets=['高风险','中风险','低风险'].map(r=>{const delta=all.filter(i=>i.risk===r).length-all.filter(i=>i.previous===r).length;return `${r}较上月${delta>=0?'增加':'减少'}${Math.abs(delta)}家`;});content=`截至${SNAPSHOT}，全区${all.length}家机构纳入监管评级，高风险${high.length}家、中风险${all.filter(i=>i.risk==='中风险').length}家、低风险${all.filter(i=>i.risk==='低风险').length}家。${nets.join('、')}。本月${up.length}家风险上升、${down.length}家下降，其余${all.length-up.length-down.length}家不变。`;actions=['查看历史趋势','查看本月风险变化','查看区域分布'];}
 if(q.step==='trend'){const trend=riskTrend.filter(t=>t.year>=(q.from||'2023')&&t.year<=(q.to||'2026'));const changes=trend.slice(1).map((r,i)=>({year:r.year,delta:r.high-trend[i].high})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));content=trend.length?`${trend[0].year}—${trend.at(-1)!.year}年，高风险机构从${trend[0].high}家变化为${trend.at(-1)!.high}家，中风险从${trend[0].medium}家变化为${trend.at(-1)!.medium}家，低风险从${trend[0].low}家变化为${trend.at(-1)!.low}家。${changes.length?`${changes[0].year}年高风险机构变化最明显，同比${changes[0].delta>=0?'增加':'减少'}${Math.abs(changes[0].delta)}家。`:''}`:'所选年份范围暂无数据。';actions=trend.slice(-3).map(t=>`查看${t.year}年高风险机构`);}
 if(q.step==='changes'){content=`本月${up.length}家机构风险等级上升，${down.length}家下降，${all.length-up.length-down.length}家保持不变。以下为全部等级变化机构，上升机构优先展示。`;actions=select();}
 if(q.step==='regions'){const regions=regionRows(q).filter(r=>r.name!=='地址待匹配'),top=[...regions].sort((a,b)=>b.rate-a.rate)[0];content=`高风险机构主要分布于${regions.slice(0,3).map(r=>`${r.name}（${r.high}家）`).join('、')}。${top.name}高风险率最高，为${top.rate}%。地址待匹配${all.filter(i=>i.town==='地址待匹配').length}家单独列示。`;actions=regions.slice(0,3).map(r=>`查看${r.name}的高风险机构`);}
 if(q.step==='focus'){content=`当前高风险机构${high.length}家，本月风险等级上升${up.length}家，其中${up.filter(i=>i.risk==='高风险').length}家为新增高风险机构。下方分组展示高风险前5名及风险上升机构，可横向滚动查看完整字段。`;actions=['查看高风险机构','查看风险上升机构','分析共性风险'];}
 if(q.step==='common'){const common=commonRows(q);content=`在${q.year}年度重点机构有效检查中，${common.slice(0,2).map(d=>`${d.name}违规费用${money(d.amount)}元`).join('、')}。下方按风险贡献展示前5维度，同时列示就医类型和项目明细。风险贡献为各检查贡献分之和，费用占比单独计算。`;actions=common.filter(d=>d.amount>0).slice(0,3).map(d=>`查看涉及${d.name}的重点机构`);}
 if(['levels','compare','levelTrend'].includes(q.step)){const levels=levelRows(q),rate=[...levels].sort((a,b)=>b.rate-a.rate)[0],average=[...levels].sort((a,b)=>b.average-a.average)[0];content=`${q.year}年，${rate.name}结算机构的高风险率最高，为${rate.rate}%；${average.name}平均风险值最高，为${average.average.toFixed(2)}分。${q.step==='levelTrend'?'以下展示各年度结算等级平均风险值与高风险率；年度结算等级为数据快照。':'判断依据为高风险率和平均风险值，详见对比结果。'}`;actions=q.step==='levels'?['比较结算等级','查看指定等级','查看等级趋势']:q.step==='levelTrend'?levels.map(l=>`查看${q.year}年风险上升的${l.name}结算机构`):levels.map(l=>`查看${l.name}结算机构中的高风险机构`);}
 if(q.step==='list'){const scope=all.filter(i=>!q.level||i.level===q.level);content=`${q.year}年${q.level?`${q.level}结算机构共${scope.length}家，`:''}符合${q.town||''}${q.risk||''}${q.change==='rising'?(q.annualChange?'年度风险上升':'本月风险等级上升'):''}${q.behavior||''}条件的机构共${rows.length}家。${rows.length?`风险值排名前三：${rows.slice(0,3).map(i=>`${i.name}（${(q.annual?i.score:displayRiskValue(i)).toFixed(2)}分）`).join('、')}。`:'请调整查询条件。'}请选择机构查看核心摘要。`;actions=select();}
 if(q.step==='progress'){const allChecks=checkRows({...q,stage:undefined,unfinished:false}),closed=allChecks.filter(b=>b.stage==='形成结果').length;content=`${q.year}年度共${allChecks.length}次有效检查，${STAGES.map(s=>`${s}${allChecks.filter(b=>b.stage===s).length}次`).join('、')}。已办结${closed}次，未办结${allChecks.length-closed}次。“形成结果”按现有业务口径认定为已办结。`;actions=['查看未办结检查','查看调查取证阶段的检查','查看办理时间较长检查'];}
 if(q.step==='checkList'||q.step==='long'){const list=checkRows(q),average=list.length?list.reduce((s,b)=>s+stay(b),0)/list.length:0;content=`${q.year}年${q.stage||''}${q.unfinished?'未办结':''}检查共${list.length}次${q.stage?`，平均停留${average.toFixed(1)}天`:''}。${q.step==='long'?'以下按当前阶段停留天数降序展示前5项，超出参考时限标记超期。':'按当前阶段停留天数降序排列，请选择具体批次。'}`;actions=list.slice(0,3).map(b=>`查看${b.name}${b.batch}批次的检查情况`);}
 }
 steps=[`正在识别条件：${q.year}年${q.level?' · '+q.level:''}${q.stage?' · '+q.stage:''}`,q.step==='checkSummary'?'按机构代码和检查批次关联风险、费用与当前阶段':q.branch==='D'?'正在按有效检查批次去重，统计四阶段及办理时效':'正在按机构代码关联评级快照、历史检查及机构档案','已完成数据汇总，正在生成结论和后续查询'];
 return result(content,actions);
 function result(content:string,actions:string[],views:Result['views']=['district']):Result{c.district=q;c.year=q.year||c.year;return {node:100,context:c,content,steps,views,actions,citations:[`数据快照 · ${SNAPSHOT}`,'业务流程依据 · 11.12-V1.0 · 场景一']};}
}
