import { checks, institutions, history, indicators, behaviorData, PARAM_VERSION, SNAPSHOT, money, type Check } from './data';
import type { Context, Result, View } from './engine';
export const recordRisk=(b:Check)=>b.score>60?'高风险':b.score<20?'低风险':'中风险';
const next=['查看本次检查风险概况','分析风险等级及指数依据','查看风险指标明细','查询本次监管阶段及进度','查看机构历史监管概况','综合本次检查和历史情况进行监管研判','生成这次检查的分析报告'];
export function recordRows(c:Context){
 let rows=checks.filter(b=>(!c.recordCodes?.length||c.recordCodes.includes(b.code))&&(!c.year||b.date.startsWith(c.year))&&(!c.start||b.date>=c.start)&&(!c.end||b.date<=c.end)&&(!c.stage||c.stage===b.stage)&&(!c.risk||recordRisk(b)===c.risk)&&(!c.checkType||b.type===c.checkType)&&(!c.unfinished||b.stage!=='形成结果')&&(!c.overdue||b.overdue));
 rows.sort(c.recordSort==='asc'?(a,b)=>a.score-b.score:c.recordSort==='desc'?(a,b)=>b.score-a.score:(a,b)=>b.date.localeCompare(a.date));
 return c.recordLimit?rows.slice(0,c.recordLimit):rows;
}
export function respondHistory(text:string,prev:Context):Result{
 const c:Context={...prev,scene:3,analysis:[...prev.analysis]};
 const result=(content:string,views:View[]=[],actions=next,node=36):Result=>({node,content,views,actions,context:c,steps:['正在识别查询对象、时间及组合条件','正在关联有效检查记录及当前批次数据'],citations:[`检查结果库 · ${SNAPSHOT}`,`评分参数 · ${PARAM_VERSION}`]});
 const named=institutions.filter(i=>text.includes(i.name)||text.includes(i.code));
 const batch=text.match(/(?:FXJC|ZXJC|RCJC)-\d{4}-\d{3}/i)?.[0]?.toUpperCase();
 const selected=checks.find(b=>b.batch===batch);
 if(batch&&!selected)return result(`未找到检查批次${batch}，请核对编号。`,[],['查询全区全部监管记录']);
 if(selected&&named.length&&!named.some(i=>i.code===selected.code))return result(`机构与批次不匹配，${batch}属于${selected.name}。请核对查询对象。`,[],[]);
 if(!batch&&!named.length&&/医院|机构代码/.test(text)&&!/这家|该机构|某机构|某医疗机构|同类|同类型|比较|相比/.test(text))return result('未匹配到唯一医疗机构，请核对机构全称或机构代码。',[],['查询浦东新区中医医院本年度全部监管记录','查询全区风险最高的5条监管记录']);
 if(!c.institution&&!batch&&!named.length&&!/全区|全部监管机构|高风险|中风险|低风险|20\d{2}|本年度|本季度|本月|阶段|最高|最低/.test(text))return result('请确认希望查询的范围，可按机构查询、全区风险排序，或输入检查批次号。',[],['查询浦东新区中医医院本年度全部监管记录','查询全区风险最高的5条监管记录','查看浦东新区中医医院最近一次检查情况']);
 const query=!batch&&(/记录|履历|最近一次|最新一次|风险最高|风险最低|排名前|只看|筛选/.test(text))&&!/指标|报告|研判|历史问题/.test(text);
 if(query){
  if(/全区|全部监管机构/.test(text)){c.recordCodes=undefined;c.institution=undefined;}
  else if(named.length){c.recordCodes=named.map(i=>i.code);c.institution=named.length===1?named[0].code:undefined;}
  else if(!c.recordCodes&&c.institution)c.recordCodes=[c.institution];
  c.batch=undefined;c.analysis=[];c.reportVersion=0;c.recordIds=undefined;
  if(!/继续|只看|其中|这些|再筛/.test(text)){c.year='';c.start=undefined;c.end=undefined;c.stage=undefined;c.risk=undefined;c.checkType=undefined;c.unfinished=false;c.overdue=false;c.recordSort=undefined;c.recordLimit=undefined;}
  const year=text.match(/(20\d{2})年/)?.[1];if(year)c.year=year;
  if(/本年度|今年/.test(text))c.year='2026';
  if(/全部历史|截至目前|历次|全部记录/.test(text))c.year='';
  const dates=text.match(/20\d{2}-\d{2}-\d{2}/g);if(dates){c.year='';c.start=dates[0];c.end=dates[1]||dates[0];}
  const month=text.match(/(?:(20\d{2})年)?(\d{1,2})月/);const quarter=text.match(/第?([1-4一二三四])季度/);
  if(/本月/.test(text)||month){const y=month?.[1]||year||'2026',m=month?Number(month[2]):11;c.year='';c.start=`${y}-${String(m).padStart(2,'0')}-01`;c.end=`${y}-${String(m).padStart(2,'0')}-${new Date(Number(y),m,0).getDate()}`;}
  if(/本季度/.test(text)||quarter){const q=quarter?('一二三四'.includes(quarter[1])?'一二三四'.indexOf(quarter[1])+1:Number(quarter[1])):4,y=year||'2026';c.year='';c.start=`${y}-${String(q*3-2).padStart(2,'0')}-01`;c.end=`${y}-${String(q*3).padStart(2,'0')}-${new Date(Number(y),q*3,0).getDate()}`;}
  if(/近半年/.test(text)){c.year='';c.start='2026-05-12';c.end='2026-11-12';}
  if(/截至目前/.test(text))c.end='2026-11-12';
  c.stage=['网审分工','检查实施','调查取证','形成结果'].find(v=>text.includes(v))||c.stage;
  c.risk=['高风险','中风险','低风险'].find(v=>text.includes(v))||c.risk;
  c.checkType=['飞行检查','专项检查','日常检查'].find(v=>text.includes(v))||c.checkType;
  if(/未办结/.test(text))c.unfinished=true;if(/超期/.test(text))c.overdue=true;
  if(/整改|处理结论|记录编号/.test(text))return result('当前数据未提供整改状态、处理结论或独立监管记录编号，无法据此筛选。可按机构、检查批次、时间、阶段和风险等级查询。',[],['查询全区本年度监管记录']);
  if(/最高|最低|排名|排序/.test(text)){c.recordSort=/最低|从低到高/.test(text)?'asc':'desc';const limit=text.match(/(?:前|最高的?|最低的?)(\d+)/);c.recordLimit=limit?Math.min(100,Number(limit[1])):undefined;}
  if(/最近一次|最新一次/.test(text)){c.recordSort=undefined;c.recordLimit=1;}
  const rows=recordRows(c);c.recordIds=rows.map(b=>b.batch);
  if(/最近一次|最新一次/.test(text)&&rows.length===1){c.batch=rows[0].batch;c.institution=rows[0].code;}
  return result(`按${c.recordCodes?.map(code=>institutions.find(i=>i.code===code)?.name).join('、')||'全区医疗机构'}检索，时间：${c.year?c.year+'年':`${c.start||'不限'}至${c.end||'不限'}`}，阶段：${c.stage||'全部'}，风险：${c.risk||'全部'}，检查类型：${c.checkType||'全部'}。共找到${rows.length}条有效监管记录${c.recordSort?`，已按单次风险指数${c.recordSort==='asc'?'升序':'降序'}排列`:''}。${rows.length?'请选择具体检查批次，继续开展风险、监管过程、历史情况分析和监管研判。':'可调整筛选条件后重新查询。'}`,c.batch?['check']:['checks'],c.batch?next:rows.slice(0,4).map(b=>`查看${b.batch}批次的监管检查情况。`));
 }
 if(selected){if(c.batch!==selected.batch){c.analysis=[];c.reportVersion=0;c.reportFocus=undefined;c.reportBrief=false;c.reportSections=undefined;c.reportRevisions=[];}c.batch=selected.batch;c.institution=selected.code;}
 if(named.length===1&&c.institution!==named[0].code){c.institution=named[0].code;c.batch=undefined;c.analysis=[];c.reportVersion=0;}
 if(!c.batch){
  if(c.institution){c.recordCodes=[c.institution];c.year='';c.recordIds=history(c.institution).map(b=>b.batch);return result('请先选择要分析的监管检查批次。后续分析将继承所选机构和批次。',['checks'],history(c.institution).slice(0,4).map(b=>`查看${b.batch}批次的监管检查情况。`));}
  return result('您希望如何查询监管履历？请确认查询范围或直接输入机构名称、机构代码或检查批次号。',[],['查询全区本年度全部监管记录','查询全区风险最高的5条监管记录','查看浦东新区中医医院最近一次检查情况']);
 }
 const b=checks.find(v=>v.batch===c.batch)!;const h=history(b.code);const values=indicators(b);const top=behaviorData(b).sort((a,b)=>b.amount-a.amount);
 const show=(content:string,views:View[],node:number)=>{if(!c.analysis.includes(node))c.analysis.push(node);return result(`${b.name} · ${b.batch}\n\n${content}`,views,next,node);};
 if(/导出.*Excel|导出.*明细|整理成表格|导出.*指标/.test(text))return show('已整理当前批次的128项风险指标及金额。可在指标表下载Excel；正式预警阈值与实际测算值未接入，导出时标记缺失。',['matrix'],38);
 if(/报告|汇报摘要|一页|专项材料|重点问题清单/.test(text)){
  c.reportVersion+=1;c.reportFocus=text;
  if(/只保留|顺序|先写|章节/.test(text)){const labels=[['概况','基本情况'],['主要问题','主要违规行为'],['风险分析','主要违规行为'],['历史情况','纵向历史对比'],['横向对标','同类机构横向对标'],['监管过程','监管过程'],['建议','监管关注建议']];const requested=labels.filter(([label])=>text.includes(label)).sort((a,b)=>text.indexOf(a[0])-text.indexOf(b[0])).map(([,section])=>section);if(requested.length)c.reportSections=[...new Set(requested)];}
  if(/完整/.test(text))c.reportSections=undefined;c.reportBrief=/精简|摘要|一页|只保留/.test(text)||c.reportBrief;
  if(/完整/.test(text))c.reportBrief=false;
  c.reportRevisions=[...(c.reportRevisions||[]),`V${c.reportVersion}：${text}`];
  return show('已根据当前批次和本轮已完成分析生成材料草稿，未开展分析及缺失字段作缺项提示。可在线预览，继续调整章节、顺序和详略，或通过下载按钮导出Word / PDF。',['report'],53);
 }
 if(/进度|阶段|网审|实施|时间轴|关键节点|过程/.test(text))return show(`当前处于${b.stage}阶段，${b.entered}进入，已停留${b.days}天，阶段时限${b.limit}天，${b.overdue?'已超期':'未超期'}；承办部门${b.department}。完整关键节点时间及真实任务分工未接入，下方只展示已知当前节点。`,['timeline'],9);
 if(/单项.*历史|指标.*历史/.test(text))return show('当前可对照历次检查费用与风险指数；正式指标实际值、预警阈值及历史触发状态未接入，不能判定持续预警。',['history','matrix'],40);
 if(/历史|纵向|趋势|上次|重复|新增/.test(text))return show(`该机构共有${h.length}次有效检查，风险等级分布：${['高风险','中风险','低风险'].map(r=>`${r}${h.filter(v=>recordRisk(v)===r).length}次`).join('、')}。历次指数及费用如下；违规行为依据明细，整改记录缺失，不据此认定整改完成或问题已消除。`,['history','behavior'],40);
 if(/横向|同类|同类型|对标|参照|比较|相比/.test(text))return show('可选择全区、同结算等级或指定机构作参照，统一检查类型和评分参数比较单次风险指数与违规费用。参照机构无可比检查时提示数据不足。',['benchmark'],43);
 if(/研判|突出问题|重点风险|优先|建议|后续|关联线索|主要存在哪些/.test(text))return show(`本次风险主要集中在${top.slice(0,2).map(v=>`${v.name}（${money(v.amount)}元）`).join('、')}，当前${b.stage}。建议核对收费明细、医嘱与结算凭证，并结合历史记录复核持续发生情况；整改及正式关联规则尚未接入，相关事项待核实。本结论为辅助研判，不替代正式监管认定，具体措施由业务人员确定。`,['suggestions','behavior'],/检查.*方向|重点查|下一次/.test(text)?52:51);
 if(/等级|指数.*依据|评分|为什么.*风险|形成原因/.test(text))return show(`单次风险指数${b.score}分，对应${recordRisk(b)}。等级标准：大于60分为高风险，20至60分为中风险，低于20分为低风险；参数${PARAM_VERSION}。金额占比与评分贡献分开展示。正式评分明细、归一化参数及阈值尚未接入，无法还原正式计算过程。`,['check','behavior'],37);
 if(/指标|预警|阈值|计算口径|数据来源|穿透/.test(text))return show(`当前批次共${values.length}项三级指标，按行为、就医类型、本地/异地组合展开。现有数据为违规金额及权重，正式实际测算值、预警阈值、计算周期与触发状态缺失，不能将非零金额等同触发预警。`,['matrix'],38);
 if(/项目/.test(text))return show('以下为关联项目明细，可按名称筛选并查看来源。',['projects'],39);
 if(/行为|构成|就医|本地|异地/.test(text))return show('以下按违规行为、就医类型及本地/异地展示费用构成，可继续穿透至128项指标与项目明细。',['behavior','dimensions','matrix'],37);
 if(selected||/概况|概览|情况|风险分析/.test(text))return show(`检查时间${b.date}，类型${b.type}，当前${b.stage}，单次风险指数${b.score}分（${recordRisk(b)}），违规费用${money(b.fee)}元。请选择接下来要开展的分析。`,['check'],36);
 return result('您希望继续分析哪个方面？已保留当前机构和检查批次。',[],next);
}
