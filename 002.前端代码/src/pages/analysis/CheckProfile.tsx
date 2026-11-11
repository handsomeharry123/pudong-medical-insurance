import ProfilePageHeader from './ProfilePageHeader';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Descriptions, Empty, Input, Modal, Segmented, Select, Tooltip } from 'antd';
import { DownloadOutlined, FileSearchOutlined } from '@ant-design/icons';
import { formatMoney, getProfileChecks, PROFILE_PATH, profileInstitutions, profileVisits } from './profileData';
import { checkBehaviors, checkColors, defaultCheckFilters, filterCheckItems, getCheckItems, groupCheckItems, insurances, sumCheckItems, type CheckFilters, type CheckItem } from './checkData';
import './profiles.css';
import './detail.css';
import './check.css';

function Section({title,extra,children}:{title:string;extra?:ReactNode;children:ReactNode}){return <section className="institution-section check-section"><header className="institution-section-title"><h2>{title}</h2>{extra}</header>{children}</section>}
const percent=(value:number,total:number)=>total?`${(value/total*100).toFixed(1)}%`:'0.0%';
const options=(values:string[],all?:string)=>[...(all?[{value:'',label:all}]:[]),...values.map(value=>({value,label:value}))];
export default function CheckProfile(){
 const {code='',batch=''}=useParams();
 const institution=profileInstitutions.find(r=>r.code===code),check=getProfileChecks(code).find(c=>c.batch===batch);
 const all=useMemo(()=>getCheckItems(code,batch),[code,batch]);
 const [filters,setFilters]=useState<CheckFilters>({...defaultCheckFilters}),[feeMode,setFeeMode]=useState('金额'),[matrixMode,setMatrixMode]=useState('完整矩阵'),[topN,setTopN]=useState('前5'),[insuranceMode,setInsuranceMode]=useState('金额'),[sort,setSort]=useState('desc'),[page,setPage]=useState(1),[selected,setSelected]=useState<CheckItem|null>(null),[resource,setResource]=useState<string|null>(null);
 const detailRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{window.scrollTo(0,0);setFilters({...defaultCheckFilters});setPage(1);setSort('desc');setSelected(null);setResource(null);setFeeMode('金额');setMatrixMode('完整矩阵');setTopN('前5');setInsuranceMode('金额');},[code,batch]);
 function update(patch:Partial<CheckFilters>){setFilters(prev=>({...prev,...patch}));setPage(1);}
 const rows=useMemo(()=>filterCheckItems(all,filters),[all,filters]);
 const total=sumCheckItems(rows),fullTotal=sumCheckItems(all),projectCount=new Set(rows.map(r=>r.code)).size;
 const sorted=useMemo(()=>rows.slice().sort((a,b)=>sort==='desc'?b.amount-a.amount:a.amount-b.amount),[rows,sort]);
 const behaviors=checkBehaviors.map((name,i)=>({name,color:checkColors[i],amount:sumCheckItems(rows.filter(r=>r.behavior===name))}));
 const rankedBehaviors=behaviors.filter(b=>b.amount>0).sort((a,b)=>b.amount-a.amount);
 const projects=groupCheckItems(rows,'code').map(p=>({...p,code:p.name,name:rows.find(r=>r.code===p.name)!.name,behavior:rows.find(r=>r.code===p.name)!.behavior})).sort((a,b)=>b.amount-a.amount);
 const topProjects=projects.slice(0,Number(topN.slice(1))),topTotal=topProjects.reduce((n,p)=>n+p.amount,0);
 const visibleBehaviors=matrixMode==='完整矩阵'?checkBehaviors:checkBehaviors.filter(b=>rows.some(r=>r.behavior===b&&r.amount>0));
 const visibleVisits=matrixMode==='完整矩阵'?profileVisits:profileVisits.filter(v=>rows.some(r=>r.visit===v&&r.amount>0));
 const matrixMax=Math.max(1,...checkBehaviors.flatMap(b=>profileVisits.map(v=>sumCheckItems(rows.filter(r=>r.behavior===b&&r.visit===v)))));
 const insuranceTotals=insurances.map(name=>({name,amount:sumCheckItems(rows.filter(r=>r.insurance===name))}));
 const localTotal=sumCheckItems(all.filter(r=>r.region==='本地')),foreignTotal=fullTotal-localTotal;
 const risk=check?.score||0,contributions=checkBehaviors.map((name,i)=>({name,color:checkColors[i],value:fullTotal?sumCheckItems(all.filter(r=>r.behavior===name))/fullTotal*risk:0})).sort((a,b)=>b.value-a.value).slice(0,4);
 const selectedProject=filters.project?all.find(r=>r.code===filters.project):null;
 function drill(project:string){update({project});detailRef.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 function exportRows(){const header=['数据范围','医保项目编码','项目名称','险种','就医类型','检查方式','医院单价','违规数量','违规费用','行为认定'];const csv='\ufeff'+[header,...sorted.map(r=>[r.region,r.code,r.name,r.insurance,r.visit,r.method,r.price.toFixed(2),r.quantity,r.amount.toFixed(2),r.behavior])].map(line=>line.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`${batch}-筛选明细.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function shortcut(name:string){if(name==='费用明细'){detailRef.current?.scrollIntoView({behavior:'smooth',block:'start'});return;}setResource(name);}
 if(!institution||!check)return <div className="profiles-page"><div className="profiles-body"><section className="institution-section"><Empty description="未找到对应的机构或检查记录"/><Link to={institution?`${PROFILE_PATH}/${code}`:PROFILE_PATH}>返回机构画像</Link></section></div></div>;
 const concentration=rankedBehaviors.slice(0,2).reduce((n,b)=>n+b.amount,0);
 const advice=[['风险集中',total?`${rankedBehaviors.slice(0,2).map(b=>b.name).join('与')}合计占比${percent(concentration,total)}，建议优先核查对应高费用项目和结算记录。`:'当前筛选条件下暂无费用记录，可调整筛选条件后开展核查。','orange'],['本地 / 异地',`当前查看${filters.region}数据，${filters.region==='综合'?'已合并本地及异地记录，可进一步按险种、行为认定核验。':filters.region==='本地'?'异地数据未计入本视图；可切换至“综合”进行对照。':'本地数据未计入本视图；可切换至“综合”进行对照。'}`,'red'],['重点项目',projects.length?`重点穿透核验${projects.slice(0,3).map(p=>p.name).join('、')}等高费用项目，并查看险种与就医类型分布。`:'当前暂无命中项目，请调整筛选条件。','blue'],['办理建议',check.stage==='已办结'?'本次检查已办结，建议归档处理结论并纳入机构后续风险趋势分析。':`本次检查处于${check.stage}，建议持续跟踪整改材料、费用追回及复核结论。`,'green']];
 let cumulative=0;
 return <div className="profiles-page institution-detail check-profile">
  <ProfilePageHeader parents={[{title:'医疗机构监管履历画像',to:PROFILE_PATH},{title:institution.name,to:`${PROFILE_PATH}/${code}`}]} title={batch}/>
  <div className="profiles-body">
   <section className="institution-section check-global-filters" aria-label="检查全局筛选">
    <div className="check-filter-grid">
     <label>数据范围<Select aria-label="数据范围" value={filters.region} options={options(['本地','异地','综合'])} onChange={region=>update({region})}/></label>
     <label>险种<Select aria-label="险种" value={filters.insurance} options={options(insurances,'全部险种')} onChange={insurance=>update({insurance})}/></label>
     <label>就医类型<Select aria-label="就医类型" value={filters.visit} options={options(profileVisits,'全部就医类型')} onChange={visit=>update({visit})}/></label>
     <label>行为认定<Select mode="multiple" maxTagCount="responsive" aria-label="行为认定" placeholder="全部行为认定" value={filters.behaviors} options={options(checkBehaviors)} onChange={behaviors=>update({behaviors})}/></label>
     <label>检查方式<Select aria-label="检查方式" value={filters.method} options={options(['自主筛查','现场检查'],'全部检查方式')} onChange={method=>update({method})}/></label>
     <label>项目名称/编码<Input aria-label="项目名称或编码" value={selectedProject?.name ?? filters.keyword} placeholder="输入项目名称或编码" allowClear onChange={e=>update({keyword:e.target.value,project:''})}/></label>
     <Button aria-label="重置全局筛选" onClick={()=>{setFilters({...defaultCheckFilters});setPage(1)}}>重置</Button>
    </div>
    <div className="check-filter-summary"><strong data-testid="check-filter-summary">{rows.length}条明细 · {projectCount}个项目 · {formatMoney(total)}元</strong></div>
   </section>
   <Section title="本次检查总体情况">
    <div className="check-core-stats">{[['合规得分',(100-risk).toFixed(2),'分','blue'],['风险指数',risk.toFixed(2),'','orange'],['风险等级',check.risk,'',check.risk==='低风险'?'green':'orange'],['违规费用',formatMoney(fullTotal),'元','blue']].map(([title,value,unit,color])=><article key={title}><span>{title}{unit&&`（${unit}）`}</span><strong className={color} data-testid={`check-core-${title}`}>{value}</strong></article>)}</div>
    <div className="check-overview-grid"><article className="check-overview-panel"><h3>本地 / 异地费用构成</h3><div className="check-region-bar"><span style={{width:percent(localTotal,fullTotal)}}/><span style={{width:percent(foreignTotal,fullTotal)}}/></div><div className="check-region-legend">{[['本地',localTotal],['异地',foreignTotal]].map(([name,amount],i)=><div key={name}><span><i style={{background:i?'#f08c29':'#0156ff'}}/>{name}费用</span><strong>{formatMoney(Number(amount))}元 · {percent(Number(amount),fullTotal)}</strong><p>风险贡献 {fullTotal?(Number(amount)/fullTotal*risk).toFixed(1):'0.0'} 分</p></div>)}</div></article>
     <article className="check-overview-panel"><div className="check-panel-heading"><h3>行为风险贡献</h3></div><div className="check-contribution">{contributions.map(c=><div key={c.name}><span>{c.name}</span><div><i style={{width:percent(c.value,contributions[0].value||1)}}/></div><strong>{c.value.toFixed(1)} 分</strong></div>)}</div></article></div>
   </Section>
   <div className="check-two-column">
    <Section title="主要违规费用结构" extra={<div className="institution-controls"><span>{filters.region}</span><Segmented aria-label="费用结构维度" options={['金额','占比']} value={feeMode} onChange={v=>setFeeMode(String(v))}/></div>}>
     <p className="institution-fee-total">违规费用合计 <strong>{formatMoney(total)}</strong> 元</p>
     {rankedBehaviors.length?<><div className="check-behavior-bars">{rankedBehaviors.slice(0,4).map(b=><div key={b.name}><span>{b.name}</span><div><i style={{width:percent(b.amount,feeMode==='占比'?total:rankedBehaviors[0].amount)}}/></div><strong>{feeMode==='金额'?`${formatMoney(b.amount)}元`:percent(b.amount,total)}</strong></div>)}</div><div className="check-top-cards">{rankedBehaviors.slice(0,4).map(b=><article key={b.name}><h3>{b.name}<small>费用前三项目</small></h3>{projects.filter(p=>p.behavior===b.name).slice(0,3).map(p=><button key={p.code} onClick={()=>drill(p.code)}><span>{p.name}</span><strong>{formatMoney(p.amount)}元</strong></button>)}</article>)}</div></>:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的费用数据"/>}
    </Section>
    <Section title="行为认定×就医类型热力矩阵" extra={<div className="institution-controls"><span>单位：元</span><Segmented aria-label="矩阵显示模式" options={['完整矩阵','仅有数据']} value={matrixMode} onChange={v=>setMatrixMode(String(v))}/></div>}>
     {visibleBehaviors.length&&visibleVisits.length?<div className="institution-matrix-wrap"><table className="institution-matrix check-matrix"><thead><tr><th>行为认定</th>{visibleVisits.map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{visibleBehaviors.map(b=><tr key={b}><th>{b}</th>{visibleVisits.map(v=>{const amount=sumCheckItems(rows.filter(r=>r.behavior===b&&r.visit===v)),ratio=amount/matrixMax;return <td key={v} style={{background:!amount?'#f7f9fd':ratio>.5?'#d9531e':ratio>.04?'#f9c58d':ratio>.002?'#fce6cc':'#fff4e7',color:ratio>.5?'white':undefined}}>{amount?<Tooltip title={`${b} / ${v}：${formatMoney(amount)}元，点击筛选`}><button aria-label={`筛选${b}${v}`} onClick={()=>update({behaviors:[b],visit:v,project:''})}>{Math.round(amount).toLocaleString('zh-CN')}</button></Tooltip>:<span>0</span>}</td>})}</tr>)}</tbody></table></div>:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无有数据的行为与就医类型"/>}
     <p className="institution-note">颜色越深，违规费用越高。点击金额筛选明细。</p>
    </Section>
   </div>
   <div className="check-two-column check-ranking-grid">
    <Section title="重点违规项目及费用集中度" extra={<div className="institution-controls"><Segmented aria-label="重点项目数量" options={['前5','前10','前20']} value={topN} onChange={v=>setTopN(String(v))}/></div>}>
     <div className="check-ranking-note"><span>前{topProjects.length}个项目覆盖违规费用{percent(topTotal,total)}</span></div>
     {topProjects.length?<div className="check-pareto-wrap"><svg viewBox={`0 0 720 ${topProjects.length*46+65}`} role="img" aria-label="重点项目费用与累计占比图"><text x="202" y="18" fill="#8b9cb4" fontSize="11">费用：蓝色条形 · 累计占比：橙色折线</text>{[0,25,50,75,100].map(n=><g key={n}><text x={210+n*3.5} y="38" textAnchor="middle" fontSize="10" fill="#91a1b9">{n}%</text><line x1={210+n*3.5} x2={210+n*3.5} y1="43" y2={topProjects.length*46+45} stroke="#edf1f8"/></g>)}
      <polyline points={topProjects.map((p,i)=>{cumulative+=p.amount;return `${210+(total?cumulative/total:0)*350},${64+i*46}`}).join(' ')} fill="none" stroke="#eb8b36" strokeWidth="2"/>
      {topProjects.map((p,i)=>{const running=topProjects.slice(0,i+1).reduce((n,r)=>n+r.amount,0),x=210+running/(total||1)*350,y=64+i*46;return <g key={p.code} role="button" tabIndex={0} aria-label={`穿透项目${p.name}`} className="check-pareto-item" onClick={()=>drill(p.code)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();drill(p.code)}}}><title>{p.name}：{formatMoney(p.amount)}元；累计{percent(running,total)}</title><text x="0" y={y+4} fontSize="11" fill="#536b8e">{i+1}. {p.name.length>17?`${p.name.slice(0,16)}…`:p.name}</text><rect x="210" y={y-9} width={p.amount/topProjects[0].amount*350} height="18" fill="#528bf6" rx="4"/><text x="575" y={y+4} fontSize="11" fill="#617b9f">{formatMoney(p.amount)}元</text><circle cx={x} cy={y} r="4" stroke="#eb8b36" strokeWidth="2" fill="white"/><text x={x} y={y-14} textAnchor="middle" fontSize="10" fill="#d87b2c">{Math.round(running/(total||1)*100)}%</text></g>})}</svg></div>:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无命中项目"/>}
    </Section>
    <Section title="险种×行为认定费用结构" extra={<div className="institution-controls"><Segmented aria-label="险种费用维度" options={['金额','占比']} value={insuranceMode} onChange={v=>setInsuranceMode(String(v))}/></div>}>
     <div className="check-insurance-legend">{behaviors.map(b=><span key={b.name}><i style={{background:b.color}}/>{b.name}</span>)}</div>
     <div className="check-insurance-bars">{insuranceTotals.map(t=><div className="check-insurance-row" key={t.name}><button className="check-insurance-name" onClick={()=>update({insurance:t.name,project:''})}>{t.name}</button><div className="check-stack">{behaviors.map(b=>{const amount=sumCheckItems(rows.filter(r=>r.insurance===t.name&&r.behavior===b.name));return amount>0?<Tooltip key={b.name} title={`${t.name} / ${b.name}：${formatMoney(amount)}元 · ${percent(amount,t.amount)}`}><button aria-label={`筛选${t.name}${b.name}`} style={{width:percent(amount,insuranceMode==='占比'?t.amount:Math.max(...insuranceTotals.map(t=>t.amount),1)),background:b.color}} onClick={()=>update({insurance:t.name,behaviors:[b.name],project:''})}/></Tooltip>:null})}</div><strong>{formatMoney(t.amount)}元</strong></div>)}</div>
    </Section>
   </div>
   <div ref={detailRef} className="institution-scroll-target"><Section title="违规项目明细" extra={<div className="institution-controls check-detail-tools"><span>共 {rows.length} 条</span><Select aria-label="明细排序" value={sort} options={[{value:'desc',label:'违规费用从高到低'},{value:'asc',label:'违规费用从低到高'}]} onChange={v=>{setSort(v);setPage(1)}}/><Button icon={<DownloadOutlined/>} aria-label="导出筛选结果" disabled={!rows.length} onClick={exportRows}>导出筛选结果</Button></div>}>
    <div className="profile-table-wrap"><table className="profile-table check-detail-table"><thead><tr>{['数据范围','医保项目编码','项目名称','险种','就医类型','检查方式','医院单价','违规数量','违规费用','行为认定','详情'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{sorted.slice((page-1)*10,page*10).map(r=><tr key={r.id}><td><span className={`check-region-tag ${r.region==='异地'?'foreign':''}`}>{r.region}</span></td><td>{r.code}</td><td>{r.name}</td><td>{r.insurance}</td><td>{r.visit}</td><td>{r.method}</td><td>{formatMoney(r.price)}</td><td>{r.quantity.toLocaleString('zh-CN',{maximumFractionDigits:3})}</td><td>{formatMoney(r.amount)}</td><td><span className="check-behavior-tag">{r.behavior}</span></td><td><button className="check-row-detail" onClick={()=>setSelected(r)}>查看</button></td></tr>)}</tbody></table>{!rows.length&&<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的明细，请调整筛选条件"/>}</div>
    <div className="check-pagination"><Button aria-label="上一页" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>上一页</Button><span>{page} / {Math.max(1,Math.ceil(rows.length/10))} 页</span><Button aria-label="下一页" disabled={page>=Math.ceil(rows.length/10)} onClick={()=>setPage(p=>p+1)}>下一页</Button></div>
   </Section></div>
   <Section title="后续核查建议">
    <div className="institution-advice-stats check-advice-stats">{[['重点行为',String(Math.min(2,rankedBehaviors.length))+'类','优先核验高贡献行为'],['高费用项目',String(Math.min(5,projects.length))+'项','建议穿透至费用明细'],['异地费用',percent(sumCheckItems(rows.filter(r=>r.region==='异地')),total),'需与异地结算记录交叉核验'],['办理状态',check.stage,'持续跟踪材料与处理结论']].map(([title,value,desc])=><div key={title}><span>{title}</span><strong>{value}</strong><p>{desc}</p></div>)}</div>
    <div className="institution-advice-grid check-advice-grid">{advice.map(([title,content,color])=><article key={title}><span className={`institution-advice-label ${color}`}>{title}</span><p>{content}</p></article>)}</div>
    <div className="institution-shortcuts">{['核查依据','费用明细','病历医嘱','异地备案','结算凭证','整改材料'].map(name=><button key={name} onClick={()=>shortcut(name)}>{name}</button>)}</div>
   </Section>
  </div>
  <Modal title="违规项目明细" open={!!selected} onCancel={()=>setSelected(null)} footer={<Button onClick={()=>setSelected(null)}>关闭</Button>}>{selected&&<><Descriptions column={1} bordered size="small" items={[{key:'institution',label:'医疗机构',children:institution.name},{key:'batch',label:'检查批次',children:batch},{key:'name',label:'项目名称 / 编码',children:`${selected.name} / ${selected.code}`},{key:'context',label:'数据范围 / 险种 / 就医类型',children:`${selected.region} / ${selected.insurance} / ${selected.visit}`},{key:'method',label:'检查方式',children:selected.method},{key:'price',label:'医院单价',children:`${formatMoney(selected.price)}元`},{key:'quantity',label:'违规数量',children:selected.quantity},{key:'amount',label:'违规费用',children:`${formatMoney(selected.amount)}元`},{key:'behavior',label:'行为认定',children:selected.behavior}]}/></>}</Modal>
  <Modal title={resource} open={!!resource} onCancel={()=>setResource(null)} footer={<Button onClick={()=>setResource(null)}>关闭</Button>}><div className="institution-resource"><FileSearchOutlined/><h3>{institution.name} · {batch}</h3>{resource==='核查依据'?<><p>本次检查{check.start}至{check.end}，监管阶段：{check.stage}。</p><p>当前筛选命中{rows.length}条明细、{projectCount}个项目，费用合计{formatMoney(total)}元。合规得分及风险等级为检查既定评级，不受明细筛选影响。</p></>:<><p>{resource==='病历医嘱'?'建议核验项目执行记录、医嘱与诊疗合理性。':resource==='异地备案'?'建议交叉核验异地备案信息与异地结算记录。':resource==='结算凭证'?'建议核验结算流水、收费清单及费用追回凭证。':'建议核验整改报告、复核结论及归档材料。'}</p></>}</div></Modal>
 </div>;
}
