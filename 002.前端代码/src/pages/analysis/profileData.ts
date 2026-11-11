import { history, institutions } from '../home/regulator/data';

export const PROFILE_PATH = '/app/modules/analysis/institution-profiles';
// Share institution identity and check records with the dashboard.
export const profileInstitutions=institutions.map(({name,code,risk,level})=>({name,code,risk,level:Number(level.replace('级',''))}));
export type ProfileCheck={batch:string;type:string;start:string;end:string;fee:number;score:number;risk:string;stage:string};
export function getProfileChecks(code:string):ProfileCheck[]{
 return history(code).map(c=>({batch:c.batch,type:c.type,start:c.start,end:c.end,fee:c.fee,score:c.score,risk:c.score>=60?'高风险':c.score>=20?'中风险':'低风险',stage:c.stage==='形成结果'?'已办结':c.stage}));
}
export const feeBehaviors=[
 {name:'重复收费',amount:292702.25,color:'#0156ff',cells:[240066.50,52635.75,0,0,0,0,0,0]},
 {name:'超范围支付',amount:243174.72,color:'#5d9af8',cells:[241867.72,586,0,721,0,0,0,0]},
 {name:'提供不必要的医药服务',amount:39163.50,color:'#2ca578',cells:[16077.50,19780,0,3306,0,0,0,0]},
 {name:'过度诊疗',amount:11138,color:'#8ebcae',cells:[0,11138,0,0,0,0,0,0]},
 {name:'串换药品/耗材/诊疗',amount:2100,color:'#f08c29',cells:[2040,60,0,0,0,0,0,0]},
 {name:'超量开药',amount:1250,color:'#e8b76a',cells:[1034,216,0,0,0,0,0,0]},
 {name:'过度检查',amount:420,color:'#dd7777',cells:[0,420,0,0,0,0,0,0]},
 {name:'分解处方',amount:176.23,color:'#9874d0',cells:[176.23,0,0,0,0,0,0,0]},
];
export const profileVisits=['门诊','住院','急观','大病','家床','内设门急诊','急诊','进销存'];
export const formatMoney=(n:number)=>n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
