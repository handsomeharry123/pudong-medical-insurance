import ProfilePageHeader from './ProfilePageHeader';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AutoComplete, Button, Empty, Pagination, Select, Tooltip } from 'antd';
import { BankOutlined, ArrowUpOutlined, SearchOutlined } from '@ant-design/icons';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import './profiles.css';

import { PROFILE_PATH, profileInstitutions as rows } from './profileData';
const risks=[{name:'高风险',value:12,change:'↑ 2家',color:'#ff4d4f',percent:9.7},{name:'中风险',value:28,change:'↓ 3家',color:'#f5b400',percent:22.6},{name:'低风险',value:84,change:'↑ 1家',color:'#10b981',percent:67.7}];
const trend=[{month:'6月',高风险:9,中风险:32,低风险:82},{month:'7月',高风险:10,中风险:31,低风险:83},{month:'8月',高风险:10,中风险:30,低风险:84},{month:'9月',高风险:11,中风险:30,低风险:83},{month:'10月',高风险:10,中风险:31,低风险:83},{month:'11月',高风险:12,中风险:28,低风险:84}];
const initial={name:'',code:'',risk:'',level:''};
function SectionTitle({number,title,extra}:{number:string;title:string;extra?:React.ReactNode}){return <header className="profile-section-heading"><h2><span>{number}</span>{title}</h2>{extra}</header>}
export default function InstitutionProfiles(){
 const [draft,setDraft]=useState(initial),[query,setQuery]=useState(initial),[page,setPage]=useState(1),[showTrend,setShowTrend]=useState(false);
 const filtered=rows.filter(row=>row.name.includes(query.name.trim())&&row.code.toLowerCase().includes(query.code.trim().toLowerCase())&&(!query.risk||row.risk===query.risk)&&(!query.level||String(row.level)===query.level));
 const update=(key:keyof typeof initial,value:string)=>setDraft(prev=>({...prev,[key]:value}));
 return <div className="profiles-page">
  <ProfilePageHeader parents={[{title:'医保数据分析',to:'/app/modules/analysis'}]} title="医疗机构监管履历画像" meta={<span className="profile-update"><i/>数据更新至 2026年11月</span>}/>
  <div className="profiles-body">
   <section className="profile-section profile-overview"><SectionTitle number="01" title="浦东新区医疗机构监管履历总体情况"/>
    <div className="profile-summary">{risks.map(r=><article className="profile-risk-card" key={r.name} style={{'--risk-color':r.color} as React.CSSProperties}><h3><i/>{r.name}机构</h3><div className="profile-risk-value">{r.value}<small>家</small></div><p>较上月 <strong>{r.change}</strong><span className="profile-risk-share">占比 {r.percent}%</span></p><div className="profile-risk-meter"><i style={{width:`${r.percent}%`,background:r.color}}/></div></article>)}
     <article className="profile-distribution"><div><strong>124</strong><span>家机构纳入监管评级</span><Tooltip title={showTrend?'收起风险趋势':'展开风险趋势'}><Button type="text" icon={<ArrowUpOutlined rotate={45}/>} onClick={()=>setShowTrend(v=>!v)} aria-label={showTrend?'收起风险趋势':'展开风险趋势'} aria-expanded={showTrend}/></Tooltip></div><div className="profile-risk-bar" aria-label="高风险9.7%，中风险22.6%，低风险67.7%">{risks.map(r=><span key={r.name} style={{width:`${r.percent}%`,background:r.color}}/>)}</div><div className="profile-risk-legend">{risks.map(r=><span key={r.name}><i style={{background:r.color}}/>{r.name} {r.percent}%</span>)}</div></article>
    </div>
    {showTrend&&<div className="profile-trend"><div className="profile-trend-heading"><div><h3>机构风险等级趋势</h3><p>近6个月 · 各风险等级机构数量（家）</p></div><span>6月 — 11月</span></div><ResponsiveContainer width="100%" height={280}><LineChart data={trend} margin={{left:0,right:20,top:10,bottom:5}}><CartesianGrid vertical={false} stroke="#edf1f7" strokeDasharray="4 4"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#95a3b8",fontSize:12}} dy={8}/><YAxis domain={[0,100]} ticks={[0,25,50,75,100]} axisLine={false} tickLine={false} tick={{fill:"#95a3b8",fontSize:12}} width={40}/><ChartTooltip contentStyle={{border:"1px solid #e7edf6",borderRadius:10,boxShadow:"0 6px 24px #20385810"}} formatter={(value:number)=>[`${value} 家`]} cursor={{stroke:"#dce5f2",strokeDasharray:"4 4"}}/><Legend iconType="circle" iconSize={8} wrapperStyle={{paddingTop:22,fontSize:12}}/>{risks.map(r=><Line key={r.name} type="monotone" dataKey={r.name} stroke={r.color} strokeWidth={2.5} dot={false} activeDot={{r:5,stroke:"#fff",strokeWidth:2}}/>)}</LineChart></ResponsiveContainer></div>}
   </section>
   <section className="profile-section profile-list-section"><SectionTitle number="02" title="医疗机构监管履历列表" extra={<span className="profile-count">共 <strong>{filtered.length}</strong> 家机构</span>}/>
    <form className="profile-filters" onSubmit={e=>{e.preventDefault();setQuery({...draft});setPage(1)}}>
     <label>机构名称<AutoComplete aria-label="机构名称" value={draft.name} onChange={v=>update('name',v)} options={rows.map(r=>({value:r.name}))} filterOption={(input,option)=>String(option?.value).includes(input)} placeholder="输入或选择机构名称" allowClear/></label>
     <label>机构代码<AutoComplete aria-label="机构代码" value={draft.code} onChange={v=>update('code',v)} options={rows.map(r=>({value:r.code}))} filterOption={(input,option)=>String(option?.value).toLowerCase().includes(input.toLowerCase())} placeholder="输入或选择机构代码" allowClear/></label>
     <label>风险等级<Select aria-label="风险等级" value={draft.risk} onChange={v=>update('risk',v)} options={[{value:'',label:'全部风险等级'},...risks.map(r=>({value:r.name,label:r.name}))]}/></label>
     <label>结算等级<Select aria-label="结算等级" value={draft.level} onChange={v=>update('level',v)} options={[{value:'',label:'全部结算等级'},...[1,2,3].map(n=>({value:String(n),label:`${n}级`}))]}/></label>
     <div className="profile-filter-actions"><Button aria-label="重置" onClick={()=>{setDraft(initial);setQuery(initial);setPage(1)}}>重置</Button><Button aria-label="查询" type="primary" htmlType="submit" icon={<SearchOutlined/>}>查询</Button></div>
    </form>
    <div className="profile-table-wrap"><table className="profile-table"><thead><tr>{['机构名称','机构代码','风险等级','结算等级','详情'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{filtered.slice((page-1)*8,page*8).map(row=><tr key={row.code}><td><span className="profile-hospital-icon"><BankOutlined/></span><strong>{row.name}</strong></td><td>{row.code}</td><td><span className={`profile-risk-tag risk-${row.risk}`}><i/>{row.risk}</span></td><td><b className="profile-level">{row.level} 级</b></td><td><Link className="profile-detail-link" to={`${PROFILE_PATH}/${row.code}`}>查看详情</Link></td></tr>)}</tbody></table>{!filtered.length&&<Empty description="暂无符合条件的机构，请调整筛选条件" image={Empty.PRESENTED_IMAGE_SIMPLE}/>}</div>
    <footer className="profile-list-footer"><div><span>{page} / {Math.max(1,Math.ceil(filtered.length/8))} 页</span><Pagination simple hideOnSinglePage current={page} pageSize={8} total={filtered.length} onChange={setPage}/></div></footer>
   </section>
  </div>

 </div>;
}
