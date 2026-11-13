import ProfilePageHeader from './ProfilePageHeader';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AutoComplete, Button, Empty, Pagination, Segmented, Select, Tooltip } from 'antd';
import { BankOutlined, ArrowUpOutlined, BarChartOutlined, SearchOutlined } from '@ant-design/icons';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import './profiles.css';

import { PROFILE_PATH, profileInstitutions as rows } from './profileData';
const risks=[{name:'高风险',value:12,change:'↑ 2家',color:'#ff4d4f',percent:9.7},{name:'中风险',value:28,change:'↓ 3家',color:'#f5b400',percent:22.6},{name:'低风险',value:84,change:'↑ 1家',color:'#10b981',percent:67.7}];
type SortKey = '结算等级' | '机构排名' | '机构风险等级';
type Grain = '月度' | '季度' | '年度';
// Demonstration monthly snapshots; each snapshot totals 124 institutions.
const trendEnd = new Date();
const endYear = trendEnd.getFullYear(), endMonth = trendEnd.getMonth();
const monthlyTrend = Array.from({length:(endYear-2022)*12+endMonth+1},(_,i)=>{
 const year=2022+Math.floor(i/12), month=i%12+1;
 const high=Math.round(22+12*Math.sin(i*.38)+7*Math.cos(i*.81));
 const medium=Math.round(36+10*Math.sin(i*.29+1.8)-5*Math.cos(i*.63));
 const latest=i===(endYear-2022)*12+endMonth;
 const previous=i===(endYear-2022)*12+endMonth-1;
 const h=latest?12:previous?10:high,m=latest?28:previous?31:medium;
 return {month:`${year}-${String(month).padStart(2,'0')}`,year,quarter:Math.ceil(month/3),高风险:h,中风险:m,低风险:124-h-m};
});
function trendFor(grain:Grain){
 const groups=new Map<string,typeof monthlyTrend[number]>();
 monthlyTrend.forEach(row=>{const key=grain==='年度'?`${row.year}年`:grain==='季度'?`${row.year} Q${row.quarter}`:row.month;groups.set(key,{...row,month:key});});
 return [...groups.values()];
}
const initial={name:'',code:'',risk:'',level:''};

