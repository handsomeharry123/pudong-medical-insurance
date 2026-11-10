import { institutions, checks, history, BEHAVIORS, feeShares, riskTrend, SNAPSHOT, type Check } from '../regulator/data';
import boundary from './pudong-boundary.json';
export const snapshot = SNAPSHOT;
export const riskColors:Record<string,string>={'高风险':'#ff8c72','中风险':'#ffbe58','低风险':'#16d9bb'};
export const risks=['高风险','中风险','低风险'];
export const stageNames=['网审分工','检查实施','调查取证','形成结果'];
export const isClosed=(c:Check)=>c.stage==='形成结果';
export const totals={institutions:institutions.length,high:institutions.filter(i=>i.risk==='高风险').length,rising:institutions.filter(i=>i.rising).length,risingHigh:institutions.filter(i=>i.rising&&i.risk==='高风险').length,checks:checks.length,annual:checks.filter(c=>c.date.startsWith('2026')).length,pending:checks.filter(c=>!isClosed(c)).length,pendingOrgs:new Set(checks.filter(c=>!isClosed(c)).map(c=>c.code)).size,fee:checks.reduce((s,c)=>s+c.fee,0)};
export const orgs=institutions.map(i=>{const h=history(i.code);return {...i,latest:h[0]?.score||0,scoreChange:i.rising?4:i.previous!==i.risk?-2:0,average:h.reduce((s,c)=>s+c.score,0)/(h.length||1),fee:h.reduce((s,c)=>s+c.fee,0),count:h.length,pending:h.filter(c=>!isClosed(c)).length,change:i.rising?'上升':i.previous!==i.risk?'下降':'持平'};});
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
export type Period='年度'|'季度'|'月度';
export function progress(period:Period){const start=period==='年度'?'2026-01-01':period==='季度'?'2026-10-01':'2026-11-01';const rows=checks.filter(c=>c.date>=start&&c.date<=snapshot),done=rows.filter(isClosed).length;return {label:period==='年度'?'2026年度':period==='季度'?'2026年第四季度':'2026年11月',start,total:rows.length,done,pending:rows.length-done,ratio:rows.length?done/rows.length:0};}
export const stages=stageNames.map(name=>{const rows=checks.filter(c=>c.stage===name);return {name,count:rows.length,status:name==='形成结果'?'已办结':'待办',avg:rows.reduce((s,c)=>s+(isClosed(c)?c.duration||0:c.days),0)/(rows.length||1)};});
export const behaviorTotals=BEHAVIORS.map((name,i)=>{const rows=checks.filter(c=>feeShares[i]>0);return {name,amount:Math.round(totals.fee*feeShares[i]),percent:feeShares[i]*100,orgCount:new Set(rows.map(c=>c.code)).size,checkCount:rows.length};});
// Explicit project-level mock records. Per-check allocations sum to the actual check total.
const projectNames=['门诊诊察费（重复计费）','常规检验项目（超范围支付）','药品调配项目（串换）','影像检查项目（过度检查）','医用耗材项目（超量计费）','门诊治疗项目（不必要服务）','专科检查项目（重复计费）','药品处方项目（超量开药）'];
export const projectRows=checks.flatMap((check,ci)=>{
 const keys=ci%3===0?[0,1,2,3]:ci%3===1?[0,1,4,5]:[0,1,6,7];
 const weights=[.4,.3,.2,.1];return keys.map((key,k)=>({name:projectNames[key],code:`YB-PD-${String(key+1).padStart(5,'0')}`,amount:Math.round(check.fee*weights[k]),batch:check.batch,org:check.code}));
});
export const projects=projectNames.map((name,i)=>{const rows=projectRows.filter(r=>r.name===name),amount=rows.reduce((s,r)=>s+r.amount,0);return {name,code:`YB-PD-${String(i+1).padStart(5,'0')}`,amount,average:amount/(new Set(rows.map(r=>r.batch)).size||1),count:new Set(rows.map(r=>r.batch)).size};});
export const projectRanking=(mode:string)=>[...projects].sort((a,b)=>mode==='总额'?b.amount-a.amount:b.average-a.average).slice(0,5);
const polygons=(boundary.features[0].geometry.coordinates as number[][][][]);
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
 const filterLabel=riskFilter?`筛选${orgs.filter(i=>i.risk===riskFilter).length}家${riskFilter}`:`全部${orgs.length}家`;
 return [
 `03${mode}·${filterLabel}；01${structure||'占比'}高/中/低${riskStructure.map(r=>r.count).join('/')}家。${trend}趋势高风险较上期${last.高风险-before.高风险>=0?'+':''}${last.高风险-before.高风险}家。`,
 `${p.label}已办${p.done}/${p.total}次（${(p.ratio*100).toFixed(1)}%），待办${p.pending}次。风险TOP1最新检查${top10[0].latest.toFixed(2)}分。`,
 `${leadingBehavior.name}费用占比${leadingBehavior.percent}%；项目${projectMode}TOP1：${highest.name}，${((projectMode==='总额'?highest.amount:highest.average)/10000).toFixed(2)}万元。`
 ];
}
