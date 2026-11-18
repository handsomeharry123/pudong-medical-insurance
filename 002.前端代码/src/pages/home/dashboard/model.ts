import { profileInstitutions, hasProfileResult } from '../../analysis/profileData';
import { institutions, checks, history, BEHAVIORS, feeShares, riskTrend, SNAPSHOT, type Check } from '../regulator/data';
import boundary from './pudong-boundary.json';
export const snapshot = SNAPSHOT;
export const riskColors:Record<string,string>={'高风险':'#ff8c72','中风险':'#ffbe58','低风险':'#16d9bb','暂无评级':'#8194ae'};
export const risks=['高风险','中风险','低风险','暂无评级'];
const currentInstitutions=institutions.map(i=>({...i,...profileInstitutions.find(p=>p.code===i.code),level:i.level}));
export const stageNames=['网审分工','检查实施','调查取证','形成结果'];
export const isClosed=(c:Check)=>c.stage==='形成结果';
const currentMonthChecks=checks.filter(c=>c.date.startsWith(snapshot.slice(0,7))&&c.date<=snapshot);
export const totals={monthly:currentMonthChecks.length,monthlyFee:currentMonthChecks.reduce((sum,c)=>sum+c.fee,0),institutions:institutions.length,high:currentInstitutions.filter(i=>i.risk==='高风险').length,rising:institutions.filter(i=>i.rising).length,risingHigh:institutions.filter(i=>i.rising&&i.risk==='高风险').length,checks:checks.length,annual:checks.filter(c=>c.date.startsWith('2026')).length,pending:checks.filter(c=>!isClosed(c)).length,pendingOrgs:new Set(checks.filter(c=>!isClosed(c)).map(c=>c.code)).size,fee:checks.reduce((s,c)=>s+c.fee,0)};
export const orgs=currentInstitutions.map(i=>{const h=history(i.code);return {...i,latest:h.filter(hasProfileResult)[0]?.score||0,scoreChange:i.rising?4:i.previous!==i.risk?-2:0,average:i.score,fee:h.reduce((s,c)=>s+c.fee,0),count:h.length,pending:h.filter(c=>!isClosed(c)).length,change:i.rising?'上升':i.previous!==i.risk?'下降':'持平'};});
export type Org=typeof orgs[number];
export const sortRisk=(a:Org,b:Org)=>risks.indexOf(a.risk)-risks.indexOf(b.risk)||b.latest-a.latest||a.code.localeCompare(b.code);
export const top10=[...orgs].sort(sortRisk).slice(0,10);
export const riskStructure=risks.map(name=>({name,count:orgs.filter(i=>i.risk===name).length,percent:orgs.filter(i=>i.risk===name).length/orgs.length*100}));
export const settlement=['1级','2级','3级'].map(name=>{const items=orgs.filter(i=>i.level===name);return {name,total:items.length,...Object.fromEntries(risks.map(r=>[r,items.filter(i=>i.risk===r).length/items.length*100]))};});
const trendRow=(period:string,high:number,medium:number,low:number)=>({period,高风险:high,中风险:medium,低风险:low});
export const trends={
 '月度':[trendRow('2026-06',8,32,84),trendRow('2026-07',9,31,84),trendRow('2026-08',10,30,84),trendRow('2026-09',10,32,82),trendRow('2026-10',10,31,83),trendRow('2026-11',12,28,84)],
 '季度':[trendRow('2025 Q3',9,33,82),trendRow('2025 Q4',10,31,83),trendRow('2026 Q1',10,32,82),trendRow('2026 Q2',8,32,84),trendRow('2026 Q3',10,32,82),trendRow('2026 Q4',12,28,84)],
 '年度':riskTrend.filter(t=>t.year>='2022').map(t=>trendRow(t.year,t.high,t.medium,t.low))
};
Object.values(trends).forEach(series=>{const last=series[series.length-1];riskStructure.forEach(r=>{if(r.name in last)last[r.name]=r.count;});});
export type Period='年度'|'季度'|'月度';
export function progress(period:Period){const start=period==='年度'?'2026-01-01':period==='季度'?'2026-10-01':'2026-11-01';const rows=checks.filter(c=>c.date>=start&&c.date<=snapshot),done=rows.filter(isClosed).length;return {label:period==='年度'?'2026年度':period==='季度'?'2026年第四季度':'2026年11月',start,total:rows.length,done,pending:rows.length-done,ratio:rows.length?done/rows.length:0};}
export const stages=stageNames.map(name=>{const rows=checks.filter(c=>c.stage===name);return {name,count:rows.length,status:name==='形成结果'?'已办结':'待办',avg:rows.reduce((s,c)=>s+(isClosed(c)?c.duration||0:c.days),0)/(rows.length||1)};});
export const behaviorTotals=BEHAVIORS.map((name,i)=>{const rows=checks.filter(c=>feeShares[i]>0);return {name,color:['#16d6ed','#299aff','#ffb951','#10d6a8','#7b91ff','#ae80ff','#36a5b5','#536d94'][i],amount:Math.round(totals.fee*feeShares[i]),percent:feeShares[i]*100,orgCount:new Set(rows.map(c=>c.code)).size,checkCount:rows.length};}).sort((a,b)=>b.percent-a.percent);
// Explicit project-level mock records. Per-check allocations sum to the actual check total.
const projectNames=['门诊诊察费（重复计费）','常规检验项目（超范围支付）','药品调配项目（串换）','影像检查项目（过度检查）','医用耗材项目（超量计费）','门诊治疗项目（不必要服务）','专科检查项目（重复计费）','药品处方项目（超量开药）'];
export const projectRows=checks.flatMap((check,ci)=>{
 const keys=ci%3===0?[0,1,2,3]:ci%3===1?[0,1,4,5]:[0,1,6,7];
 const weights=[.4,.3,.2,.1];return keys.map((key,k)=>({name:projectNames[key],code:`YB-PD-${String(key+1).padStart(5,'0')}`,amount:Math.round(check.fee*weights[k]),batch:check.batch,org:check.code}));
});
export const projects=projectNames.map((name,i)=>{const rows=projectRows.filter(r=>r.name===name),amount=rows.reduce((s,r)=>s+r.amount,0);return {name,code:`YB-PD-${String(i+1).padStart(5,'0')}`,amount,average:amount/(new Set(rows.map(r=>r.batch)).size||1),count:new Set(rows.map(r=>r.batch)).size};});
export const projectRanking=(mode:string)=>[...projects].sort((a,b)=>mode==='总额'?b.amount-a.amount:b.average-a.average).slice(0,5);
// Display only the largest contiguous mainland polygon; omit offshore islands.
const polygonArea=(poly:number[][][])=>Math.abs(poly[0].reduce((sum,p,i,ring)=>{const next=ring[(i+1)%ring.length];return sum+p[0]*next[1]-next[0]*p[1];},0));
export const polygons=[...(boundary.features[0].geometry.coordinates as number[][][][])].sort((a,b)=>polygonArea(b)-polygonArea(a)).slice(0,1);
const rings=polygons.map(p=>p[0]);
const all=rings.flat(),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
const xFactor=Math.cos((minY+maxY)/2*Math.PI/180),scale=Math.min(560/((maxX-minX)*xFactor),490/(maxY-minY));
export const project=([x,y]:number[])=>[320+(x-(minX+maxX)/2)*xFactor*scale,265-(y-(minY+maxY)/2)*scale];
export const mapPaths=polygons.map(poly=>poly.map(ring=>ring.map((p,i)=>{const [x,y]=project(p);return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;}).join(' ')+'Z').join(' '));
function inside(p:number[],ring:number[][]){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
let seed=310115;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export const points=orgs.map(org=>{let lng=0,lat=0;for(let k=0;k<10000;k++){lng=minX+random()*(maxX-minX);lat=minY+random()*(maxY-minY);if(polygons.some(poly=>inside([lng,lat],poly[0])&&!poly.slice(1).some(hole=>inside([lng,lat],hole))))break;}const [x,y]=project([lng,lat]);return {...org,x,y,lng,lat,radius:3.5+Math.sqrt(org.fee/Math.max(...orgs.map(o=>o.fee)))*6};});
export function summary({mode,highOnly,riskFilter,structure,trend,period,projectMode}:{mode:string;highOnly:boolean;riskFilter?:string;structure?:string;trend:Period;period:Period;projectMode:string}){
 const p=progress(period),t=trends[trend],last=t[t.length-1],before=t[t.length-2],highest=projectRanking(projectMode)[0];
 const leadingBehavior=[...behaviorTotals].sort((a,b)=>b.amount-a.amount)[0];
 const highChange=trends['月度'].at(-1)!.高风险-trends['月度'].at(-2)!.高风险;
 const riskRange=top10.map(org=>org.latest);
 return [
 `全区共有${orgs.length}家医疗机构纳入监管，其中高风险${riskStructure[0].count}家、中风险${riskStructure[1].count}家、低风险${riskStructure[2].count}家，另有${riskStructure[3].count}家待出分、暂无评级。高风险机构较上月${highChange>=0?'增加':'减少'}${Math.abs(highChange)}家。`,
 `${p.label}已完成${p.done}次监管检查，完成率${(p.ratio*100).toFixed(1)}%，目前仍有${p.pending}次待办。`,
 `累计违规费用${(totals.fee/10000).toFixed(2)}万元，其中${leadingBehavior.name}占${leadingBehavior.percent}%，为当前占比最高的违规行为。`,
 `当前${projectMode==='总额'?'违规费用最高':'次均违规费用最高'}的项目为${highest.name}，${projectMode==='总额'?'涉及金额':'次均金额'}${((projectMode==='总额'?highest.amount:highest.average)/10000).toFixed(2)}万元。`,
 `当前机构风险排名第一的是${top10[0].name}，最新检查风险值为${top10[0].latest.toFixed(2)}分。`,
 `风险排名前10的机构，最新检查风险值处于${Math.min(...riskRange).toFixed(2)}—${Math.max(...riskRange).toFixed(2)}分区间。`
 ];
}