export default function InstitutionProfiles(){
 const [sort,setSort]=useState<{key:SortKey;direction:1|-1}>({key:'机构排名',direction:1});
 const toggleSort=(key:SortKey)=>{setSort(prev=>({key,direction:prev.key===key&&prev.direction===1?-1:1}));setPage(1);};
 const [grain,setGrain]=useState<Grain>('月度');
 const trend=trendFor(grain);
 const [draft,setDraft]=useState(initial),[query,setQuery]=useState(initial),[page,setPage]=useState(1),[showTrend,setShowTrend]=useState(false);
 useEffect(()=>{const publish=()=>window.dispatchEvent(new CustomEvent('profile-list-context',{detail:query}));const handle=(event:Event)=>{const risk=(event as CustomEvent).detail?.risk;if(!['高风险','中风险','低风险'].includes(risk))return;setDraft({...query,risk});setQuery({...query,risk});setPage(1);};window.addEventListener('profile-assistant-filter',handle);window.addEventListener('profile-list-context-request',publish);publish();return()=>{window.removeEventListener('profile-assistant-filter',handle);window.removeEventListener('profile-list-context-request',publish);};},[query]);
 const filtered=rows.filter(row=>row.name.includes(query.name.trim())&&row.code.toLowerCase().includes(query.code.trim().toLowerCase())&&(!query.risk||row.risk===query.risk)&&(!query.level||String(row.level)===query.level));
 const riskOrder:Record<string,number>={'低风险':1,'中风险':2,'高风险':3};
 const sorted=[...filtered].sort((a,b)=>{
 const delta=sort.key==='结算等级'?a.level-b.level:sort.key==='机构风险等级'?riskOrder[a.risk]-riskOrder[b.risk]:a.rank-b.rank;
 return delta*sort.direction||a.rank-b.rank;
 });
 const update=(key:keyof typeof initial,value:string)=>setDraft(prev=>({...prev,[key]:value}));
 return <div className="profiles-page">
  <ProfilePageHeader parents={[{title:'医保数据分析',to:'/app/modules/analysis'}]} title="医疗机构监管履历画像" meta={<Button type="primary" icon={<BarChartOutlined/>} href="/app/home/dashboard">数据大屏</Button>}/>
  <div className="profiles-body">
   <section className="profile-section profile-overview">
    <div className="profile-summary">{risks.map(r=><article className="profile-risk-card" key={r.name} style={{'--risk-color':r.color} as React.CSSProperties}><h3><i/>{r.name}机构</h3><div className="profile-risk-value">{r.value}<small>家</small></div><p>较上月 <strong>{r.change}</strong><span className="profile-risk-share">占比 {r.percent}%</span></p><div className="profile-risk-meter"><i style={{width:`${r.percent}%`,background:r.color}}/></div></article>)}
     <article className="profile-distribution"><div><strong>124</strong><span>家机构纳入监管评级</span><Tooltip title={showTrend?'收起风险趋势':'展开风险趋势'}><Button type="text" icon={<ArrowUpOutlined rotate={45}/>} onClick={()=>setShowTrend(v=>!v)} aria-label={showTrend?'收起风险趋势':'展开风险趋势'} aria-expanded={showTrend}/></Tooltip></div><div className="profile-risk-bar" aria-label="高风险9.7%，中风险22.6%，低风险67.7%">{risks.map(r=><span key={r.name} style={{width:`${r.percent}%`,background:r.color}}/>)}</div><div className="profile-risk-legend">{risks.map(r=><span key={r.name}><i style={{background:r.color}}/>{r.name} {r.percent}%</span>)}</div></article>
    </div>
    {showTrend&&<div className="profile-trend"><div className="profile-trend-heading"><div><h3>机构风险等级趋势</h3></div><div className="profile-trend-controls"><span>2022.01 — {endYear}.{String(endMonth+1).padStart(2,'0')}</span><Segmented aria-label="趋势展示颗粒度" value={grain} options={['月度','季度','年度']} onChange={value=>setGrain(value as Grain)}/></div></div><ResponsiveContainer width="100%" height={320}><LineChart data={trend} margin={{left:0,right:20,top:10,bottom:5}}><CartesianGrid vertical={false} stroke="#edf1f7" strokeDasharray="4 4"/><XAxis dataKey="month" minTickGap={40} axisLine={false} tickLine={false} tick={{fill:"#95a3b8",fontSize:12}} dy={8}/><YAxis domain={[0,124]} ticks={[0,31,62,93,124]} allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:"#95a3b8",fontSize:12}} width={40}/><ChartTooltip contentStyle={{border:"1px solid #e7edf6",borderRadius:10,boxShadow:"0 6px 24px #20385810"}} formatter={(value:number,name:string)=>[`${value}家`,name]} separator="：" cursor={{stroke:"#dce5f2",strokeDasharray:"4 4"}}/><Legend iconType="circle" iconSize={8} wrapperStyle={{paddingTop:22,fontSize:12}}/>{risks.map(r=><Line key={r.name} type="linear" dataKey={r.name} stroke={r.color} strokeWidth={2.5} dot={grain==='年度'?{r:4}:false} isAnimationActive={false} activeDot={{r:5,stroke:"#fff",strokeWidth:2}}/>)}</LineChart></ResponsiveContainer></div>}
   </section>
   <section className="profile-section profile-list-section">
    <form className="profile-filters" onSubmit={e=>{e.preventDefault();setQuery({...draft});setPage(1)}}>
     <label>机构名称<AutoComplete aria-label="机构名称" value={draft.name} onChange={v=>update('name',v)} options={rows.map(r=>({value:r.name}))} filterOption={(input,option)=>String(option?.value).includes(input)} placeholder="输入或选择机构名称" allowClear/></label>
     <label>机构代码<AutoComplete aria-label="机构代码" value={draft.code} onChange={v=>update('code',v)} options={rows.map(r=>({value:r.code}))} filterOption={(input,option)=>String(option?.value).toLowerCase().includes(input.toLowerCase())} placeholder="输入或选择机构代码" allowClear/></label>
     <label>风险等级<Select aria-label="风险等级" value={draft.risk} onChange={v=>update('risk',v)} options={[{value:'',label:'全部风险等级'},...risks.map(r=>({value:r.name,label:r.name}))]}/></label>
     <label>结算等级<Select aria-label="结算等级" value={draft.level} onChange={v=>update('level',v)} options={[{value:'',label:'全部结算等级'},...[1,2,3].map(n=>({value:String(n),label:`${n}级`}))]}/></label>
     <div className="profile-filter-actions"><Button aria-label="重置" onClick={()=>{setDraft(initial);setQuery(initial);setPage(1)}}>重置</Button><Button aria-label="查询" type="primary" htmlType="submit" icon={<SearchOutlined/>}>查询</Button></div>
    </form>
    <div className="profile-table-wrap"><table className="profile-table"><thead><tr>{['机构名称','机构代码','结算等级','机构综合风险值','机构排名','机构风险等级','详情'].map(h=>{const sortable=['结算等级','机构排名','机构风险等级'].includes(h);return <th key={h} aria-sort={sortable?(sort.key===h?(sort.direction===1?'ascending':'descending'):'none'):undefined}>{sortable?<button type="button" className={`profile-sort${sort.key===h?' is-active':''}`} onClick={()=>toggleSort(h as SortKey)} aria-label={`${h}，点击${sort.key===h&&sort.direction===1?'降序':'升序'}排列`}>{h}<span aria-hidden="true">{sort.key===h?(sort.direction===1?'↑':'↓'):'↕'}</span></button>:h}</th>;})}</tr></thead><tbody>{sorted.slice((page-1)*10,page*10).map(row=><tr key={row.code}><td><span className="profile-hospital-icon"><BankOutlined/></span><strong>{row.name}</strong></td><td>{row.code}</td><td><b className="profile-level">{row.level} 级</b></td><td className="profile-score">{row.score.toFixed(2)}</td><td><span className={`profile-rank${row.rank<=3?' profile-rank-top':''}`}>{row.rank}</span></td><td><span className={`profile-risk-tag risk-${row.risk}`}><i/>{row.risk}</span></td><td><Link className="profile-detail-link" to={`${PROFILE_PATH}/${row.code}`}>查看详情</Link></td></tr>)}</tbody></table>{!filtered.length&&<Empty description="暂无符合条件的机构，请调整筛选条件" image={Empty.PRESENTED_IMAGE_SIMPLE}/>}</div>
    <footer className="profile-list-footer"><div><span>{page} / {Math.max(1,Math.ceil(filtered.length/10))} 页</span><Pagination simple hideOnSinglePage current={page} pageSize={10} total={filtered.length} onChange={setPage}/></div></footer>
   </section>
  </div>

 </div>;
}
