import ProfilePageHeader from './ProfilePageHeader';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { AutoComplete, Button, DatePicker, Empty, Modal, Segmented, Select, Tooltip } from 'antd';
import { FileTextOutlined, SearchOutlined } from '@ant-design/icons';
import { CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { feeBehaviors, formatMoney, getProfileChecks, PROFILE_PATH, profileInstitutions, profileVisits } from './profileData';
import './profiles.css';
import './detail.css';

const emptyFilter={batch:'',type:'',start:'',end:'',risk:'',stage:''};
const types=['飞行检查','专项检查','日常检查'];
function Section({title,extra,children,id}:{title:string;extra?:ReactNode;children:ReactNode;id?:string}){return <section className="institution-section" id={id}><header className="institution-section-title"><h2>{title}</h2>{extra}</header>{children}</section>}
function RiskTag({risk}:{risk:string}){return <span className={`profile-risk-tag risk-${risk}`}><i/>{risk}</span>}
function CheckTick({x,y,payload}:any){const [date,type]=String(payload.value).split('|');return <g transform={`translate(${x},${y})`}><text textAnchor="middle" fill="#8a9ab1" fontSize={10}><tspan x={0} dy={14}>{date}</tspan><tspan x={0} dy={16}>{type}</tspan></text></g>}
export default function InstitutionDetail(){
 const {code=''}=useParams();
 const {hash}=useLocation();
 const institution=profileInstitutions.find(r=>r.code===code);
 const checks=useMemo(()=>getProfileChecks(code),[code]);
 const [draft,setDraft]=useState(emptyFilter),[filter,setFilter]=useState(emptyFilter),[error,setError]=useState('');
 const [feeMode,setFeeMode]=useState('次均'),[matrixMode,setMatrixMode]=useState('次均'),[trendType,setTrendType]=useState(''),[resource,setResource]=useState<string|null>(null);
 const checkRef=useRef<HTMLDivElement>(null),feeRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{window.scrollTo(0,0);setDraft(emptyFilter);setFilter(emptyFilter);setFeeMode('次均');setMatrixMode('次均');setTrendType('');setError('');},[code]);
 useEffect(()=>{
  if(hash!=='#checks'||!institution)return;
  const frame=requestAnimationFrame(()=>checkRef.current?.scrollIntoView({block:'start'}));
  return ()=>cancelAnimationFrame(frame);
 },[code,hash,institution]);
 const update=(key:keyof typeof emptyFilter,value:string)=>setDraft(p=>({...p,[key]:value}));
 if(!institution)return <div className="profiles-page"><div className="profiles-body"><section className="institution-section"><Empty description="未找到该医疗机构"/><Link to={PROFILE_PATH}>返回机构列表</Link></section></div></div>;
 const latest=checks[0],mean=checks.reduce((n,c)=>n+c.score,0)/checks.length,total=checks.reduce((n,c)=>n+c.fee,0),average=total/checks.length;
 const factor=average/590124.70;
 const feeData=feeBehaviors.map(b=>({...b,amount:+(b.amount*factor*(feeMode==='总体'?checks.length:1)).toFixed(2)}));
 const feeTotal=feeMode==='总体'?total:average;
 const filtered=checks.filter(c=>c.batch.toLowerCase().includes(filter.batch.trim().toLowerCase())&&(!filter.type||c.type===filter.type)&&(!filter.start||c.start>=filter.start)&&(!filter.end||c.end<=filter.end)&&(!filter.risk||c.risk===filter.risk)&&(!filter.stage||c.stage===filter.stage));
 const trend=checks.slice().reverse().filter(c=>!trendType||c.type===trendType).map(c=>({...c,label:`${c.end.slice(0,7)}|${c.type}`,compliance:100-c.score}));
 const decline=trend[0].compliance-trend[trend.length-1].compliance;
 const trendWord=decline>0?'下降':decline<0?'上升':'持平';
 const pending=checks.filter(c=>c.stage!=='已办结').length;
 const checkPath=(batch:string)=>`${PROFILE_PATH}/${code}/checks/${batch}`;
 const advice=[['集中度','重复收费与超范围支付合计占比90.8%，建议优先核查高频、同日重复结算记录。','orange'],['费用结构','异常费用主要集中在门诊，重点比对医嘱、收费清单与医保结算明细。','red'],['重点项目','穿透核验局部润滑麻醉、超声波治疗、麦冬及II级护理等高费用项目。','blue'],['办理进度',`当前共有${pending}次检查尚未办结，需同步跟踪整改材料、费用追回和复核结论。`,'green']];
 function shortcut(name:string){if(name==='检查记录'){checkRef.current?.scrollIntoView({behavior:'smooth',block:'start'});return;}if(name==='费用明细'){feeRef.current?.scrollIntoView({behavior:'smooth',block:'start'});return;}setResource(name);}
 return <div className="profiles-page institution-detail institution-profile-detail">
  <ProfilePageHeader parents={[{title:'医疗机构监管履历画像',to:PROFILE_PATH}]} title={institution.name}/>
  <div className="profiles-body">
   <div className="institution-metrics">
    <article className="institution-risk-summary"><div><h3>风险等级</h3><p className={`institution-risk-value risk-text-${institution.risk}`}><strong>{institution.risk.replace('风险','')}</strong><span>风险</span></p></div><div><h3>机构历次风险值均分</h3><p><strong>{mean.toFixed(2)}</strong><span>分</span></p></div></article>
    <article className="institution-latest"><h3>最新检查风险值得分</h3><div><p><strong>{latest.score.toFixed(2)}</strong><span>分</span></p><Link className="institution-outline-link" to={checkPath(latest.batch)}>查看详情</Link></div></article>
   </div>
   <div ref={checkRef} id="checks" className="institution-scroll-target"><Section title="历年检查与办理进度" extra={<span className="institution-muted">共 {filtered.length} 次检查记录</span>}>
    <form className="profile-filters institution-check-filters" onSubmit={e=>{e.preventDefault();if(draft.start&&draft.end&&draft.start>draft.end){setError('数据开始日期不能晚于数据结束日期');return;}setError('');setFilter({...draft});}}>
     <label>批次号<AutoComplete aria-label="批次号" value={draft.batch} options={checks.map(c=>({value:c.batch}))} filterOption={(s,o)=>String(o?.value).toLowerCase().includes(s.toLowerCase())} onChange={v=>update('batch',v)} placeholder="输入或选择批次号" allowClear/></label>
     <label>检查类型<Select aria-label="检查类型" value={draft.type} onChange={v=>update('type',v)} options={[{value:'',label:'全部检查类型'},...types.map(value=>({value,label:value}))]}/></label>
     <label>数据开始日期<DatePicker aria-label="数据开始日期" format="YYYY/MM/DD" placeholder="年 / 月 / 日" value={draft.start?dayjs(draft.start):null} onChange={date=>update('start',date?.format('YYYY-MM-DD')||'')}/></label>
     <label>数据结束日期<DatePicker aria-label="数据结束日期" format="YYYY/MM/DD" placeholder="年 / 月 / 日" value={draft.end?dayjs(draft.end):null} onChange={date=>update('end',date?.format('YYYY-MM-DD')||'')}/></label>
     <label>风险等级<Select aria-label="风险等级" value={draft.risk} onChange={v=>update('risk',v)} options={[{value:'',label:'全部风险等级'},...['高风险','中风险','低风险'].map(value=>({value,label:value}))]}/></label>
     <label>监管阶段<Select aria-label="监管阶段" value={draft.stage} onChange={v=>update('stage',v)} options={[{value:'',label:'全部监管阶段'},...Array.from(new Set(checks.map(c=>c.stage))).map(value=>({value,label:value}))]}/></label>
     <div className="profile-filter-actions"><Button aria-label="重置检查筛选" onClick={()=>{setDraft(emptyFilter);setFilter(emptyFilter);setError('')}}>重置</Button><Button type="primary" htmlType="submit" aria-label="查询检查记录" icon={<SearchOutlined/>}>查询</Button></div>
    </form>{error&&<p className="institution-filter-error" role="alert">{error}</p>}
    <div className="profile-table-wrap"><table className="profile-table institution-check-table"><thead><tr>{['批次号','检查类型','数据开始日期','数据结束日期','违规费用','单次检查风险值','风险等级','监管阶段','详情'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{filtered.map(c=><tr key={c.batch}><td>{c.batch}</td><td>{c.type}</td><td>{c.start}</td><td>{c.end}</td><td className="institution-numeric">{formatMoney(c.fee)}<small>元</small></td><td className="institution-numeric"><b>{c.score.toFixed(2)}</b></td><td><RiskTag risk={c.risk}/></td><td><span className={`institution-stage ${c.stage==='已办结'?'is-closed':''}`}>{c.stage}</span></td><td><Link className="profile-detail-link" to={checkPath(c.batch)}>查看详情</Link></td></tr>)}</tbody></table>{!filtered.length&&<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的检查记录，请调整筛选条件"/>}</div>
   </Section></div>
   <div className="institution-analysis-grid">
    <div ref={feeRef} className="institution-scroll-target"><Section title="主要违规费用结构" extra={<div className="institution-controls"><span>按行为认定</span><Segmented aria-label="费用统计口径" options={['次均','总体']} value={feeMode} onChange={v=>setFeeMode(String(v))}/></div>}>
     <p className="institution-fee-total">{feeMode}违规费用 <strong data-testid="institution-fee-total">{formatMoney(feeTotal)}</strong> 元</p>
     <div className="institution-fee-layout"><div className="institution-donut"><ResponsiveContainer width="100%" height={260}><PieChart><Pie isAnimationActive={false} data={feeData} dataKey="amount" nameKey="name" innerRadius="59%" outerRadius="90%" stroke="#fff" strokeWidth={1}>{feeData.map(b=><Cell key={b.name} fill={b.color}/>)}</Pie><ChartTooltip formatter={(value:number,name:string)=>[`${formatMoney(value)} 元`,name]}/></PieChart></ResponsiveContainer><div className="institution-donut-center"><strong>8</strong><span>类违规行为</span></div></div>
     <ul className="institution-fee-legend">{feeData.map(b=>{const percent=b.amount/feeTotal*100;return <li key={b.name}><span><i style={{background:b.color}}/>{b.name}</span><span>{formatMoney(b.amount)}元 · {percent<.05?'<0.1':percent.toFixed(1)}%</span></li>})}</ul></div>
    </Section></div>
    <Section title="行为认定×就医类型热力矩阵" extra={<div className="institution-controls"><span>单位：元</span><Segmented aria-label="矩阵统计口径" options={['次均','总体']} value={matrixMode} onChange={v=>setMatrixMode(String(v))}/></div>}>
     <div className="institution-matrix-wrap"><table className="institution-matrix"><thead><tr><th>行为认定</th>{profileVisits.map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{[1,4,2,3,5,6,7,0].map(index=>{const row=feeBehaviors[index];return <tr key={row.name}><th>{row.name}</th>{row.cells.map((cell,i)=>{const value=cell*factor*(matrixMode==='总体'?checks.length:1),ratio=cell/243174.72;const background=!cell?'#f7f9fd':ratio>.5?'#d9531e':ratio>.04?'#f9c58d':ratio>.002?'#fce6cc':'#fff4e7';return <td key={i} style={{background,color:ratio>.5?'white':undefined}}><Tooltip title={`${row.name} / ${profileVisits[i]}：${formatMoney(value)}元`}><span>{cell?Math.round(value).toLocaleString('zh-CN'):'0'}</span></Tooltip></td>})}</tr>})}</tbody></table></div>
     <p className="institution-note">颜色越深表示违规费用越高；矩阵仅保留费用数值，不展示归一化得分。</p>
    </Section>
    <Section title="历次检查得分走势" extra={<div className="institution-controls"><span>检查类型</span><Select aria-label="走势检查类型" value={trendType} onChange={setTrendType} options={[{value:'',label:'全部检查'},...types.map(value=>({value,label:value}))]}/></div>}>
     <div className="institution-line-chart"><ResponsiveContainer width="100%" height={310}><LineChart data={trend} margin={{left:0,right:24,top:30,bottom:20}}><CartesianGrid vertical={false} stroke="#e9eef7"/><XAxis dataKey="label" tick={<CheckTick/>} height={48} interval={0} tickLine={false} axisLine={{stroke:'#e3eaf5'}} padding={{left:18,right:18}}/><YAxis domain={[0,100]} ticks={[0,20,40,60,80,100]} tick={{fill:'#91a1b9',fontSize:11}} width={35} tickLine={false} axisLine={false}/><ChartTooltip labelFormatter={v=>String(v).replace('|',' ')} formatter={(v:number)=>[`${v.toFixed(2)}分`,'合规得分']}/><Line isAnimationActive={false} type="linear" dataKey="compliance" name="合规得分" stroke="#0156ff" strokeWidth={2.5} dot={{fill:'#fff',strokeWidth:2,r:4}} activeDot={{r:6}}><LabelList dataKey="compliance" formatter={(value:number)=>value.toFixed(2)} position="top" fill="#415a80" fontSize={11}/></Line></LineChart></ResponsiveContainer></div>
     <div className="institution-trend-summary"><span>共 {trend.length} 次检查</span><strong>{decline===0?'区间持平':`区间${trendWord} ${Math.abs(decline).toFixed(2)} 分`}</strong></div>
     <p className="institution-note institution-trend-interpretation">{trendType||'全部检查'}得分总体呈{trendWord==='持平'?'平稳':trendWord}趋势，最新得分为{trend[trend.length-1].compliance.toFixed(2)}分，建议{decline>0?'纳入重点跟踪并结合项目明细开展复核':'持续跟踪并结合检查结果开展常态监管'}。</p>
    </Section>
    <Section title="后续核查建议">
     <div className="institution-advice-stats">{[['重点行为','4类','覆盖违规费用99.3%'],['高费用项目','12项','建议逐项穿透核验'],['待处理检查',`${pending}次`,'未办结检查数量']].map(([title,value,desc])=><div key={title}><span>{title}</span><strong>{value}</strong><p>{desc}</p></div>)}</div>
     <div className="institution-advice-grid">{advice.map(([title,content,color])=><article key={title}><span className={`institution-advice-label ${color}`}>{title}</span><p>{content}</p></article>)}</div>
     <div className="institution-shortcuts"><span>数据依据</span>{['数据依据','费用明细','检查记录','整改材料','结算凭证'].map(name=><button key={name} onClick={()=>shortcut(name)}>{name}</button>)}</div>
    </Section>
   </div>
  </div>
  <Modal title={resource} open={!!resource} onCancel={()=>setResource(null)} footer={<Button type="primary" onClick={()=>setResource(null)}>关闭</Button>}>
   <div className="institution-resource"><FileTextOutlined/><h3>{institution.name} · {resource}</h3>{resource==='数据依据'?<><p>机构代码：{institution.code}；统计范围：2023年1月至今，共{checks.length}次检查。</p><p>风险均分：{mean.toFixed(2)}分；次均违规费用：{formatMoney(average)}元。总体口径为历次检查合计，次均口径为合计除以检查次数。得分走势图展示100减单次风险值的合规得分。</p></>:resource==='整改材料'?<><ul>{checks.filter(c=>c.stage!=='已办结').map(c=><li key={c.batch}>{c.batch} · {c.stage} · 待核验整改说明、费用追回记录及复核结论</li>)}</ul><p>当前未接入真实材料附件。</p></>:<><p>历次检查违规费用合计：{formatMoney(total)}元。</p></>}</div>
  </Modal>
 </div>;
}
