import ProfilePageHeader from './ProfilePageHeader';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { AutoComplete, Button, DatePicker, Empty, Table, Tabs, Typography, Segmented, Select, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { hasProfileResult, profileStages, formatMoney, getProfileChecks, PROFILE_PATH, profileInstitutions, profileVisits } from './profileData';
import { getCheckItems, checkBehaviors, checkColors } from './checkData';
import './profiles.css';
import './detail.css';

const emptyFilter={batch:'',type:'',start:'',end:'',risk:'',stage:''};
const types=['飞行检查','专项检查','日常检查'];
function Section({title,extra,children,id}:{title?:string;extra?:ReactNode;children:ReactNode;id?:string}){return <section className="institution-section" id={id}>{title&&<header className="institution-section-title"><h2>{title}</h2>{extra}</header>}{children}</section>}
function RiskTag({risk}:{risk:string}){return <span className={`profile-risk-tag risk-${risk}`}><i/>{risk}</span>}
function CheckTick({x,y,payload}:any){const [date,type]=String(payload.value).split('|');return <g transform={`translate(${x},${y})`}><text textAnchor="middle" fill="#8a9ab1" fontSize={10}><tspan x={0} dy={14}>{date}</tspan><tspan x={0} dy={16}>{type}</tspan></text></g>}
export default function InstitutionDetail(){
 const {code=''}=useParams();
 const {hash}=useLocation();
 const institution=profileInstitutions.find(r=>r.code===code);
 const checks=useMemo(()=>getProfileChecks(code),[code]);
 const [moreFilters,setMoreFilters]=useState(false);
 const [recordPage,setRecordPage]=useState(1),[recordSize,setRecordSize]=useState(10);
 const [mainTab,setMainTab]=useState('analysis'),[analysisTab,setAnalysisTab]=useState('fees'),[loading,setLoading]=useState(false);
 const [draft,setDraft]=useState(emptyFilter),[filter,setFilter]=useState(emptyFilter),[error,setError]=useState('');
 const [feeMode,setFeeMode]=useState('次均'),[matrixMode,setMatrixMode]=useState('次均'),[trendType,setTrendType]=useState('');
 const layoutRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const layout=layoutRef.current;if(!layout)return;
  const resize=()=>layout.style.setProperty('--overview-height',`${Math.max(320,window.innerHeight-layout.getBoundingClientRect().top-20)}px`);
  resize();const observer=new ResizeObserver(resize);
  if(layout.parentElement)observer.observe(layout.parentElement);
  window.addEventListener('resize',resize);
  return ()=>{observer.disconnect();window.removeEventListener('resize',resize);};
 },[code]);
 const checkRef=useRef<HTMLDivElement>(null),feeRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{window.scrollTo(0,0);setDraft(emptyFilter);setFilter(emptyFilter);setFeeMode('次均');setMatrixMode('次均');setTrendType('');setError('');},[code]);
 useEffect(()=>{
  if(hash!=='#checks'||!institution)return;setMainTab('checks');
  const frame=requestAnimationFrame(()=>checkRef.current?.scrollIntoView({block:'start'}));
  return ()=>cancelAnimationFrame(frame);
 },[code,hash,institution]);
 const update=(key:keyof typeof emptyFilter,value:string)=>setDraft(p=>({...p,[key]:value}));
 if(!institution)return <div className="profiles-page"><div className="profiles-body"><section className="institution-section"><Empty description="未找到该医疗机构"/><Link to={PROFILE_PATH}>返回机构列表</Link></section></div></div>;
 const valid=checks.filter(hasProfileResult).sort((a,b)=>b.date.localeCompare(a.date)||b.created.localeCompare(a.created));
 const latest=valid[0],total=valid.reduce((n,c)=>n+c.fee,0),average=valid.length?total/valid.length:0;
 const resultItems=valid.flatMap(c=>getCheckItems(code,c.batch));
 const resultTotal=resultItems.reduce((n,r)=>n+r.amount,0);
 const feeData=checkBehaviors.map((name,index)=>({name,color:checkColors[index],amount:resultItems.filter(r=>r.behavior===name).reduce((n,r)=>n+r.amount,0)/(feeMode==='次均'?valid.length||1:1)})).sort((a,b)=>b.amount-a.amount);
 const feeTotal=feeMode==='总体'?resultTotal:resultTotal/(valid.length||1);

 const filtered=checks.filter(c=>c.batch.toLowerCase().includes(filter.batch.trim().toLowerCase())&&(!filter.type||c.type===filter.type)&&(!filter.start||c.start>=filter.start)&&(!filter.end||c.end<=filter.end)&&(!filter.risk||(hasProfileResult(c)&&c.risk===filter.risk))&&(!filter.stage||c.stage===filter.stage));
 const trend=valid.slice().reverse().filter(c=>!trendType||c.type===trendType).map(c=>({...c,label:`${c.date}|${c.type}`}));
 const decline=trend.length?trend[trend.length-1].score-trend[0].score:0;
 const trendWord=decline>0?'上升':decline<0?'下降':'持平';
 const pending=checks.filter(c=>!hasProfileResult(c)).length;
 const checkPath=(batch:string)=>`${PROFILE_PATH}/${code}/checks/${batch}`;
 const summary=[latest?`最新有效检查风险值为${latest.score.toFixed(2)}分，${latest.risk}。`:'暂无已形成结果的有效检查。',total?`费用最高的两类行为合计占比${((feeData[0].amount+feeData[1].amount)/feeTotal*100).toFixed(2)}%。`:'暂无有效违规费用数据。',`当前有${pending}次检查尚未形成结果。`];
 return <div className="profiles-page institution-detail institution-profile-detail">
  <ProfilePageHeader parents={[{title:'医疗机构监管履历画像',to:PROFILE_PATH}]} title={institution.name}/>
  <div className="profiles-body">
   <div className="institution-metrics">
    <article className="institution-risk-summary"><div><h3>风险等级</h3><p className={`institution-risk-value risk-text-${institution.risk}`}><strong className="institution-risk-label">{institution.risk}</strong></p></div><div><h3>机构综合风险值</h3><p><strong>{institution.score.toFixed(2)}</strong><span>分</span></p></div></article>
    <article className="institution-latest"><h3>最新有效检查风险值</h3><div><p><strong>{latest?latest.score.toFixed(2):'—'}</strong>{latest&&<span>分</span>}</p>{latest?<Link className="institution-outline-link" to={checkPath(latest.batch)}>查看详情</Link>:<span className="institution-no-valid-check">暂无有效检查</span>}</div></article>
   </div>
   <div ref={layoutRef} className="institution-detail-layout"><aside className="institution-business-card"><div className="institution-default-cover"><img src="/images/hospital-default.png" alt="通用医疗机构建筑封面"/></div><h2>{institution.name}</h2><dl><dt>机构代码</dt><dd><Typography.Text copyable>{institution.code}</Typography.Text></dd><dt>机构性质</dt><dd>{institution.nature}</dd><dt>结算等级</dt><dd>{['','一级','二级','三级'][institution.level]}</dd><dt>机构地址</dt><dd>{institution.address}</dd></dl></aside><div className="institution-right-panel"><Tabs className="institution-primary-tabs" activeKey={mainTab} onChange={setMainTab} items={[{key:'analysis',label:'数据分析'},{key:'checks',label:`检查记录（${checks.length}）`}]}/>{mainTab==='analysis'&&<Tabs className="institution-secondary-tabs" activeKey={analysisTab} onChange={setAnalysisTab} items={[{key:'fees',label:'违规费用结构'},{key:'matrix',label:'行为与就医类型'},{key:'trend',label:'风险值趋势'},{key:'advice',label:'监管关注建议'}]}/>}
   <div style={{display:mainTab==='checks'?'block':'none'}} ref={checkRef} id="checks" className="institution-scroll-target"><Section>
    <form className={`profile-filters institution-check-filters compact-record-filters${moreFilters?' is-expanded':''}`} onSubmit={e=>{e.preventDefault();if(draft.start&&draft.end&&draft.start>draft.end){setError('开始日期不能晚于结束日期');return;}setError('');setLoading(true);setFilter({...draft});setRecordPage(1);setTimeout(()=>setLoading(false),150);}}>
     <label className="record-filter-field"><AutoComplete aria-label="批次号" value={draft.batch} options={checks.map(c=>({value:c.batch}))} filterOption={(s,o)=>String(o?.value).toLowerCase().includes(s.toLowerCase())} onChange={v=>update('batch',v)} placeholder="批次号" allowClear/></label>
     <label className="record-filter-field"><Select aria-label="检查类型" value={draft.type} onChange={v=>update('type',v)} options={[{value:'',label:'检查类型：全部'},...types.map(value=>({value,label:`检查类型：${value}`}))]}/></label>
     <label className="record-filter-field"><DatePicker aria-label="数据开始日期" format="YYYY/MM/DD" placeholder="数据开始日期" value={draft.start?dayjs(draft.start):null} onChange={date=>update('start',date?.format('YYYY-MM-DD')||'')}/></label>
     <label className="record-filter-field"><DatePicker aria-label="数据结束日期" format="YYYY/MM/DD" placeholder="数据结束日期" value={draft.end?dayjs(draft.end):null} onChange={date=>update('end',date?.format('YYYY-MM-DD')||'')}/></label>
     <label className="record-filter-field"><Select aria-label="风险等级" value={draft.risk} onChange={v=>update('risk',v)} options={[{value:'',label:'风险等级：全部'},...['高风险','中风险','低风险'].map(value=>({value,label:`风险等级：${value}`}))]}/></label>
     <label className="record-filter-field"><Select aria-label="监管阶段" value={draft.stage} onChange={v=>update('stage',v)} options={[{value:'',label:'监管阶段：全部'},...profileStages.map(value=>({value,label:`监管阶段：${value}`}))]}/></label>
     <div className="profile-filter-actions"><Button type="link" aria-expanded={moreFilters} aria-controls="checks" onClick={()=>setMoreFilters(v=>!v)}>{moreFilters?'收起':'更多筛选'}{[draft.start,draft.end,draft.risk,draft.stage].filter(Boolean).length?`（${[draft.start,draft.end,draft.risk,draft.stage].filter(Boolean).length}）`:''}</Button><Button aria-label="重置检查筛选" onClick={()=>{setDraft(emptyFilter);setFilter(emptyFilter);setRecordPage(1);setError('')}}>重置</Button><Button type="primary" htmlType="submit" loading={loading} aria-label="查询检查记录" icon={<SearchOutlined/>}>查询</Button></div>
    </form>{error&&<p className="institution-filter-error" role="alert">{error}</p>}
    <Table rowKey="batch" size="small" loading={loading} dataSource={filtered} scroll={{x:1550,y:560}} onChange={(p)=>{setRecordPage(p.current||1);setRecordSize(p.pageSize||10);}} pagination={{current:recordPage,pageSize:recordSize,pageSizeOptions:[10,20],showSizeChanger:true}} locale={{emptyText:'暂无符合条件的检查记录，请调整筛选条件'}} columns={[
 {title:'序号',width:65,fixed:'left',render:(_,c,index)=>(recordPage-1)*recordSize+index+1},
 {title:'批次号',dataIndex:'batch',width:180,fixed:'left',render:v=><Link to={checkPath(v)}>{v}</Link>},
 {title:'检查类型',dataIndex:'type',width:100},
 {title:'数据开始日期',dataIndex:'start',width:130,defaultSortOrder:'descend',sorter:(a,b)=>a.start.localeCompare(b.start)||a.created.localeCompare(b.created)},
 {title:'数据结束日期',dataIndex:'end',width:130},
 ...(['fee','score'] as const).map(key=>({title:key==='fee'?'违规费用总额':'单次检查风险值',width:150,sorter:(a:typeof checks[number],b:typeof checks[number],order?:string)=>!hasProfileResult(a)||!hasProfileResult(b)?(hasProfileResult(a)?-1:hasProfileResult(b)?1:0)*(order==='descend'?-1:1):a[key]-b[key],render:(_:unknown,c:typeof checks[number])=>hasProfileResult(c)?(key==='fee'?`${formatMoney(c.fee)}元`:c.score.toFixed(2)):<Tooltip title={key==='fee'?'当前检查尚未形成结果，暂未产生违规费用数据':'当前检查尚未形成结果，尚未具备风险值计算条件'}>—</Tooltip>})),
 {title:'单次检查风险等级',width:150,render:(_,c)=>hasProfileResult(c)?<RiskTag risk={c.risk}/>: '—'},
 {title:'最新操作时间',dataIndex:'updated',width:130},{title:'监管阶段',dataIndex:'stage',width:120,render:(value:string)=><span className={`institution-stage ${hasProfileResult({stage:value})?'is-closed':''}`}>{value}</span>},
 {title:'查看详情',width:100,fixed:'right',render:(_,c)=><Link to={checkPath(c.batch)}>查看详情</Link>}
 ]}/>
   </Section></div>
   <div className={`institution-analysis-grid active-${analysisTab}`} style={{display:mainTab==='analysis'?'grid':'none'}} >
    <div ref={feeRef} className="institution-scroll-target"><Section title="主要违规费用结构" extra={<div className="institution-controls"><span>按行为认定</span><Segmented aria-label="费用统计口径" options={['次均','总体']} value={feeMode} onChange={v=>setFeeMode(String(v))}/></div>}>
     <p className="institution-fee-total">{feeMode}违规费用 <strong data-testid="institution-fee-total">{formatMoney(feeTotal)}</strong> 元</p>
     {!valid.length&&<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无有效检查费用数据"/>}<div className="institution-fee-layout"><div className="institution-donut"><ResponsiveContainer width="100%" height="100%" minHeight={180}><PieChart><Pie isAnimationActive={false} data={feeData} dataKey="amount" nameKey="name" innerRadius="59%" outerRadius="90%" stroke="#fff" strokeWidth={1}>{feeData.map(b=><Cell key={b.name} fill={b.color}/>)}</Pie><ChartTooltip formatter={(value:number,name:string)=>[`${formatMoney(value)} 元 · ${(feeTotal?value/feeTotal*100:0).toFixed(2)}% · ${feeMode}`,name]}/></PieChart></ResponsiveContainer><div className="institution-donut-center"><strong style={{fontSize:18}}>{formatMoney(feeTotal)}</strong><span>违规费用合计（元）</span></div></div>
     <ul className="institution-fee-legend">{feeData.map(b=>{const percent=feeTotal?b.amount/feeTotal*100:0;return <li key={b.name} title={`${b.name}：${formatMoney(b.amount)}元 · ${percent.toFixed(2)}% · ${feeMode}`}><span><i style={{background:b.color}}/>{b.name}</span><span>{formatMoney(b.amount)}元 · {percent.toFixed(2)}%</span></li>})}</ul></div>
    </Section></div>
    <Section title="行为认定×就医类型热力矩阵" extra={<div className="institution-controls"><span>单位：元</span><Segmented aria-label="矩阵统计口径" options={['次均','总体']} value={matrixMode} onChange={v=>setMatrixMode(String(v))}/></div>}>
     <div className="institution-matrix-wrap"><table className="institution-matrix"><thead><tr><th>行为认定</th>{profileVisits.map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{[1,4,2,3,5,6,7,0].map(index=>{const row={name:checkBehaviors[index],cells:profileVisits.map(visit=>resultItems.filter(r=>r.behavior===checkBehaviors[index]&&r.visit===visit).reduce((n,r)=>n+r.amount,0))};return <tr key={row.name}><th>{row.name}</th>{row.cells.map((cell,i)=>{const value=cell/(matrixMode==='次均'?valid.length||1:1),ratio=resultTotal?cell/resultTotal:0;const background=!cell?'#f7f9fd':ratio>.5?'#d9531e':ratio>.04?'#f9c58d':ratio>.002?'#fce6cc':'#fff4e7';return <td key={i} style={{background,color:ratio>.5?'white':undefined}}><Tooltip title={`${row.name} / ${profileVisits[i]}：${formatMoney(value)}元 · ${(ratio*100).toFixed(2)}% · ${matrixMode}`}><span>{formatMoney(value)}</span></Tooltip></td>})}</tr>})}</tbody></table></div>
     <p className="institution-note">颜色越深表示违规费用越高；矩阵仅保留费用数值，不展示归一化得分。</p>
    </Section>
    <Section title="风险值趋势" extra={<div className="institution-controls"><span>检查类型</span><Select aria-label="走势检查类型" value={trendType} onChange={setTrendType} options={[{value:'',label:'全部检查'},...types.map(value=>({value,label:value}))]}/></div>}>
     <div className="institution-line-chart">{!trend.length&&<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的有效检查记录"/>}<ResponsiveContainer width="100%" height="100%" minHeight={180}><LineChart data={trend} margin={{left:0,right:24,top:30,bottom:20}}><CartesianGrid vertical={false} stroke="#e9eef7"/><XAxis dataKey="label" tick={<CheckTick/>} height={48} interval={0} tickLine={false} axisLine={{stroke:'#e3eaf5'}} padding={{left:18,right:18}}/><YAxis domain={[0,100]} ticks={[0,20,40,60,80,100]} tick={{fill:'#91a1b9',fontSize:11}} width={35} tickLine={false} axisLine={false}/><ChartTooltip labelFormatter={v=>String(v).replace('|',' ')} content={({active,payload})=>{const c=payload?.[0]?.payload;return active&&c?<div style={{background:'#fff',padding:14,border:'1px solid #dfe7f2',lineHeight:1.8}}>{c.batch}<br/>{c.date} · {c.type}<br/>{c.start} 至 {c.end}<br/>{c.score.toFixed(2)}分 · {c.risk}</div>:null;}}/><ReferenceLine y={20} stroke="#f5b400" strokeDasharray="4 4"/><ReferenceLine y={60} stroke="#ff4d4f" strokeDasharray="4 4"/><Line isAnimationActive={false} type="linear" dataKey="score" name="单次检查风险值" stroke="#0156ff" strokeWidth={2.5} dot={{fill:'#fff',strokeWidth:2,r:4}} activeDot={{r:6}}><LabelList dataKey="score" formatter={(value:number)=>value.toFixed(2)} position="top" fill="#415a80" fontSize={11}/></Line></LineChart></ResponsiveContainer></div>
     <div className="institution-trend-summary"><span>共 {trend.length} 次检查</span><strong>{decline===0?'区间持平':`区间${trendWord} ${Math.abs(decline).toFixed(2)} 分`}</strong></div>
    </Section>
    <Section><div className="institution-advice-content">
 <div className="institution-advice-summary"><h3>医小保监管摘要</h3><ul>{summary.map(t=><li key={t}>{t}</li>)}</ul></div>
 <div className="institution-advice-list">
 {valid.length>0&&feeTotal>0&&<article className="institution-advice-row"><header><span className="institution-priority priority-high">高优先级</span><h3>复核重点行为</h3></header><dl><dt>数据依据</dt><dd>{feeData[0].name}涉及 <strong>{formatMoney(feeData[0].amount)}元</strong>（{feeMode}）</dd><dt>建议动作</dt><dd>核对相关收费清单、医嘱与医保支付范围。</dd><dt>关联检查</dt><dd className="institution-advice-links">{valid.map(c=><Link key={c.batch} to={checkPath(c.batch)}>{c.batch}</Link>)}</dd></dl><footer><Button size="small" onClick={()=>setAnalysisTab('fees')}>查看费用明细</Button><Button size="small" onClick={()=>setAnalysisTab('trend')}>查看风险趋势</Button></footer></article>}
 {pending>0&&<article className="institution-advice-row"><header><span className="institution-priority priority-medium">中优先级</span><h3>跟踪检查办理进度</h3></header><dl><dt>数据依据</dt><dd>{pending}次检查尚未形成结果</dd><dt>建议动作</dt><dd>跟踪当前办理阶段，核实所需材料和后续安排。</dd><dt>关联检查</dt><dd className="institution-advice-links">{checks.filter(c=>!hasProfileResult(c)).map(c=><Link key={c.batch} to={checkPath(c.batch)}>{c.batch} · {c.stage}</Link>)}</dd></dl><footer><Button size="small" onClick={()=>setMainTab('checks')}>查看关联检查</Button></footer></article>}
 </div><p className="institution-advice-disclaimer">智能生成，仅供监管研判参考。</p></div></Section>
   </div></div></div>
  </div>

 </div>;
}
