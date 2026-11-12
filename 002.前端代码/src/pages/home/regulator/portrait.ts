import type { Context, Result } from './engine';
import { checks, history, institutions, SNAPSHOT, BEHAVIORS, type Check } from './data';
export const portraitWelcome='您好！我是医小保。\n\n请输入您要查询的医疗机构名称或机构代码，我会先为您生成机构监管画像，展示其当前风险等级、历次风险值、最新检查、违规费用和主要风险构成。\n\n画像生成后，您可以继续追问：这家机构近几年的风险发生了什么变化？为什么这家机构的风险较高？它在全区或同类机构中处于什么水平？最近一次检查具体发现了哪些问题？\n\n您也可以让我根据分析结果生成监管建议或机构画像报告。您还可以通过左侧栏目中的“医疗机构监管履历画像”功能自行探索。';
export const modules=['历次风险变化','重点风险分析','横向对标分析','重点检查概览','检查办理情况','监管建议','领导摘要'];
export const wan=(n:number)=>(n/10000).toFixed(2)+'万元';
export const risk=(n:number)=>n>60?'高风险':n<20?'低风险':'中风险';
export function portraitHistory(c:Context){return history(c.institution||'').filter(b=>(!c.start||b.date>=c.start)&&(!c.end||b.date<=c.end)&&(!c.checkType||b.type===c.checkType));}
export const homeActions=['查看风险变化','追溯风险原因','查看全区排名','与其他机构比较','查看最近一次检查','生成监管建议','生成机构画像报告'];
export function recommended(c:Context){return modules.filter(m=>m==='历次风险变化'&&c.portraitDone?.includes('B')||m==='重点风险分析'&&c.portraitDone?.includes('C')||m==='横向对标分析'&&c.portraitDone?.includes('D')||m==='监管建议'&&c.portraitDone?.includes('F'));}
export function portraitRespond(text:string,previous:Context):Result{
 const c:Context={...previous,scene:2,analysis:[...previous.analysis],portraitDone:[...(previous.portraitDone||[])]};
 const out=(content:string,step:string,actions:string[]=homeActions):Result=>{c.portraitStep=step;return {node:16,context:c,content,steps:step==='select'?[]:['识别目标机构与查询条件','汇总有效检查、风险结果、违规费用及监管进度','按当前时间范围核验指标并生成分析'],views:['portrait'],actions,citations:[`档案、检查结果、风险指标及监管流程 · ${SNAPSHOT}`]};};
 if(/^(重新输入|清空条件|重置)$/.test(text)){delete c.institution;delete c.batch;c.portraitDone=[];return out(portraitWelcome,'select',[]);}
 const comparing=/比较|对标|相比|差异/.test(text);
 const matches=institutions.filter(i=>text.includes(i.code)||text.includes(i.name));
 const inst=matches.find(i=>!comparing||!c.institution);
 const batch=text.match(/(?:FXJC|ZXJC|RCJC)-\d{4}-\d{3}/i)?.[0]?.toUpperCase();
 const found=checks.find(b=>b.batch===batch);
 if(batch&&!found)return out('暂未找到该检查批次，请核对批次号。','checks',['查看历次检查']);
 if(inst&&found&&inst.code!==found.code)return out(`机构与批次不匹配，${batch}属于${found.name}。请核对后重新选择。`,'checks');
 if(inst&&inst.code!==c.institution){Object.assign(c,{institution:inst.code,batch:history(inst.code)[0]?.batch,portraitDone:[],analysis:[],reportModules:undefined,reportVersion:0,comparison:undefined,reportScope:undefined,start:undefined,end:undefined,checkType:undefined,behavior:undefined,visit:undefined,region:undefined});}
 if(found){c.institution=found.code;c.batch=found.batch;}
 if(!c.institution || (!comparing&&/医院|机构代码|PDYB/.test(text)&&!inst&&!found)){
  const token=text.replace(/帮我|查询|查看|的监管画像|的画像|监管画像|机构画像|机构名称|机构代码|对应机构|医院|[。？：:]/g,'').trim();
  const candidates=institutions.filter(i=>token&&(i.name.includes(token)||i.code.includes(token)||token.includes('浦东')));
  if(candidates.length===1){return portraitRespond(`查看${candidates[0].code}的监管画像`,c);}
  c.portraitCandidates=candidates.slice(0,8).map(i=>i.code);c.pending=text;
  return out(candidates.length?'找到多家名称相近的医疗机构，请选择您要查询的机构。':'暂未找到该机构，请检查名称或机构代码。您可以重新输入，或从机构筛选栏选择。','select',[]);
 }
 const org=institutions.find(i=>i.code===c.institution)!;
 const years=[...text.matchAll(/(20\d{2})年/g)].map(m=>m[1]);if(years.length){c.start=years[0]+'-01-01';c.end=years[years.length-1]+'-12-31';}
 const dates=text.match(/20\d{2}-\d{2}-\d{2}/g);if(dates){c.start=dates[0];c.end=dates[1]||dates[0];}
 if(/全部有效检查/.test(text)){c.start=undefined;c.end=undefined;c.checkType=undefined;}
 const h=portraitHistory(c),total=h.reduce((s,b)=>s+b.fee,0),avg=h.length?h.reduce((s,b)=>s+b.score,0)/h.length:0;
 const done=(v:string)=>{if(!c.portraitDone!.includes(v))c.portraitDone!.push(v);};
 const summary=(b:Check)=>`${org.name}的${b.date} ${b.type}，批次号${b.batch}。数据期间${b.start}至${b.end}，单次风险值${b.score.toFixed(2)}分（${risk(b.score)}），违规费用${wan(b.fee)}，主要涉及重复收费和超范围支付，目前处于${b.stage}阶段。`;
 if(!h.length)return out('当前范围没有有效检查数据，暂不形成分析结论，请调整时间或检查类型。','checks',['查看全部有效检查']);
 if(/查看完整检查|进入场景三/.test(text)){
  const b=checks.find(b=>b.batch===c.batch)||h[0];c.scene=3;c.batch=b.batch;
  return {node:36,context:c,content:`已进入该次监管检查详情。${summary(b)}`,steps:['携带机构代码与检查批次号打开详情'],views:['check','behavior','timeline'],actions:['分析违规行为','查看历史对比','生成监管建议'],citations:[]};
 }
 if(inst&&!comparing&&!found&&!/报告/.test(text)||/^(查看完整机构画像|查询画像)$/.test(text)){
  done('A');c.analysis.push(16);return out(`已为您生成${org.name}的监管画像。当前为${org.risk}，历次风险值均分${avg.toFixed(2)}分，最新检查风险值${h[0].score.toFixed(2)}分；累计违规费用${wan(total)}，次均${wan(total/h.length)}。共有${h.length}次有效检查，其中${h.filter(b=>b.stage==='形成结果').length}次已办结、${h.filter(b=>b.stage!=='形成结果').length}次尚未办结。`,'overview');
 }
 const reportRequest=/报告|恢复推荐|全选|确认模块/.test(text)||c.portraitStep==='report'&&/增加|删除|详细|补充|修改/.test(text)||c.portraitStep==='scope'||c.portraitStep==='peer'&&!!c.reportModules;
 if(reportRequest){
  if(/调整.*模块|生成.*报告|一份.*报告|恢复推荐|全选/.test(text)&&!/确认生成|确认模块/.test(text)){
   if(!c.reportModules||/恢复推荐/.test(text))c.reportModules=recommended(c);if(/全选/.test(text))c.reportModules=[...modules];
   return out(`将为您生成《${org.name}医疗机构监管画像报告》。基础内容默认纳入，请选择分析模块并确认时间范围。`,'modules',[]);
  }
  if(/确认模块|确认生成/.test(text)){c.reportModules=modules.filter(m=>text.includes(m));c.reportRange=/全部有效检查/.test(text)?'全部有效检查':`${c.start||'起始'}至${c.end||SNAPSHOT}`;}
  if(/全区机构|同结算等级机构|指定医疗机构/.test(text)){c.reportScope=text.includes('同结算')?'同结算等级':text.includes('指定')?'指定机构':'全区';}
  // Use the template's district benchmark when no scope was explicitly selected.
  if(c.reportModules?.includes('横向对标分析')&&!c.reportScope)c.reportScope='全区';
  if(matches.length&&comparing)c.comparison=matches.find(i=>i.code!==org.code)?.name;
  if(c.reportModules?.includes('横向对标分析')&&c.reportScope==='指定机构'&&!c.comparison)return out('请选择需要比较的医疗机构。','peer',[]);
  if(/增加|删除|详细|补充|修改|更新/.test(text)){
   const selected=new Set(c.reportModules||[]);for(const m of modules){if(new RegExp(`删除[“「]?${m}`).test(text))selected.delete(m);if(new RegExp(`增加[“「]?${m}`).test(text))selected.add(m);}c.reportModules=[...selected];c.reportChanges=text;
  }
  c.reportGeneratedAt=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});c.reportVersion=(c.reportVersion||0)+1;return out(`已生成《${org.name}医疗机构监管画像报告》V${c.reportVersion}，包含基础内容${c.reportModules?.length?'及'+c.reportModules.join('、'):''}。${c.reportChanges?'本次修改：'+c.reportChanges:''}`,'report',['调整报告模块']);
 }
 if(comparing&&matches.length){c.comparison=matches.find(i=>i.code!==org.code)?.name;c.reportScope='指定机构';}
 if(/其他机构比较|指定医疗机构/.test(text)&&!c.comparison)return out('请选择要比较的机构，当前目标机构和时间范围已保留。','peer',[]);
 if(/排名|处于什么水平|对标|比较|相比/.test(text)&&!/为什么|原因|差异/.test(text)){
  if(!c.reportScope)c.reportScope=/同类|同结算/.test(text)?'同结算等级':'全区';done('D');return out(`已按${c.reportScope}统一时间范围和风险指标口径，分别比较风险值、违规费用总额与次均违规费用。请选择指标查看排名与分位。`,'benchmark',['为什么存在这些差异','查看造成差异的相关检查','生成监管建议','生成机构画像报告']);
 }
 if(/监管建议|下一步怎么管/.test(text)){done('F');return out(`建议按近期处置、持续监测、后续检查三个层级安排监管工作。每项建议关联检查批次与风险维度，供业务人员核查。`,'advice',['查看重点检查','生成机构画像报告']);}
 if(found||/最近一次检查$|最新.*检查$|风险最高.*检查|对应检查|关键检查/.test(text)){
  const b=found||(/最高/.test(text)?[...h].sort((a,b)=>b.score-a.score||b.fee-a.fee||b.date.localeCompare(a.date))[0]:h[0]);c.batch=b.batch;done('E');return out(summary(b),'summary',['查看完整检查详情']);
 }
 if(/变化点/.test(text))return out('以下列出相邻检查风险值与违规费用的变化，请选择对应检查查看摘要，或继续解释变化原因。','changes',['追溯风险原因','查看风险最高的检查']);
 if(/按检查类型|飞行检查、专项检查|类型.*趋势/.test(text)){done('B');return out('已按检查类型分别汇总检查次数、平均与最高风险值、违规费用总额和次均费用。不同检查类型分别观察。','types',['分析飞行检查风险原因','查看飞行检查记录']);}
 if(/最近.*为什么|比上一次高|解释最近变化/.test(text)){
  const delta=h[0].score-(h[1]?.score||h[0].score);return out(`最近一次较上次风险值变化${delta.toFixed(2)}分，违规费用变化${wan(h[0].fee-(h[1]?.fee||h[0].fee))}。当前为变化摘要，具体行为贡献需继续核对风险指标。`,'changes',['继续追溯风险原因']);
 }
 if(/风险变化|风险.*变化|风险演变|近几年|风险趋势/.test(text)&&!/为什么|原因/.test(text)){
  done('B');const asc=[...h].reverse(),d=h[0].score-(h[1]?.score||h[0].score);return out(`所选范围内共${h.length}次检查，风险值由${asc[0].score.toFixed(2)}分变化至${h[0].score.toFixed(2)}分。最高${Math.max(...h.map(b=>b.score)).toFixed(2)}分，最低${Math.min(...h.map(b=>b.score)).toFixed(2)}分；最近一次较上次${d>=0?'上升':'下降'}${Math.abs(d).toFixed(2)}分。`,'trend',['查看关键变化点','按检查类型分析','解释最近变化','查看风险最高的检查']);
 }
 if(/哪些检查|历次检查|某次检查|不确定|检查记录|关联检查|重点检查|造成差异的.*检查/.test(text)){if(/飞行/.test(text))c.checkType='飞行检查';return out(`找到${portraitHistory(c).length}次有效检查，请选择要查看的检查记录。`,'checks',[]);}
 if(/原因|为什么|归因|溯源|行为认定|就医|险种|本地|异地|违规项目|风险维度/.test(text)){
  done('C');c.behavior=BEHAVIORS.find(v=>text.includes(v))||c.behavior;
  const step=/项目/.test(text)?'projects':/就医|险种|本地|异地|数据属性/.test(text)?'dimensions':/行为认定/.test(text)?'behavior':'attribution';
  return out(`已汇总${org.name}当前范围内${h.length}次有效检查。重复收费累计${wan(total*.35)}，占违规费用35%；超范围支付累计${wan(total*.25)}，占25%。金额占比用于费用构成分析，正式风险贡献需依据评分指标核验；关联批次与项目可继续下钻。`,step,['按就医及数据属性分析','按行为认定分析','按违规项目分析','按历次检查溯源','查看全区排名','生成监管建议']);
 }
 return out('已保留当前机构和分析条件。您可以继续查看风险变化、追溯原因、排名对标、检查摘要或生成建议与报告。','overview');
}
