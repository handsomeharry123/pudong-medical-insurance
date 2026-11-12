import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Segmented, Switch, Tooltip as Hint } from 'antd';
import { ArrowLeftOutlined, CloseOutlined, ExpandOutlined, ShrinkOutlined, ReloadOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { money } from './regulator/data';
import { snapshot, totals, risks, riskColors, riskStructure, settlement, trends, stages, progress, projectRanking, behaviorTotals, orgs, top10, sortRisk, summary, type Org, type Period } from './dashboard/model';
import PudongMap3D from './dashboard/PudongMap3D';
import { PROFILE_PATH } from '../analysis/profileData';
import './Dashboard.css';

function Panel({title,extra,children,className=''}:{title:string;extra?:ReactNode;children:ReactNode;className?:string}){return <section className={`history-panel ${className}`}><header><h2>{title}</h2>{extra}</header>{children}</section>;}
const chartTick={fontSize:11,fill:'#9ac2db'};
const chartTip={border:'1px solid #1986ba',backgroundColor:'#07223f',color:'#c9f4ff',borderRadius:4,fontSize:12,boxShadow:'0 0 18px #00cfff20'};
function useScroller(ref:React.RefObject<HTMLDivElement>,paused:boolean){
 useEffect(()=>{
  if(paused||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let interval:ReturnType<typeof setInterval>|undefined;
  const delay=setTimeout(()=>{interval=setInterval(()=>{const el=ref.current;if(!el||el.scrollHeight<=el.clientHeight)return;const half=el.scrollHeight/2;el.scrollTop=el.scrollTop>=half?el.scrollTop-half:el.scrollTop+1;},90);},1500);
  return()=>{clearTimeout(delay);if(interval)clearInterval(interval);};
 },[paused,ref]);
}
function OrgList({items,onSelect,pause,onInteract}:{items:Org[];onSelect:(org:Org)=>void;pause:boolean;onInteract:()=>void}){
 const ref=useRef<HTMLDivElement>(null);useScroller(ref,pause);
 useEffect(()=>{if(ref.current)ref.current.scrollTop=0;},[items.map(i=>i.code).join(',')]);
 const row=(org:Org,duplicate:boolean)=><button className="history-org-row" key={org.code} tabIndex={duplicate?-1:0} onClick={()=>{onInteract();onSelect(org);}} aria-label={`查看${org.name}摘要`}><span><strong>{org.name}</strong><small>{org.code}</small></span><span className="history-risk-text" style={{color:riskColors[org.risk]}}>{org.risk}</span><span>{org.level}</span><strong>{org.latest.toFixed(2)}</strong><span>{org.pending}</span></button>;
 return <><div className="history-org-table-head"><span>机构名称 / 代码</span><span>风险等级</span><span>结算等级</span><span>最新风险值</span><span>未办结</span></div><div className="history-org-scroll" ref={ref} aria-label="医疗机构自动滚动列表">{items.length?<><div>{items.map(org=>row(org,false))}</div>{items.length>5&&<div aria-hidden="true">{items.map(org=>row(org,true))}</div>}</>:<div className="history-empty">当前条件下没有机构</div>}</div></>;
}
function Ranking({onSelect,onInteract}:{onSelect:(o:Org)=>void;onInteract:()=>void}){
 const [hover,setHover]=useState(false),ref=useRef<HTMLDivElement>(null);useScroller(ref,hover);
 const rows=(duplicate:boolean)=>top10.map((org,index)=><button key={org.code} tabIndex={duplicate?-1:0} className="history-rank-row" onClick={()=>{onInteract();onSelect(org);}} aria-label={`排名${index+1} ${org.name}`}><span className={index<3?'top':''}>{String(index+1).padStart(2,'0')}</span><div><strong>{org.name}</strong><small>{org.code} <em style={{color:riskColors[org.risk]}}>{org.risk}</em></small></div><div className="history-rank-score"><strong>{org.latest.toFixed(2)}</strong><small className={org.change==='上升'?'rise':''}>{org.scoreChange>0?`↑ +${org.scoreChange.toFixed(2)}`:org.scoreChange<0?`↓ ${org.scoreChange.toFixed(2)}`:'— 0.00'}</small></div></button>);
 return <div className="history-rank-scroll" ref={ref} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHover(false);}} aria-label="机构风险排名自动滚动列表"><div>{rows(false)}</div><div aria-hidden="true">{rows(true)}</div></div>;
}
function RiskTrend({period}:{period:Period}){
 const rows=trends[period];
 const label=(value:string)=>period==='月度'?`${value.slice(5)}月`:period==='季度'?value.replace('2026 ','').replace('2025 ','25 '):value;
 return <div className="history-risk-trends" aria-label={`${period}风险机构数量趋势，各行独立刻度，单位家`}>
  {risks.map((risk,index)=>{
   const values=rows.map(row=>row[risk]),latest=values[values.length-1],delta=latest-values[values.length-2];
   const padding=Math.max(1,Math.ceil((Math.max(...values)-Math.min(...values))*.25));
   const min=Math.max(0,Math.min(...values)-padding),max=Math.max(...values)+padding;
   return <div className="history-risk-trend-row" key={risk} style={{'--trend-color':riskColors[risk]} as React.CSSProperties}>
    <div className="history-trend-label"><span><i/>{risk}</span><strong>{latest}<small>家</small></strong><em>{delta>0?'↑':delta<0?'↓':'—'} {delta===0?'持平':`${Math.abs(delta)}家`}</em></div>
    <div className="history-trend-spark"><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{top:7,right:8,bottom:7,left:8}}>
      <defs><linearGradient id={`risk-trend-fill-${index}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={riskColors[risk]} stopOpacity={.3}/><stop offset="1" stopColor={riskColors[risk]} stopOpacity={.01}/></linearGradient></defs>
      <YAxis hide domain={[min,max]}/><XAxis hide dataKey="period"/><CartesianGrid vertical={false} stroke="#4d89a72b" strokeDasharray="3 4"/>
      <Tooltip contentStyle={chartTip} labelFormatter={value=>String(value)} formatter={(value:number)=>[`${value} 家`,risk]}/>
      <Area isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches} animationDuration={700} type="monotone" dataKey={risk} stroke={riskColors[risk]} strokeWidth={2.5} fill={`url(#risk-trend-fill-${index})`} dot={{r:2.5,fill:'#12334e',strokeWidth:1.7}} activeDot={{r:4,stroke:'#e5fbff',strokeWidth:1}}/>
    </AreaChart></ResponsiveContainer></div>
    <div className="history-trend-scale"><span>{max}</span><span>{min}</span></div>
   </div>;
  })}
  <div className="history-trend-periods" style={{'--trend-period-count':rows.length} as React.CSSProperties}><span/>{rows.map(row=><span key={row.period}>{label(row.period)}</span>)}<span/></div>
  <div className="history-trend-caption"><span>各行独立刻度 · 单位：家</span><span>↑ ↓ 较上期</span></div>
 </div>;
}
export default function Dashboard(){
 const navigate=useNavigate();
 const [expanded,setExpanded]=useState(false),[auto,setAuto]=useState(false),[mode,setMode]=useState('地图'),[structure,setStructure]=useState('占比');
 const [trend,setTrend]=useState<Period>('月度'),[casePeriod,setCasePeriod]=useState<Period>('年度'),[projectMode,setProjectMode]=useState('总额');
 const [riskFilter,setRiskFilter]=useState(''),[sort,setSort]=useState('风险等级'),[selected,setSelected]=useState<Org|null>(null),[hovered,setHovered]=useState<Org|null>(null),[zoom,setZoom]=useState(1.14);
 const [hovering,setHovering]=useState(false),[otherHover,setOtherHover]=useState(false),[focused,setFocused]=useState(false),[pausedUntil,setPausedUntil]=useState(0),[clock,setClock]=useState(Date.now()),[summaryTime,setSummaryTime]=useState('自动生成');
 const lastInteraction=useRef(0);
 const pause=()=>{lastInteraction.current=Date.now();setPausedUntil(Date.now()+8000);};
 const interaction=()=>pause();
 const paused=hovering||otherHover||focused||!!selected||clock<pausedUntil;
 useEffect(()=>{if(!auto)return;const id=setInterval(()=>{const now=Date.now();setClock(now);if(!hovering&&!otherHover&&!focused&&!selected&&now>=pausedUntil&&now-lastInteraction.current>=8000){setMode(v=>v==='地图'?'机构列表':'地图');lastInteraction.current=now;}},500);return()=>clearInterval(id);},[auto,hovering,otherHover,focused,selected,pausedUntil]);
 useEffect(()=>{if(!selected)return;const close=(e:PointerEvent)=>{if(!(e.target as Element).closest('.history-org-summary,.history-map-point,.history-org-row,.history-rank-row'))setSelected(null);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[selected]);
 useEffect(()=>{const handle=(e:KeyboardEvent)=>{if(e.key==='Escape'){setSelected(null);setExpanded(false);}};document.addEventListener('keydown',handle);return()=>document.removeEventListener('keydown',handle);},[]);
 const choose=(org:Org)=>{setSelected(org);pause();};
 const filter=(risk:string)=>{setRiskFilter(risk);setSelected(null);pause();};
 const visible=[...orgs.filter(o=>!riskFilter||o.risk===riskFilter)].sort(sort==='风险等级'?sortRisk:(a,b)=>b.latest-a.latest);
 const progressData=progress(casePeriod),projectData=projectRanking(projectMode);
 const conclusions=summary({mode,highOnly:riskFilter==='高风险',riskFilter,structure,trend,period:casePeriod,projectMode});
 const go=(org:Org,action:'profile'|'checks')=>navigate(`${PROFILE_PATH}/${encodeURIComponent(org.code)}${action==='checks'?'#checks':''}`);
 const resetCore=()=>{setRiskFilter('');setMode('地图');setSelected(null);setSort('风险等级');setZoom(1.14);pause();};
 const regenerate=()=>{setSummaryTime(new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}));pause();};
 return <div className={`history-dashboard ${expanded?'history-expanded':''}`} data-testid="history-dashboard">
 <div className="history-heading"><Button className="history-back" type="text" icon={<ArrowLeftOutlined/>} onClick={()=>navigate(PROFILE_PATH)} data-testid="dashboard-back">返回监管首页</Button><div><div className="history-eyebrow">PUDONG · MEDICAL INSTITUTION SUPERVISION</div><h1>医疗机构监管履历大屏</h1><p>数据覆盖周期：2022-01-01 — {snapshot} <i/> 最新更新：{snapshot} 18:00</p></div><div className="history-heading-actions"><label title={auto?(paused?'交互中暂停':'每8秒切换'):'已关闭'}><Switch size="small" checked={auto} aria-label="自动轮播" onChange={value=>{setAuto(value);lastInteraction.current=Date.now();setClock(Date.now());}}/>自动轮播</label><Button icon={expanded?<ShrinkOutlined/>:<ExpandOutlined/>} onClick={()=>{setExpanded(!expanded);pause();}}>{expanded?'退出大屏':'展开大屏'}</Button></div></div>
 <div className="history-kpis">
 <button onClick={()=>{setMode('机构列表');setRiskFilter('');setSelected(null);pause();}} data-testid="kpi-institutions"><span>监管机构</span><strong>{totals.institutions}<em>家</em></strong><p>已纳入评级 {totals.institutions} 家 · 覆盖率 100%</p></button>
 <button className={riskFilter==='高风险'?'selected':''} aria-pressed={riskFilter==='高风险'} onClick={()=>riskFilter==='高风险'?resetCore():filter('高风险')} data-testid="kpi-high"><span>高风险机构</span><strong>{totals.high}<em>家</em></strong><p><b>较上月 +2 家</b></p></button>
 <div><span>风险等级上升</span><strong>{totals.rising}<em>家</em></strong><p>其中升至高风险 <b>{totals.risingHigh} 家</b></p></div>
 <div><span>累计监管检查</span><strong>{totals.checks}<em>次</em></strong><p>本年新增 {totals.annual} 次<span>未办结 {totals.pending} 次 / {totals.pendingOrgs} 家机构</span></p></div>
 <div><span>违规费用总额</span><strong>{(totals.fee/10000).toFixed(2)}<em>万元</em></strong></div>
 </div>
 <div className="history-main-grid">
 <div className="history-side-col" onMouseEnter={()=>setOtherHover(true)} onMouseLeave={()=>{setOtherHover(false);pause();}}>
 <Panel title="机构风险等级结构" extra={<Segmented size="small" aria-label="风险结构展示" options={['数量','占比','结算等级']} value={structure} onChange={v=>{setStructure(String(v));pause();}}/>}>
 <div className="history-structure-chart"><ResponsiveContainer width="100%" height="100%">{structure==='占比'?<PieChart><Pie isAnimationActive={false} data={riskStructure} dataKey="count" nameKey="name" innerRadius="65%" outerRadius="92%" stroke="#0b2545" strokeWidth={3} onClick={r=>filter(r.name)}>{riskStructure.map(r=><Cell key={r.name} fill={riskColors[r.name]}/>)}</Pie><Tooltip contentStyle={chartTip} formatter={(value:number,name:string)=>[`${value} 家 · ${(value/totals.institutions*100).toFixed(1)}%`,name]}/></PieChart>:structure==='数量'?<BarChart data={riskStructure} margin={{top:15,left:-28,right:8,bottom:0}}><XAxis dataKey="name" axisLine={false} tickLine={false} tick={chartTick}/><YAxis axisLine={false} tickLine={false} tick={chartTick}/><Tooltip contentStyle={chartTip} formatter={(v:number)=>[`${v} 家 · ${(v/totals.institutions*100).toFixed(1)}%`,'机构数']}/><Bar isAnimationActive={false} dataKey="count" name="机构数" radius={[4,4,0,0]} maxBarSize={34} onClick={r=>filter(r.name)}>{riskStructure.map(r=><Cell key={r.name} fill={riskColors[r.name]}/>)}</Bar></BarChart>:<BarChart layout="vertical" data={settlement} margin={{left:-8,right:15,top:12,bottom:0}}><XAxis type="number" domain={[0,100]} tick={chartTick} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/><YAxis type="category" dataKey="name" width={40} tick={chartTick} tickLine={false} axisLine={false}/><Tooltip contentStyle={chartTip} formatter={(v:number,n:string,p:any)=>[`${v.toFixed(1)}% · ${Math.round(v/100*p.payload.total)} 家`,n]}/>{risks.map(r=><Bar isAnimationActive={false} key={r} dataKey={r} stackId="level" fill={riskColors[r]}/>)}</BarChart>}</ResponsiveContainer>{structure==='占比'&&<div className="history-donut-center"><strong>{totals.institutions}</strong><span>纳管机构</span></div>}</div>
 <div className="history-risk-legend">{riskStructure.map(r=><button key={r.name} onClick={()=>filter(r.name)}><i style={{background:riskColors[r.name]}}/><span>{r.name}</span><strong>{r.count} <small>家</small></strong><em>{r.percent.toFixed(1)}%</em></button>)}</div>
 </Panel>
 <Panel title="风险变化趋势" extra={<Segmented size="small" options={['月度','季度','年度']} value={trend} onChange={v=>{setTrend(v as Period);pause();}}/>}>
 <RiskTrend period={trend}/>
 </Panel>
 </div>
 <section className="history-panel history-core" onMouseEnter={()=>setHovering(true)} onMouseLeave={()=>{setHovering(false);pause();}} onFocusCapture={e=>setFocused((e.target as Element).matches(':focus-visible'))} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget)){setFocused(false);pause();}}} onClick={interaction} data-testid="core-view">
 <header><h2>{mode==='地图'?'医疗机构风险空间分布':'医疗机构列表'}</h2><Segmented size="small" options={['地图','机构列表']} value={mode} onChange={v=>{setMode(String(v));setSelected(null);pause();}}/></header>
 <div className="history-core-meta"><span><i/> {visible.length} 家机构 {riskFilter&&<b>· {riskFilter}</b>}</span><div><select aria-label="核心视图风险筛选" value={riskFilter} onChange={e=>filter(e.target.value)}><option value="">全部风险</option>{risks.map(r=><option key={r}>{r}</option>)}</select>{mode==='机构列表'&&<select aria-label="机构列表排序" value={sort} onChange={e=>{setSort(e.target.value);pause();}}><option>风险等级</option><option>最新检查风险值</option></select>}{riskFilter&&<button onClick={resetCore}>清除联动</button>}</div></div>
 <div className="history-core-body" onClick={e=>{if(!(e.target as Element).closest('button,.history-org-summary,.history-map-point'))setSelected(null);}}>
 {mode==='地图'?<div className="history-map" data-testid="pudong-map"><PudongMap3D riskFilter={riskFilter} zoom={zoom} selected={selected} hovered={hovered} onSelect={choose} onHover={setHovered} onInteract={pause}/>{hovered&&<div className="history-point-tooltip" role="tooltip"><strong>{hovered.name}</strong><span>{hovered.code}</span><span style={{color:riskColors[hovered.risk]}}>{hovered.risk}</span></div>}<div className="history-map-controls"><Button size="small" aria-label="放大地图" icon={<PlusOutlined/>} disabled={zoom>=1.8} onClick={()=>{setZoom(v=>Math.min(1.8,v+.2));pause();}}/><Button size="small" aria-label="缩小地图" icon={<MinusOutlined/>} disabled={zoom<=.8} onClick={()=>{setZoom(v=>Math.max(.8,v-.2));pause();}}/></div><div className="history-map-legend">{risks.map(r=><span key={r}><i style={{background:riskColors[r]}}/>{r}</span>)}<small>点位大小：违规金额</small></div></div>:<OrgList items={visible} onSelect={choose} pause={hovering||focused||!!selected} onInteract={pause}/>}
 {selected&&<aside className="history-org-summary" data-testid="org-summary" role="dialog" aria-label="机构摘要卡"><button className="history-summary-close" aria-label="关闭机构摘要" onClick={()=>{setSelected(null);pause();}}><CloseOutlined/></button><span className="history-summary-eyebrow">医疗机构监管摘要</span><h3>{selected.name}</h3><p>{selected.code}</p><div className="history-summary-tags"><span>{selected.level}结算</span><span style={{color:riskColors[selected.risk],background:`${riskColors[selected.risk]}15`}}>{selected.risk}</span></div><dl><div><dt>最新检查风险值</dt><dd>{selected.latest.toFixed(2)} <small>分</small></dd></div><div><dt>历次风险值均分</dt><dd>{selected.average.toFixed(2)} <small>分</small></dd></div><div><dt>违规费用总额</dt><dd>{money(selected.fee)} <small>元</small></dd></div><div><dt>历次检查 / 未办结</dt><dd>{selected.count} <small>次 / </small>{selected.pending} <small>次</small></dd></div></dl><div className="history-summary-dimensions"><span>主要风险维度</span><p>重复收费 · 超范围支付 · 门诊费用</p></div><Button type="primary" block onClick={()=>go(selected,'profile')}>查看机构画像</Button><Button block onClick={()=>go(selected,'checks')}>查看历次检查</Button></aside>}
 </div>
 </section>
 <div className="history-side-col history-right-col" onMouseEnter={()=>setOtherHover(true)} onMouseLeave={()=>{setOtherHover(false);pause();}}>
 <Panel title="检查监管进度"><div className="history-stage-grid">{stages.map((stage,i)=><div key={stage.name} className={i===3?'done':''}><span><i>{String(i+1).padStart(2,'0')}</i>{stage.name}</span><strong>{stage.count}<small>次</small><em>{stage.status}</em></strong><p>平均{stage.status==='已办结'?'办理':'停留'} {stage.avg.toFixed(1)} 天</p></div>)}</div><div className="history-progress-head"><span>已办 / 待办案件</span><Segmented size="small" options={['年度','季度','月度']} value={casePeriod} onChange={v=>{setCasePeriod(v as Period);pause();}}/></div><div className="history-progress-bar" aria-label={`${progressData.label}已办${progressData.done}次，待办${progressData.pending}次`}><Hint title={`已办：${progressData.done}次，${(progressData.ratio*100).toFixed(1)}%；${progressData.start}—${snapshot}；形成结果视为办结`}><span className="completed" style={{width:`${progressData.ratio*100}%`}}/></Hint><Hint title={`待办：${progressData.pending}次，${((1-progressData.ratio)*100).toFixed(1)}%；${progressData.start}—${snapshot}；其余三个阶段视为待办`}><span className="pending" style={{width:`${(1-progressData.ratio)*100}%`}}/></Hint></div><div className="history-progress-values"><span><i/>已办 {progressData.done} <small>({(progressData.ratio*100).toFixed(1)}%)</small></span><span><i/>待办 {progressData.pending} <small>({((1-progressData.ratio)*100).toFixed(1)}%)</small></span></div></Panel>
 <Panel title="机构风险排名 TOP10"><Ranking onSelect={choose} onInteract={pause}/></Panel>
 </div></div>
 <div className="history-bottom-grid" onMouseEnter={()=>setOtherHover(true)} onMouseLeave={()=>{setOtherHover(false);pause();}}>
 <Panel title="主要违规行为"><div className="history-behavior-body"><div className="history-behavior-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie isAnimationActive={false} data={behaviorTotals} dataKey="amount" nameKey="name" innerRadius="78%" outerRadius="96%" stroke="#0b2545" strokeWidth={2}>{behaviorTotals.map((b,i)=><Cell key={b.name} fill={['#16d6ed','#299aff','#ffb951','#10d6a8','#7b91ff','#ae80ff','#36a5b5','#536d94'][i]}/>)}</Pie><Tooltip contentStyle={chartTip} formatter={(v:number,name:string,p:any)=>[`${money(v)}元 · ${p.payload.percent}% · ${p.payload.orgCount}家机构 / ${p.payload.checkCount}次检查`,name]}/></PieChart></ResponsiveContainer><div className="history-donut-center"><strong>{(totals.fee/10000).toFixed(2)}</strong><span>万元 · 违规总额</span></div></div><div className="history-behavior-legend">{behaviorTotals.map((b,i)=><div key={b.name} title={`${b.name}：${money(b.amount)}元，占${b.percent}%，${b.orgCount}家机构，${b.checkCount}次检查`}><i style={{background:['#16d6ed','#299aff','#ffb951','#10d6a8','#7b91ff','#ae80ff','#36a5b5','#536d94'][i]}}/><span>{b.name}</span><strong>{b.percent}%</strong></div>)}</div></div></Panel>
 <Panel title="主要违规项目" extra={<Segmented size="small" options={['总额','次均']} value={projectMode} onChange={v=>{setProjectMode(String(v));pause();}}/>}><div className="history-project-chart"><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={projectData} margin={{top:3,left:0,right:52,bottom:0}}><XAxis type="number" tick={chartTick} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/10000).toFixed(0)}万`}/><YAxis dataKey="name" type="category" width={152} tick={{...chartTick,fontSize:10}} tickLine={false} axisLine={false} tickFormatter={v=>v.length>14?v.slice(0,14)+'…':v}/><Tooltip contentStyle={chartTip} formatter={(v:number,_n:string,p:any)=>[`${money(v)}元`,`${p.payload.name} · ${p.payload.code}`]}/><Bar isAnimationActive={false} dataKey={projectMode==='总额'?'amount':'average'} name={projectMode==='总额'?'违规金额':'次均违规金额'} fill="#16c8e4" radius={[0,3,3,0]} maxBarSize={14} label={{position:'right',fill:'#a5e8fa',fontSize:11,formatter:(v:number)=>`${(v/10000).toFixed(1)}万`}}/></BarChart></ResponsiveContainer></div></Panel>
 <Panel title="智能总结" className="history-summary-panel" extra={<Button size="small" type="text" icon={<ReloadOutlined/>} title={`上次生成：${summaryTime}`} onClick={regenerate}>重新生成</Button>}><ol>{conclusions.map((text,i)=><li key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{text}</p></li>)}</ol></Panel>
 </div>
 </div>;
}
