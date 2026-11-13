export const SCENES = ['浦东新区医疗机构监管概况', '医疗机构监管画像', '监管履历查询'] as const;
export const SNAPSHOT = '2026-11-09';
export const PARAM_VERSION = 'PD-RISK-2026-V1';
export const BEHAVIORS = ['串换药品','不必要医药服务','过度诊疗','超范围支付','重复收费','超量开药','过度检查','分解处方'];
export const VISITS = ['门诊','住院','大病','急观','家床','内设门急诊','急诊','进销存'];
export type Institution = { code:string; name:string; level:string; category:string; score:number; risk:string; previous:string; rising:boolean };
// Fictional Pudong-style institution names for the simulated risk dataset.
const demoAreas=['陆家嘴','潍坊','洋泾','花木','塘桥','南码头','周家渡','上钢','金杨','沪东','浦兴','东明','三林','北蔡','张江','金桥','高桥','高行','高东','曹路','唐镇','合庆','川沙','祝桥','惠南','宣桥','新场','航头','周浦','康桥','大团'];
const demoInstitutionNames=demoAreas.flatMap(area=>[
 `上海浦东${area}和康医院`,
 `上海浦东${area}仁泽综合门诊部`,
 `上海浦东${area}康宁中医门诊部`,
 `上海浦东${area}惠民社区卫生服务站`,
]);
export const institutions: Institution[] = Array.from({length:124},(_,i)=>{
  const high=i<12, medium=i>=12&&i<40;
  const level= `${i%3+1}级`;
  return {code:`PDYB-310115-${String(i===12?1:i<12?i+2:i+2).padStart(3,'0')}`,name:demoInstitutionNames[(i*37+19)%demoInstitutionNames.length], level,category:i===12||i===13?'综合医院':['综合医院','专科医院','社区卫生服务中心'][i%3],score:high?+(65+(11-i)*1.4).toFixed(2):medium?+(58.00-(i-12)*1.1).toFixed(2):+(19-(i-40)*.17).toFixed(2),risk:high?'高风险':medium?'中风险':'低风险',previous:i<2?'中风险':i>=12&&i<15?'低风险':i>=40&&i<44?'中风险':high?'高风险':medium?'中风险':'低风险',rising:i<2||(i>=12&&i<15)};
});
export const DEFAULT_INST = institutions[12];
export type Check = {batch:string;code:string;name:string;type:string;date:string;start:string;end:string;stage:string;entered:string;days:number;limit:number;department:string;fee:number;score:number;priority:string;overdue:boolean;duration?:number};
// Latest dashboard V1.0: result formation closes the case.
const stages=['网审分工','检查实施','调查取证','形成结果'];
export const STAGES=stages;
const batchNames=['FXJC-2026-011','ZXJC-2026-006','RCJC-2026-005','FXJC-2025-009','ZXJC-2025-004','RCJC-2024-003','FXJC-2023-002','RCJC-2022-001'];
export const checks:Check[] = institutions.flatMap((inst,i)=>{
  // 固定分散首页有效检查与在办检查，刷新时保持演示数据稳定。
  const count=i===12?8:i===13?3:i<10?2:1;
  return Array.from({length:count},(_,j)=>{
    const isDefault=i===12,open=isDefault?j<2:(i<7||i===8)||i>=13&&i<=38&&j===0;
    const stage=isDefault?(j===0?'网审分工':j===1?'调查取证':'形成结果'):open?(j>0&&![1,4,8].includes(i)?'形成结果':stages[i%3]):'形成结果';
    const days=isDefault?(j===0?4:j===1?7:0):open?(i<2&&j===1?6:i===0?22:i===1?18:i>=18&&i%4===0?4:2+i%8):0;
    const limit=i<2?14:10;
    const batch=isDefault?batchNames[j]:`${j?'ZXJC':'FXJC'}-2026-${String(100+i*2+j).padStart(3,'0')}`;
    return {batch,code:inst.code,name:inst.name,type:isDefault?['飞行检查','专项检查','日常检查','飞行检查','专项检查','日常检查','飞行检查','日常检查'][j]:i===13?['专项检查','飞行检查','日常检查'][j]:j?'专项检查':i%3===0?'飞行检查':i%3===1?'专项检查':'日常检查',date:isDefault?['2026-10-28','2026-08-18','2026-05-12','2025-10-20','2025-04-15','2024-06-12','2023-08-16','2022-05-19'][j]:i===13?['2026-10-20','2026-09-20','2026-06-20'][j]:i>=18&&i%4===0?'2026-11-03':'2026-10-20',start:isDefault&&j>2?`${2028-j}-01-01`:'2026-01-01',end:isDefault&&j>2?`${2028-j}-09-30`:'2026-09-30',stage,entered:isDefault?j===0?'2026-11-05':'2026-11-02':i>=18&&i%4===0?'2026-11-05':`2026-10-${String(31-days).padStart(2,'0')}`,days,limit,department:'浦东新区医保局',duration:open?days:3+(i+j)%12,fee:isDefault?[360000,220000,180000,140000,100000,80000,70000,50000][j]:Math.round(inst.score*3000),score:isDefault?[78,68,54,50,46,42,37,30][j]:+(Math.min(100,Math.max(0,inst.score+(i%2===0?1:-1)*(3.25+(i%7)*.61+j*1.4)))).toFixed(2),priority:i<2?'高优先级':i<5?'中优先级':'一般关注',overdue:days>limit};
  });
});
// Five monthly new overdue cases; two earlier overdue batches remain open.
[13,14,15,16,17].forEach(i=>{const c=checks.find(c=>c.code===institutions[i].code)!;c.days=12;c.limit=10;c.overdue=true;c.entered='2026-11-01';});
export const currentCheck=checks.find(c=>c.batch==='FXJC-2026-011')!;
export const history=(code:string)=>checks.filter(c=>c.code===code).sort((a,b)=>b.date.localeCompare(a.date));
export const money=(n:number)=>n.toLocaleString('zh-CN',{maximumFractionDigits:2});
export const feeShares=[.15,.05,.10,.25,.35,.05,.05,0];
const visitShares=[.45,.30,.08,.05,.04,.03,.03,.02];
export function indicators(c:Check){
  return BEHAVIORS.flatMap((behavior,b)=>VISITS.flatMap((visit,v)=>['本地','异地'].map((region,r)=>({id:`${b}-${v}-${r}`,behavior,visit,region,amount:Math.round(c.fee*feeShares[b]*visitShares[v]*(r?.2:.8)),weight: +(feeShares[b]/16).toFixed(5),source:`${c.batch}/指标-${b+1}${v+1}${r+1}`}))));
}
export const behaviorData=(c:Check)=>BEHAVIORS.map((name,i)=>({name,amount:Math.round(c.fee*feeShares[i]),contribution:+(c.score*feeShares[i]).toFixed(2)}));
export const riskTrend=[{year:'2021',high:4,medium:26,low:78},{year:'2022',high:7,medium:32,low:80},{year:'2023',high:8,medium:34,low:81},{year:'2024',high:9,medium:32,low:82},{year:'2025',high:10,medium:31,low:83},{year:'2026',high:12,medium:28,low:84}];
export const sources=[{name:'医疗机构档案库',id:'ORG-SNAPSHOT-20261109'},{name:'检查结果库',id:'CHECK-RESULT-20261109'},{name:'风险指标库',id:PARAM_VERSION},{name:'监管流程库',id:'FLOW-SNAPSHOT-20261109'}];
export const metricData=[
 {title:'高风险机构数',value:institutions.filter(i=>i.risk==='高风险').length,unit:'家',label:'当前',color:'#3979ef',action:'查看高风险机构',definition:'按机构代码去重，取最新有效评级为高风险的机构'},
 {title:'本月风险等级上升机构数',value:institutions.filter(i=>i.rising).length,unit:'家',label:'本月',color:'#ed9b32',action:'查看风险等级上升机构',definition:'比较本月与上月有效评级，统计等级上升的机构'},
 {title:'未办结检查数',value:checks.filter(c=>c.stage!=='形成结果').length,unit:'次',label:'当前',color:'#18aaa8',action:'查看未办结检查',definition:'按检查批次统计，当前阶段非“形成结果”为未办结'}
];
