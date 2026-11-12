import { respondHistory } from './historyFlow';
import { respondDistrict, districtQuestions, districtWelcome, type DistrictQuery } from './district';
import { portraitRespond, portraitWelcome } from './portrait';
import rawCatalog from './catalog.json';
import { checks, currentCheck, DEFAULT_INST, history, institutions, money, SCENES, PARAM_VERSION, SNAPSHOT, type Check, type Institution } from './data';
export const catalog=rawCatalog;
export type Scene=1|2|3;
export type View='portrait'|'district'|'overview'|'institutions'|'trend'|'levels'|'progress'|'checks'|'timeline'|'cross'|'tasks'|'task'|'profile'|'attribution'|'check'|'behavior'|'matrix'|'projects'|'history'|'benchmark'|'dimensions'|'suggestions'|'report'|'candidates'|'materials';
export type Context={reportGeneratedAt?:string;portraitStep?:string;portraitCandidates?:string[];portraitDone?:string[];reportModules?:string[];reportScope?:string;reportRange?:string;reportChanges?:string;district?:DistrictQuery;scene:Scene;institution?:string;batch?:string;year:string;risk?:string;level?:string;stage?:string;overdue?:boolean;unfinished?:boolean;start?:string;end?:string;rising?:boolean;behavior?:string;visit?:string;region?:string;checkType?:string;comparison?:string;analysis:number[];reportVersion:number;reportFocus?:string;pending?:string;recordCodes?:string[];recordSort?:string;recordLimit?:number;recordIds?:string[];reportSections?:string[];reportBrief?:boolean;reportRevisions?:string[];trendYear?:string};
export type Result={node:number;content:string;steps:string[];views:View[];actions:string[];context:Context;citations:string[]};
export const newContext=():Context=>({scene:1,year:'2026',analysis:[],reportVersion:0});
export const welcomes=[
districtWelcome,
portraitWelcome,
'您好！我是医小保。\n\n您可以直接告诉我想查询的监管信息，支持按医疗机构、时间范围、检查批次、监管阶段、风险等级等条件检索，也可以组合多个条件进行查询。\n\n例如：查询某医疗机构本年度全部监管记录；查看某医疗机构最近一次检查情况；查询全区风险最高的5条监管记录。'];
export const sceneQuestions=[districtQuestions,['帮我查看浦东新区中医医院的监管画像。','查询机构代码PDYB-310115-001对应机构的画像。'],['查询浦东新区中医医院本年度全部监管记录。','查看浦东新区中医医院最近一次检查情况。','查询全区风险最高的5条监管记录。']];
const views:View[][]=[
['overview','levels'],['institutions'],['profile'],['trend'],['institutions'],['levels'],['institutions'],['progress'],['checks'],['timeline'],['candidates'],['check'],['progress','checks'],['cross'],['tasks'],['task'],
['profile'],['profile'],['attribution'],['checks','history'],['attribution','dimensions'],['checks','behavior','matrix','dimensions','projects'],['benchmark','history'],['behavior','matrix','history'],['projects','checks'],['benchmark','history'],['benchmark','dimensions'],['benchmark','projects','history'],['suggestions'],['suggestions','projects'],['report'],['report'],['checks'],['check'],['check'],
['check'],['check'],['behavior'],['behavior','matrix'],['projects'],['history'],['history','behavior'],['behavior'],['benchmark'],['benchmark','behavior'],['benchmark'],['dimensions','matrix'],['behavior','matrix'],['dimensions','matrix'],['projects'],['matrix'],['suggestions'],['suggestions'],['report'],['report']];
const nexts:Record<number,number[]>={0:[1,3,5,7,13],1:[16],2:[18,25,32],3:[4,5],4:[16,35],5:[6,3],6:[16],7:[8,12,13],8:[9,10],9:[36,16],10:[9],11:[37,40],12:[9,13],13:[14],14:[15],15:[16,9,36],16:[18,25,32],17:[18,25],18:[19,21,23,25,28,30],19:[20,33,28],20:[33,25],21:[22,24,28],22:[24,28,30],23:[24,25,28],24:[33,25],25:[26,27,18,28,30],26:[27,24,28],27:[24,28,30],28:[29,30,32],29:[24,30],30:[31,32],31:[30,32],32:[33],33:[37,40,43],34:[37,40,43],35:[37,40,43],36:[37,40,43],37:[38,46,40],38:[39,50],39:[50,40],40:[41,42,43],41:[42,51],42:[51],43:[44,45,51],44:[47,50],45:[44,51],46:[47,48,50],47:[50,49],48:[50],49:[50],50:[51,53],51:[52,53],52:[53],53:[54],54:[53]};
const overrides:Record<number,(c:Context,i:Institution,b:Check)=>string>={
18:(_,i)=>`该机构当前风险主要来自三个方面：一是最近三次检查风险值较高，其中2026年10月飞行检查风险值最高；二是飞行检查的次均违规费用高于专项检查和日常检查；三是重复收费、超范围支付和门诊费用为主要风险贡献维度。当前机构综合指数${i.score}分，不能将最高单次检查分值等同于机构综合指数。您可以继续按单次检查、检查类型或风险维度溯源，也可以进入横向对标。`,
19:(_,i)=>{const h=history(i.code),top=[...h].sort((a,b)=>b.score-a.score).slice(0,3);return `对机构总体风险影响最大的检查为${top.map(b=>b.batch).join('、')}。其中${top[0].batch}单次指数${top[0].score}分，高于历次算术均分${(h.reduce((s,b)=>s+b.score,0)/h.length).toFixed(2)}分；该批次违规费用占总额的${(top[0].fee/h.reduce((s,b)=>s+b.fee,0)*100).toFixed(1)}%。可继续查看检查及项目明细。`;},
20:(_,i,b)=>`该次${b.type}单次风险指数${b.score}分，违规费用${money(b.fee)}元。主要风险集中在重复收费（${money(b.fee*.35)}元）和超范围支付（${money(b.fee*.25)}元），门诊占45%，本地占80%。可进入场景三查看${b.batch}的完整详情。`,
21:(_,i)=>{const h=history(i.code).filter(b=>b.type==='飞行检查'),total=h.reduce((s,b)=>s+b.fee,0);return `该机构共有${h.length}次飞行检查，平均风险值${(h.reduce((s,b)=>s+b.score,0)/(h.length||1)).toFixed(2)}分，次均违规费用${money(total/(h.length||1))}元。主要费用集中在重复收费和超范围支付，门诊高于住院，本地为主要构成。可继续查看全区同类飞行检查对标。`;},
22:()=>`已建立同类型飞行检查参照组。请结合下方动态排名和分位结果，分别比较总额与次均违规费用；可继续穿透重复收费、超范围支付或生成报告。`,
23:(_,i,b)=>`该机构风险贡献较高的维度为重复收费、超范围支付和门诊费用。以当前检查${b.batch}为例，重复收费占违规费用35%，超范围支付占25%，门诊占45%。历次变化及行为认定×就医类型矩阵如下，可继续穿透检查与项目。`,
24:(_,i,b)=>`重复收费主要来自最近的飞行检查和专项检查，费用以门诊、本地数据为主。当前${b.batch}批次重复收费${money(b.fee*.35)}元。以下展示相关检查贡献、项目清单及费用来源，可继续查看检查详情或横向对标。`,
25:(c,i)=>`已匹配同结算等级、同机构类型的参照机构，当前机构${i.name}综合风险指数${i.score}分。下方可切换全区、同结算等级、同机构类型或指定机构，并分别查看风险指数、违规费用总额与次均。参照范围、排名和分位随条件更新，避免混用比较口径。`,
26:(c,i)=>`正在比较${i.name}与${c.comparison||'浦东新区人民医院'}。主要差异集中在重复收费、飞行检查和门诊费用。下方按统一检查范围拆解差异，可继续比较指定维度，或返回风险溯源查看相关检查与项目。`,
27:(_,i,b)=>`已锁定重复收费，按同一数据范围分别比较总额与次均金额，并展示项目、门诊/住院和本异地构成。当前${b.batch}批次重复收费${money(b.fee*.35)}元；相关检查与项目均可继续下钻。`,
28:(_,i,b)=>`建议将${i.name}纳入持续关注范围，优先复核${b.batch}中的重复收费和超范围支付；重点核查门诊、本地费用与高金额项目，结合历史记录确认问题是否持续。以下建议仅引用本轮已完成分析，未开展的横向对标需补充核验。可继续查看依据、生成报告或查看单次检查。`,
29:(_,i,b)=>`建议优先核查重复收费，因为当前${b.batch}中该行为金额${money(b.fee*.35)}元，占35%，是金额最高的行为认定。可继续核对原始指标、关联项目与历史批次；如尚未开展全区排名或历史对比，不据此宣称已完成相关分析。`,
37:(_,i,b)=>`本次检查涉及7类非零行为认定。重复收费${money(b.fee*.35)}元，占35%；超范围支付${money(b.fee*.25)}元，占25%；串换药品${money(b.fee*.15)}元，占15%。费用占比与风险贡献分开展示。可展开具体行为、就医类型或开展历史对比。`,
38:(c,i,b)=>`已展开${c.behavior||'串换药品'}专项分析，批次${b.batch}。可在128项三级指标中按就医类型与本地/异地筛选，查看对应金额与来源记录；进一步支持具体项目明细和多维组合查询。`,
39:(_,i,b)=>`本次串换药品金额${money(b.fee*.15)}元，涉及药品、诊疗项目及医用耗材三类项目。项目列表支持按名称筛选、查看金额及就医类型分布。`,
41:(_,i)=>`该机构此前有效检查中，重复收费和超范围支付多次出现。下方逐批次展示风险指数、费用和行为变化，可点击历史批次进一步比较；“重复”与“新增”以原始指标是否出现为依据。`,
42:(_,i,b)=>`本次检查新增超量开药行为，相关金额${money(b.fee*.05)}元，占本次费用5%。以下展示新增行为及对应指标，与上次检查的差异分别列示。`,
43:(_,i,b)=>`已按同机构类型、检查类型和统一评分参数匹配可比检查记录。当前批次${b.batch}单次指数${b.score}分；下方展示同类型机构参照结果、主要行为差异和机构对标入口。`,
44:(_,i,b)=>`本次检查与参照机构差异较大的行为主要为重复收费和超范围支付。请结合下方金额与风险贡献差异进一步核验，可继续穿透就医类型、地域和具体项目。`,
45:(c,i,b)=>`已将${i.name}与${c.comparison||'浦东新区人民医院'}纳入比较。下方统一检查类型和参数版本，分别展示双方单次风险指数、违规费用及行为认定；无可比检查时不生成比较结论。`,
46:(_,i,b)=>`本次违规费用主要集中在门诊和住院，门诊${money(b.fee*.45)}元，住院${money(b.fee*.30)}元。可继续查看住院违规行为，或按本地/异地拆分128项指标。`,
47:(_,i,b)=>`已锁定住院维度。住院相关违规费用${money(b.fee*.30)}元，主要集中在重复收费与超范围支付。下方可继续选择行为认定、本地/异地及对应三级指标。`,
48:(_,i,b)=>`本次检查本地费用${money(b.fee*.8)}元，异地费用${money(b.fee*.2)}元；两类费用分别按行为认定与就医类型展示，可查看交叉矩阵并继续筛选。`,
49:(_,i,b)=>`本次过度诊疗费用${money(b.fee*.10)}元，涉及三类项目，主要就医类型为门诊。以下展示项目及金额，支持按名称查询及查看明细。`,
51:(_,i,b)=>`建议重点关注：一是${b.batch}中重复收费费用占35%，对风险指数贡献较大；二是与此前检查重复出现的问题，需核验是否持续；三是同类型机构中偏离参考水平的指标。已完成和未开展的分析分开标注，避免将待核查事项作为已认定事实。可继续生成具体核查建议或检查分析报告。`,
52:(_,i,b)=>`建议围绕${b.batch}的重复收费与超范围支付，重点复核门诊、住院及具体高金额项目；结合历史重复问题及同类机构差异核查原始凭证。每项建议关联指标记录、历史批次和核查方向，供业务人员后续监管参考。`,

7:c=>{const rows=checks.filter(b=>b.date.startsWith(c.year)),open=rows.filter(b=>b.stage!=='形成结果');return `${c.year}年共有${rows.length}次医疗机构检查，其中${rows.length-open.length}次已完成医疗机构流程，${open.length}次尚未办结。各阶段检查数量及明细如下，可继续筛选监管阶段、未办结检查或办理时间较长的检查。`;},
8:c=>{const rows=checks.filter(b=>b.date.startsWith(c.year)&&(!c.stage||c.stage.split('/').includes(b.stage))&&(!c.unfinished||b.stage!=='形成结果')&&(!c.checkType||b.type===c.checkType));return `${c.year}年共有${rows.length}次检查符合条件：${c.stage?'监管阶段为'+c.stage:c.unfinished?'尚未办结':'全部阶段'}${c.checkType?'，检查类型为'+c.checkType:''}。您可以按停留时长排序，或选择具体批次查看完整进度和详情。`;},
9:(_,i,b)=>`${b.batch}为${i.name}${b.date.slice(0,4)}年${b.type}，目前处于${b.stage}阶段。承办部门为${b.department}，分工方式为指定网审，网审意见为“建议检查”，网审人员为AAA、BBB。该批次于${b.entered}进入当前阶段，已停留${b.days}天，${b.overdue?'已超过':'暂未超过'}办理时限。您可以继续查看本次检查完整详情、网审意见依据、相关材料或该机构其他检查。`,
10:(_,i)=>`${i.name}共有${history(i.code).length}次有效检查记录，其中${history(i.code).filter(b=>b.stage!=='形成结果').length}次尚未办结。请先选择需要查看的检查批次，避免混淆不同检查的办理进度。`,
11:(_,i,b)=>`已定位${i.name}的${b.batch}批次，当前处于${b.stage}阶段。已保留机构代码、批次号及查询条件，进入单次监管检查分析。`,
12:c=>{const open=checks.filter(b=>b.date.startsWith(c.year)&&b.stage!=='形成结果'),overdue=open.filter(b=>b.overdue),monthly=overdue.filter(b=>b.entered.startsWith('2026-11'));return `${c.year}年共有${open.length}次检查尚未办结，其中${overdue.length}次超过阶段办理时限，${monthly.length}次为本月新增超期。下方按当前阶段停留时长展示，可继续按阶段和承办部门分析积压情况。`;},
15:(_,i,b)=>`已打开优先级清单第一项：${i.name} ${b.batch}。该机构当前为${i.risk}，检查处于${b.stage}阶段，已停留${b.days}天。机构画像、进度详情和检查完整分析均继承该机构与批次。`,
16:(_,i,b)=>{const h=history(i.code),total=h.reduce((s,c)=>s+c.fee,0);return `已生成${i.name}监管画像。该机构当前为${i.risk}，机构综合风险指数为${i.score.toFixed(2)}分，历次风险值算术均分为${(h.reduce((s,c)=>s+c.score,0)/h.length).toFixed(2)}分。最新一次检查为${b.date} ${b.type}，单次风险指数为${b.score.toFixed(2)}分。该机构共有${h.length}次有效检查记录，违规费用总额为${money(total)}元，次均违规费用为${money(total/h.length)}元。主要风险集中在重复收费、超范围支付和门诊费用。可继续风险溯源、横向对标或查看单次检查。`;},
17:(_,i)=>`机构代码${i.code}对应${i.name}。已生成该机构监管画像，可继续风险溯源或横向对标。`,
35:(_,i,b)=>`已找到${i.name}最近一次有效监管检查，批次号为${b.batch}，检查类型为${b.type}，检查时间为${b.date}。本次检查单次风险指数为${b.score}分，违规费用合计${money(b.fee)}元，主要涉及重复收费、超范围支付和串换药品。可继续违规行为分析、历史对比或同类对标。`,
36:(_,i,b)=>`${b.batch}为${i.name}的一次${b.type}，检查时间为${b.date}。本次单次风险指数为${b.score}分，涉及7类行为认定，违规费用合计${money(b.fee)}元。重复收费金额${money(b.fee*.35)}元，为主要风险贡献来源。`,
40:(_,i,b)=>{const previous=history(i.code).find(c=>c.date<b.date);return previous?`与上一次${previous.batch}检查相比，本次单次风险指数由${previous.score}分变化为${b.score}分，违规费用由${money(previous.fee)}元变化为${money(b.fee)}元。重复收费、超范围支付金额增加，过度检查金额减少；超量开药为本次新增。可继续查看重复违规、新增问题或指定历史批次。`:'当前机构无更早有效检查记录，暂不能开展纵向比较。';},
50:(_,i,b)=>`已按照串换药品、住院、本地三个条件完成筛选。对应违规费用为${money(b.fee*.15*.30*.8)}元，涉及1项三级指标。以下为当前批次${b.batch}的具体指标与金额。`,
};
function fill(s:string,n:number,c:Context,i:Institution,b:Check){
 let text=overrides[n]?.(c,i,b)??s;
 text=text.split('浦东新区中医医院').join(i.name).split('FXJC-2026-011').join(b.batch).split('XX医院').join(c.comparison||'浦东新区人民医院');
 const repl:[RegExp,string][]=[[/XX\.XX/g,b.score.toFixed(2)],[/X\.XX/g,'10.00'],[/XX元/g,`${money(b.fee*.35)}元`],[/X元/g,'36,000元'],[/XX%/g,'35%'],[/X%/g,'10%'],[/第X/g,'第8'],[/XX分/g,`${b.score}分`],[/XX次/g,'3次'],[/XX天/g,'8天'],[/XX类/g,'7类'],[/XX项/g,'3项'],[/XX和XX/g,'重复收费和超范围支付'],[/XX、XX和XX/g,'重复收费、超范围支付和串换药品'],[/XX、XX/g,'重复收费、超范围支付'],[/XX行为认定/g,'重复收费行为认定'],[/XX行为/g,'重复收费行为'],[/XX就医类型/g,'门诊就医类型'],[/XX项目/g,'门诊诊疗项目'],[/XX水平/g,'较高水平'],[/XX趋势/g,'上升趋势'],[/XX/g,'重复收费'],[/X家/g,'8家'],[/X次/g,'3次'],[/X分/g,'8分']];
 for(const [p,v]of repl)text=text.replace(p,v);
 if(n===3)text='最近5年（2022—2026年）高风险机构数量整体呈上升趋势；中风险机构数量先升后降，低风险机构数量总体保持稳定。可点击年份查看当年机构名单；2021年作为历史对照，支持继续追溯。';
 if(n===4)text='2021年新增2家高风险机构，均由中风险上升为高风险，主要涉及重复收费和超范围支付。以下显示2021年历史快照中的机构，可查看对应年度检查。';
 if(n===6)text=`当前1级结算高风险机构共${institutions.filter(i=>i.level==='1级'&&i.risk==='高风险').length}家，机构明细如下。`;
 return text;
}
const normalize=(s:string)=>s.replace(/[\s，。？?！!、：:]/g,'');
const rules:[RegExp,number|((c:Context)=>number)][]=[
[/查看20\d{2}年.*风险机构/,1],[/展开.*指标明细|查看.*费用明细/,38],[/重点突出重复违规/,54],[/写得详细|补充.*检查.*项目|更新.*报告/,31],[/生成.*报告|整理.*报告/,c=>c.scene===3?53:30],
[/为什么建议|建议.*依据/,29],[/后续核查建议/,52],[/监管建议|重点关注|值得.*关注/,c=>c.scene===3?51:28],
[/只看.*串换|串换.*住院.*本地/,50],[/具体.*诊疗项目|过度诊疗.*项目/,49],[/串换.*具体项目/,39],[/展开串换|串换药品/,38],
[/连续.*检查|重复违规|重复出现/,41],[/新增.*问题/,42],[/住院.*违规|住院.*行为/,47],[/本地.*异地.*集中|本异地分析/,48],[/就医类型|费用.*集中/,46],
[/为什么.*比.*风险高/,26],[/两家.*重复收费|比较.*重复收费/,27],[/重复收费.*为什么|重复收费.*项目/,24],
[/排名|区内|分位/,25],[/同样.*飞行|全区同类检查/,22],[/差异最大/,44],[/同类型|同类对标|横向对标/,c=>c.scene===3?43:25],[/和.*医院.*比较|与.*医院.*相比/,c=>c.scene===3?45:25],
[/之前.*检查|上次|上一次|历史对比/,40],[/哪些检查.*影响|按单次检查溯源/,19],[/飞行检查费用|按检查类型/,21],[/风险维度|穿透维度/,23],[/10月.*为什么|飞行检查.*为什么/,20],[/为什么.*风险|风险溯源|风险.*原因/,18],
[/第一项|打开任务/,15],[/优先处理|重点监管任务|排一下/,14],[/高风险.*未办结|高风险.*没有办结/,13],
[/未办结检查|未完成检查/,8],[/只看.*飞行检查|只看.*专项检查|只看.*日常检查/,c=>c.scene===1?8:32],
[/办理时间.*长|积压|超期/,12],[/未完成检查进度|机构.*未办结检查/,10],[/进度详情|网审意见/,9],[/网审分工|检查实施|调查取证|形成结果|数据筛查|处理追踪|待处理/,8],[/进度情况|进度概览|监管进度|年度.*检查/,7],
[/[123]级.*高风险/,6],[/结算等级|风险结构/,5],[/2021年/,4],[/近[5五]年|历史趋势|变化趋势|高风险趋势/,3],[/上升.*机构|机构.*上升/,1],[/高风险机构|中风险机构|低风险机构|机构明细/,1],
[/监管画像|机构画像|机构代码PDYB/,16],[/单次检查情况|查看单次检查|选择.*检查/,32],[/最新.*检查|最近一次.*检查/,35],[/批次.*检查|FXJC|ZXJC|RCJC|检查详情|风险最高.*检查/,36],
[/违规行为|风险贡献|行为认定/,37],[/全区|监管结果|监管概况/,0]
];
export function resolveNode(text:string,c:Context){
 const exact=catalog.findIndex(n=>normalize(n.prompt)===normalize(text));if(exact>=0)return exact;
 for(const [p,n]of rules)if(p.test(text))return typeof n==='function'?n(c):n;
 return -1;
}
export function respond(text:string,previous:Context,forced?:number):Result{
 if(previous.scene===1&&text==='查看完整机构画像'&&previous.institution)return respond(`查看${previous.institution}的监管画像。`,{...previous,scene:2,district:undefined},16);
 if(previous.scene===1&&text==='查看单次检查详情'&&previous.batch)return respond(`查看${previous.batch}批次的监管检查情况。`,{...previous,scene:3,district:undefined},36);
 if(previous.scene===2)return portraitRespond(text,previous);
 const district=respondDistrict(text,previous);if(district)return district;
 if(previous.scene===3 && !/监管画像|机构画像/.test(text))return respondHistory(text,previous);
 if(/监管画像|机构画像|查看.*的画像/.test(text))return portraitRespond(text,previous);
 let c:Context={...previous,analysis:[...previous.analysis]};
 let n=forced??resolveNode(text,c);
 let includeProfile=false;
 const comparing=/比较|对比|相比|比.*风险高/.test(text);
 const inst=(!comparing||!c.institution?institutions.find(i=>text.includes(i.code)||text.includes(i.name)):undefined)||(text.includes('A机构')?DEFAULT_INST:undefined);
 const matchedBatch=text.match(/(?:FXJC|ZXJC|RCJC)-\d{4}-\d{3}/i)?.[0]?.toUpperCase();
 const b=matchedBatch?checks.find(b=>b.batch===matchedBatch):undefined;
 const output=(content:string,view:View[]=[],actions:string[]=sceneQuestions[c.scene-1]):Result=>({node:n,content,steps:[],views:view,actions,context:c,citations:[]});
 if(matchedBatch&&!b)return output(`未找到批次${matchedBatch}。请核对批次号，或输入机构名称查看其有效检查记录。`);
 if(inst&&b&&inst.code!==b.code)return output(`机构与批次不匹配：${matchedBatch}属于${b.name}。请确认机构或批次后重试。`);
 if(inst){if(c.institution!==inst.code){c.analysis=[];c.reportVersion=0;}c.institution=inst.code;if(!b)c.batch=history(inst.code)[0]?.batch;}
 if(b){if(c.institution&&c.institution!==b.code){c.analysis=[];c.reportVersion=0;}c.batch=b.batch;c.institution=b.code;c.year=b.date.slice(0,4);}
 const explicitYear=text.match(/(20\d{2})年/)?.[1];if(explicitYear)c.year=explicitYear;
 if(n===1&&explicitYear)c.trendYear=explicitYear;
 if(n<0&&inst)n=c.scene===3?35:16;
 if(n<0&&b)n=36;
 if(n<0)return output('我可以帮助查询全区监管概况、生成医疗机构监管画像，或分析单次监管检查。请补充机构名称、机构代码或检查批次号，也可从下方问题开始。');
 if(/医院|机构代码PDYB/.test(text)&&!inst&&!b&&!/这家|同类|XX医院|机构.*相比/.test(text)&&!catalog.some(q=>q.prompt===text))return output('未匹配到唯一医疗机构，请核对完整机构名称或机构代码。机构可选择：', ['candidates'], ['帮我查看浦东新区中医医院的监管画像。','帮我查看浦东新区人民医院的监管画像。']);
 const targetScene:Scene=n===2||n>=16&&n<=32?2:n===11||n>=33?3:1;
 if(targetScene!==c.scene){c.scene=targetScene;}
 if(c.scene!==1&&!c.institution){c.pending=text;return output(welcomes[c.scene-1],[],sceneQuestions[c.scene-1]);}
 if(c.pending&&inst){const requested=resolveNode(c.pending,{...c,scene:previous.scene});c.pending=undefined;if(requested>=0&&requested!==16&&requested!==17){c.analysis.push(16);includeProfile=true;n=requested;}}
 if(n===15){const first=checks.filter(b=>institutions.find(i=>i.code===b.code)?.risk==='高风险'&&b.stage!=='形成结果').sort((a,b)=>b.days-a.days)[0];c.institution=first.code;c.batch=first.batch;}
 if(n===1){c.rising=/上升|新增高风险/.test(text);c.risk=/新增高风险/.test(text)?'高风险':c.rising?undefined:['高风险','中风险','低风险'].find(r=>text.includes(r));c.level=undefined;}
 if(n===6){c.risk='高风险';c.level=text.match(/[123]级/)?.[0]||'1级';c.rising=false;}
 if(n===8){c.unfinished=/未办结|未完成/.test(text);c.stage=['网审分工','检查实施','调查取证','形成结果'].filter(s=>text.includes(s)).join('/');c.overdue=false;}
 if(n===12)c.overdue=true;
 if(n===4)c.trendYear='2021';
 if(n===38||n===39||n===50)c.behavior=['串换药品','不必要医药服务','过度诊疗','超范围支付','重复收费','超量开药','过度检查','分解处方'].find(b=>text.includes(b))||'串换药品';
 if(n===47||n===50)c.visit='住院';
 if(n===49)c.behavior='过度诊疗';
 if(n===24||n===27||n===31)c.behavior='重复收费';
 if(n===47){c.behavior=undefined;c.region=undefined;}
 if(n===23||n===37||n===16||n===17){c.behavior=undefined;c.visit=undefined;c.region=undefined;}
 if(n===50)c.region='本地';
 if(n===38){c.visit=undefined;c.region=undefined;}
 if(n===38&&/查看.*费用明细/.test(text))c.visit=['门诊','住院','大病','急观','家床','内设门急诊','急诊','进销存'].find(v=>text.includes(v));
 if(n===21||n===22)c.checkType='飞行检查';
 if(/只看/.test(text))c.checkType=['飞行检查','专项检查','日常检查'].find(t=>text.includes(t));
 const dates=text.match(/20\d{2}-\d{2}-\d{2}/g);if(dates?.length){c.start=dates[0];c.end=dates[1];}
 if(n===25||n===26||n===27||n===45)c.comparison=institutions.find(i=>i.name!==DEFAULT_INST.name&&text.includes(i.name))?.name||'浦东新区人民医院';
 const i=institutions.find(i=>i.code===c.institution)||DEFAULT_INST;
 const check=checks.find(b=>b.batch===c.batch)||history(i.code)[0]||currentCheck;
 if(c.scene!==1&&!c.analysis.includes(16)&&n!==16&&n!==17){if(c.scene===2)includeProfile=true;c.analysis.push(16);}
 if(!c.analysis.includes(n))c.analysis.push(n);
 if(n===30&&!c.analysis.some(k=>k>=18&&k<=27))return output('机构画像已生成。请先完成风险溯源或横向对标中的任意一项，再生成画像报告；报告将仅纳入本轮已完成的分析。', ['profile'],[catalog[18].prompt,catalog[25].prompt]);
 if([30,53].includes(n))c.reportVersion=Math.max(c.reportVersion,1);
 if(n===31||n===54){c.reportVersion=Math.max(c.reportVersion+1,2);c.reportFocus=n===31?'重复收费分析':'重复违规与同类机构差异';}
 const sourceSet=[0,1,2,3];
 let content=fill(catalog[n].answer,n,c,i,check);
 if(n===1&&c.risk)content=`${c.trendYear?c.trendYear+'年历史快照中':'当前全区'}${c.risk}机构明细如下，可按结算等级或最新检查风险值筛选和排序。`;
 if(n===6)content=`当前${c.level}结算高风险机构共${institutions.filter(i=>i.level===c.level&&i.risk==='高风险').length}家。`;
 if(n===1&&c.rising&&c.risk==='高风险')content='本月新增2家高风险机构，均由中风险上升为高风险。以下为筛选后的机构明细。';
 if(n===38&&c.behavior!=='串换药品')content=`已展开${c.behavior}指标明细，当前检查${check.batch}，可按就医类型和本地/异地继续筛选。`;
 return {node:n,context:c,content,steps:[`识别查询条件：${c.scene===1?'全区':i.name} · ${c.year}年`,catalog[n].steps||`正在读取机构档案、检查结果、风险指标和监管流程……`, '已完成多库关联与口径核验，正在生成结论及可视化结果'],views:includeProfile&&!views[n].includes('profile')?['profile',...views[n]]:views[n],actions:[...(nexts[n]||[]).map(k=>catalog[k].prompt),...(n===0?['查看本月新增高风险机构']:[])],citations:sourceSet.map(j=>`${['医疗机构档案库','检查结果库','风险指标库','监管流程库'][j]} · ${j===2?PARAM_VERSION:SNAPSHOT}`)};
}
export function switchScene(scene:Scene,previous:Context):Result{const c:Context={...previous,scene,...(scene===3?{year:'',batch:undefined,recordIds:undefined}: {})};return {node:-1,context:c,content:welcomes[scene-1],steps:[],views:scene===2?['portrait']:[],actions:scene===2?[]:sceneQuestions[scene-1],citations:[]};}
export function titleOf(c:Context){return SCENES[c.scene-1];}
