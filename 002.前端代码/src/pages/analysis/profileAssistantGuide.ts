import {institutions} from '../home/regulator/data';
import {newContext,respond,type Context,type Result} from '../home/regulator/engine';
export type ProfileListFilters={name:string;code:string;risk:string;level:string};
export const emptyProfileFilters:ProfileListFilters={name:'',code:'',risk:'',level:''};
export const listWelcome='您好，我是医小保。您已进入“医疗机构监管履历画像”。\n\n您可以在页面中筛选医疗机构，查看机构风险等级、历次风险变化、违规费用和检查记录，并继续下钻查看某次检查的风险结果与费用明细。\n\n浏览过程中，您可以随时让我帮您：\n\n- 查找或定位医疗机构\n- 解读当前页面的指标和图表\n- 分析机构风险变化及主要原因\n- 查看区内排名或比较不同机构\n- 定位需要重点关注的检查\n- 生成监管建议或机构画像报告\n\n您可以直接操作页面，也可以告诉我想了解什么，我会结合您当前查看的机构或检查继续分析。';
export const capabilityActions=['查找或定位医疗机构','解读当前页面的指标和图表','分析机构风险变化及主要原因','查看区内排名或比较不同机构','定位需要重点关注的检查','生成监管建议或机构画像报告'];
export const listQuestions=['查询一家医疗机构','查看高风险机构','解读当前页面','比较两家机构'];
export const institutionQuestions=['解读这家机构的画像','为什么这家机构风险高','查看全区排名','与其他机构比较','查看最近一次检查','生成机构画像报告'];
export const checkQuestions=['概括本次检查结果','主要风险来自哪里','哪些违规项目金额较高','查看本地与异地差异','解读检查办理进度','生成本次检查建议'];
export function profileGuide(code?:string,batch?:string){const org=institutions.find(i=>i.code===code);return {welcome:batch?`我已识别到您正在查看“${org?.name||code}”的${batch}检查。\n您可以通过页面筛选本地或异地、险种、就医类型、行为认定及违规项目，也可以让我帮您概括本次检查结果、解释主要风险来源、分析违规费用构成或查看办理进度。`:org?`我已识别到您正在查看“${org.name}”的监管画像。\n您可以自行查看该机构的风险等级、历次风险变化、违规费用和检查记录，也可以让我帮您分析风险较高的原因、查看区内排名、比较其他机构或生成机构画像报告。`:listWelcome,questions:batch?checkQuestions:org?institutionQuestions:listQuestions};}
export const matchingInstitutions=(f:ProfileListFilters)=>institutions.filter(i=>i.name.includes(f.name.trim())&&i.code.toLowerCase().includes(f.code.trim().toLowerCase())&&(!f.risk||i.risk===f.risk)&&(!f.level||i.level===f.level+'级'));
export const filterSummary=(f:ProfileListFilters)=>[f.name&&'机构名称：'+f.name,f.code&&'机构代码：'+f.code,f.risk&&'风险等级：'+f.risk,f.level&&'结算等级：'+f.level+'级'].filter(Boolean).join('；')||'全部机构（未设置筛选条件）';
export function respondProfileGuide(text:string,previous:Context,filters:ProfileListFilters,code?:string,batch?:string):Result{
 const scoped=matchingInstitutions(filters),c={...previous};
 if(!code&&capabilityActions.includes(text))Object.assign(c,newContext(),{institution:undefined,batch:undefined,pending:undefined});
 const capabilities:Record<string,string>={'查找或定位医疗机构':'查询一家医疗机构','解读当前页面的指标和图表':code?'解读这家机构的画像':'解读当前页面'};
 text=capabilities[text]||text;
 const reply=(content:string,actions:string[]=[],pending?:string):Result=>({node:0,context:{...c,pending},content,views:[],steps:[],actions,citations:[]});
 if(text==='生成监管建议或机构画像报告')return reply('请选择希望生成的内容，我会结合目标机构继续分析。',['生成监管建议','生成机构画像报告']);
 if(!code&&!c.institution){
  Object.assign(c,{risk:filters.risk||undefined,level:filters.level?filters.level+'级':undefined,recordCodes:scoped.map(i=>i.code)});
  if(text==='分析机构风险变化及主要原因')return reply('请选择需要分析的医疗机构，我会展示风险变化，并继续追溯主要原因。',[],'assistant-risk');
  if(text==='查看区内排名或比较不同机构')return reply('您可以选择一家机构查看区内排名，或选择两家机构开展比较。',['比较两家机构'],'assistant-rank');
  if(text==='定位需要重点关注的检查')return reply('请选择医疗机构，我会定位风险较高、变化明显或尚未办结的检查。',[],'assistant-checks');
  if(text==='生成监管建议'||text==='生成机构画像报告')return reply(`请选择需要${text}的医疗机构。`,[],text==='生成监管建议'?'assistant-advice':'assistant-report');
  if(text==='查询一家医疗机构')return reply(`已继承当前筛选条件：${filterSummary(filters)}，共${scoped.length}家机构。请选择机构名称或输入机构代码进行定位。`,[],'assistant-find');
  if(text==='比较两家机构')return reply(`请从当前筛选范围内选择两家不同的医疗机构。当前范围：${filterSummary(filters)}，共${scoped.length}家。`,[],'assistant-compare');
  if(text==='查看高风险机构'||text==='查询高风险机构'){const high=scoped.filter(i=>i.risk==='高风险');return reply(`在当前筛选条件（${filterSummary(filters)}）内，共找到${high.length}家高风险机构。${high.length?'请选择机构继续查看监管画像。':'请调整页面筛选条件后重试。'}`,high.slice(0,5).map(i=>`查看${i.code}的监管画像`),'assistant-find');}
  if(text==='解读当前页面')return reply(`当前页面是医疗机构监管履历画像列表。已继承筛选条件：${filterSummary(filters)}，列表共${scoped.length}家机构，其中高风险${scoped.filter(i=>i.risk==='高风险').length}家、中风险${scoped.filter(i=>i.risk==='中风险').length}家、低风险${scoped.filter(i=>i.risk==='低风险').length}家。\n\n上方风险概况卡展示全区机构分布；下方列表按已提交的机构名称、机构代码、风险等级和结算等级筛选。点击“查看详情”可进入机构画像，再下钻查看单次检查。`,listQuestions);
 }
 const aliases:Record<string,string>={
  '分析机构风险变化及主要原因':'查看风险变化','查看区内排名或比较不同机构':'查看全区排名','定位需要重点关注的检查':'查看重点检查',
  '解读这家机构的画像':`查看${code||c.institution}的监管画像`,
  '为什么这家机构风险高':'追溯风险原因','为什么风险这么高':batch?'分析风险等级及指数依据':'追溯风险原因',
  '和同类机构比怎么样':batch?'同类机构横向对标':'与同结算等级机构比较',
  '概括本次检查结果':'查看本次检查风险概况','主要风险来自哪里':'分析违规行为及费用构成',
  '哪些违规项目金额较高':'查看违规项目','查看本地与异地差异':'分析本地异地费用构成',
  '解读检查办理进度':'查询本次监管阶段及进度','生成本次检查建议':'生成本次检查监管建议'
 };
 const result=respond(aliases[text]||text,c);
 // UI flow markers should not leak into ordinary analytical conversation.
 if(result.context.pending?.startsWith('assistant-'))result.context.pending=undefined;
 return result;
}
