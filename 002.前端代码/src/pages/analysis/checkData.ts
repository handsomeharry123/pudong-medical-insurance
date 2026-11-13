import { getProfileChecks } from './profileData';
export const checkBehaviors=['超范围支付','串换药品/耗材/诊疗','提供不必要的医药服务','过度诊疗','超量开药','过度检查','分解处方','重复收费'];
export const checkColors=['#5d9af8','#8bb6e9','#f08c29','#9874d0','#46aa86','#dfb053','#aa7c65','#0156ff'];
export const insurances=['职保','居保','互助帮困'];
export type CheckItem={id:string;region:string;code:string;name:string;insurance:string;visit:string;method:string;price:number;quantity:number;amount:number;behavior:string};
export type CheckFilters={region:string;insurance:string;visit:string;behaviors:string[];method:string;keyword:string;project:string};
export const defaultCheckFilters:CheckFilters={region:'本地',insurance:'',visit:'',behaviors:[],method:'',keyword:'',project:''};
const seeds=[
 ['其他推拿治疗','S45000000900010',97901.77,7,60],['超声波治疗(单纯超声)','S34010001700010',96498.61,0,20],['神经阻滞麻醉','S33010002a0010',19324.93,7,250],['照胆粉','T001500800',6352.02,2,30],['培植牛黄','T641605302',4433.18,2,251.25],['金属骨针','C0316010890300303519001338',4234.68,3,4200],['普通针刺最高(一级以上医院)','S4300000010040',2705.49,0,40],['小神经阻滞麻醉','S33010002b0010',2139.92,7,120],['一次性无创皮肤吻合器','C140100001',1115.38,2,50],['川贝母粉','T000300190',457.88,0,12],['针刺麻醉','S330100003',252.06,3,60],['椎管内麻醉','S330100004',126.03,3,80],
] as const;
const remainder=[2497.46,313.74,4552.28,66.17,1254,73.08,17.22,3599.67];
const counts=[30,12,40,10,20,10,10,30];
const cents=(n:number)=>Math.round(n*100);
function baseData():CheckItem[]{
 const projects:{name:string;code:string;cents:number;behavior:string;price:number}[]=seeds.map(([name,code,amount,b,price])=>({name,code,cents:cents(amount),behavior:checkBehaviors[b],price}));
 remainder.forEach((amount,b)=>{let left=cents(amount),weight=counts[b]*(counts[b]+1)/2;for(let i=0;i<counts[b];i++){const value=i===counts[b]-1?left:Math.floor(cents(amount)*(counts[b]-i)/weight);left-=value;projects.push({name:`${['医保诊疗项目','医用耗材项目','医药服务项目','诊疗核查项目','处方用药项目','检查项目','处方结算项目','收费核查项目'][b]}${String(i+1).padStart(2,'0')}`,code:`DEMO${b}${String(i+1).padStart(5,'0')}`,cents:value,behavior:checkBehaviors[b],price:10+(i%9)*5});}});
 const visitQuotas=[[101610.50,246.12,302.82],[288.64,25.10,0],[6754.55,8310.23,1388.08],[0,4678.94,0],[1163.16,90.84,0],[0,73.08,0],[17.22,0,0],[100854.28,22112.01,0]].map(row=>row.map(cents));
 const visits=['门诊','住院','大病'];
 const items:CheckItem[]=[];const quotas=[cents(133899.47),cents(113434.86),cents(581.24)];
 function add(project:number,amount:number,insurance:number,visit:string,method='自主筛查'){const p=projects[project];items.push({id:`L${items.length+1}`,region:'本地',code:p.code,name:p.name,insurance:insurances[insurance],visit,method,price:p.price,quantity:+(amount/100/p.price).toFixed(3),amount:amount/100,behavior:p.behavior});p.cents-=amount;quotas[insurance]-=amount;visitQuotas[checkBehaviors.indexOf(p.behavior)][visits.indexOf(visit)]-=amount;}
 [[0,97674.91,1,'门诊'],[1,85416.18,0,'门诊'],[2,13548.46,0,'住院'],[1,10771.55,1,'门诊'],[3,5999.13,0,'门诊'],[4,4433.18,0,'住院'],[5,4234.68,0,'住院'],[2,3255.83,0,'住院'],[6,2671.88,0,'门诊'],[2,2126.79,1,'住院']].forEach(([p,a,i,v])=>add(Number(p),cents(Number(a)),Number(i),String(v)));
 projects.forEach((p,index)=>{while(p.cents>0){const insurance=quotas.findIndex(q=>q>0);if(insurance<0)throw new Error('费用分配不平衡');const budget=visitQuotas[checkBehaviors.indexOf(p.behavior)],visit=budget.findIndex(n=>n>0);if(visit<0)throw new Error('就医类型费用分配不平衡');add(index,Math.min(p.cents,quotas[insurance],budget[visit]),insurance,visits[visit],index%7===0?'规则筛查':'自主筛查');}});
 let cursor=10;while(items.length<278){const row=items[cursor++%items.length];const value=cents(row.amount);if(value<2)continue;const split=Math.floor(value/2);row.amount=(value-split)/100;row.quantity=+(row.amount/row.price).toFixed(3);items.push({...row,id:`L${items.length+1}`,amount:split/100,quantity:+(split/100/row.price).toFixed(3)});}
 return items;
}
const baseline=baseData();
export function getCheckItems(code:string,batch:string):CheckItem[]{
 const check=getProfileChecks(code).find(c=>c.batch===batch);if(!check)return [];
 const target=cents(check.fee),isReference=code==='PDYB-310115-001'&&batch==='FXJC-2024-027';
 const foreign=check.end>='2025-01-01'?Math.round(target*.12):0,local=target-foreign;
 let used=0;const rows=baseline.map((row,i)=>{const amount=isReference?cents(row.amount):i===baseline.length-1?local-used:Math.floor(cents(row.amount)*local/cents(247915.57));used+=amount;return {...row,amount:amount/100,quantity:+(amount/100/row.price).toFixed(3)};});
 if(foreign){let allocated=0;for(let i=0;i<24;i++){const amount=i===23?foreign-allocated:Math.floor(foreign*(24-i)/300);allocated+=amount;const seed=baseline[12+i];rows.push({...seed,id:`F${i+1}`,region:'异地',method:i%2?'规则筛查':'自主筛查',amount:amount/100,quantity:+(amount/100/seed.price).toFixed(3)});}}
 return rows;
}
export function filterCheckItems(rows:CheckItem[],f:CheckFilters){return rows.filter(r=>(f.region==='综合'||r.region===f.region)&&(!f.insurance||r.insurance===f.insurance)&&(!f.visit||r.visit===f.visit)&&(!f.behaviors.length||f.behaviors.includes(r.behavior))&&(!f.method||r.method===f.method)&&(!f.project||r.code===f.project)&&(!f.keyword||`${r.name} ${r.code}`.toLowerCase().includes(f.keyword.trim().toLowerCase())));}
export const sumCheckItems=(rows:CheckItem[])=>rows.reduce((sum,r)=>sum+cents(r.amount),0)/100;
export function groupCheckItems(rows:CheckItem[],key:'behavior'|'insurance'|'region'|'visit'|'code'|'method') {const map=new Map<string,number>();rows.forEach(r=>map.set(r[key],(map.get(r[key])||0)+cents(r.amount)));return [...map].map(([name,value])=>({name,amount:value/100}));}
