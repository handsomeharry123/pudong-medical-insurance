import ProfilePageHeader from './ProfilePageHeader';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Tabs, Table, Tag, Typography, Button, Descriptions, Empty, Input, Modal, Segmented, Select, Tooltip } from 'antd';
import { DownloadOutlined, FileSearchOutlined } from '@ant-design/icons';
import { profileStages, hasProfileResult, formatMoney, getProfileChecks, PROFILE_PATH, profileInstitutions, profileVisits } from './profileData';
import { checkBehaviors, checkColors, defaultCheckFilters, filterCheckItems, getCheckItems, groupCheckItems, insurances, sumCheckItems, type CheckFilters, type CheckItem } from './checkData';
import CheckAnalysisV11 from './CheckAnalysisV11';
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
 const [detailPage,setDetailPage]=useState(1),[detailSize,setDetailSize]=useState(20);
 const [main,setMain]=useState('progress'),[topic,setTopic]=useState('overview'),[stageIndex,setStageIndex]=useState<number|null>(null);
 const [filters,setFilters]=useState<CheckFilters>({...defaultCheckFilters}),[feeMode,setFeeMode]=useState('金额'),[matrixMode,setMatrixMode]=useState('完整矩阵'),[topN,setTopN]=useState('前5'),[insuranceMode,setInsuranceMode]=useState('金额'),[sort,setSort]=useState('desc'),[page,setPage]=useState(1),[selected,setSelected]=useState<CheckItem|null>(null),[resource,setResource]=useState<string|null>(null);
 const detailRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{window.scrollTo(0,0);setFilters({...defaultCheckFilters});setPage(1);setSort('desc');setSelected(null);setResource(null);setFeeMode('金额');setMatrixMode('完整矩阵');setTopN('前5');setInsuranceMode('金额');},[code,batch]);
 function update(patch:Partial<CheckFilters>){setFilters(prev=>({...prev,...patch}));setPage(1);setDetailPage(1);}
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
 function drill(project:string){setMain('details');update({project});detailRef.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 function exportRows(){const header=['数据范围','医保项目编码','项目名称','险种','就医类型','检查方式','医院单价','违规数量','违规费用','行为认定'];const csv='\ufeff'+[header,...sorted.map(r=>[r.region,r.code,r.name,r.insurance,r.visit,r.method,r.price.toFixed(2),r.quantity,r.amount.toFixed(2),r.behavior])].map(line=>line.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`${batch}-筛选明细.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function shortcut(name:string){if(name==='费用明细'){detailRef.current?.scrollIntoView({behavior:'smooth',block:'start'});return;}setResource(name);}
 if(!institution||!check)return <div className="profiles-page"><div className="profiles-body"><section className="institution-section"><Empty description="未找到对应的机构或检查记录"/><Link to={institution?`${PROFILE_PATH}/${code}`:PROFILE_PATH}>返回机构画像</Link></section></div></div>;
 const concentration=rankedBehaviors.slice(0,2).reduce((n,b)=>n+b.amount,0);
 const advice=[['风险集中',total?`${rankedBehaviors.slice(0,2).map(b=>b.name).join('与')}合计占比${percent(concentration,total)}，建议优先核查对应高费用项目和结算记录。`:'当前筛选条件下暂无费用记录，可调整筛选条件后开展核查。','orange'],['本地 / 异地',`当前查看${filters.region}数据，${filters.region==='综合'?'已合并本地及异地记录，可进一步按险种、行为认定核验。':filters.region==='本地'?'异地数据未计入本视图；可切换至“综合”进行对照。':'本地数据未计入本视图；可切换至“综合”进行对照。'}`,'red'],['重点项目',projects.length?`重点穿透核验${projects.slice(0,3).map(p=>p.name).join('、')}等高费用项目，并查看险种与就医类型分布。`:'当前暂无命中项目，请调整筛选条件。','blue'],['办理建议',check.stage==='已办结'?'本次检查已办结，建议归档处理结论并纳入机构后续风险趋势分析。':`本次检查处于${check.stage}，建议持续跟踪整改材料、费用追回及复核结论。`,'green']];
 let cumulative=0;
 return <div className="profiles-page institution-detail check-profile">
  <ProfilePageHeader parents={[{title:'医疗机构监管履历画像',to:PROFILE_PATH},{title:institution.name,to:`${PROFILE_PATH}/${code}`}]} title={batch}/>
  <div className="profiles-body">
   <section className="institution-section check-summary-v11"><div className="check-basic-v11">{[['医疗机构',institution.name],['检查批次号',batch],['检查类型',check.type],['数据开始日期',check.start],['数据结束日期',check.end],['当前监管阶段',check.stage]].map(([label,value])=><div key={label}><span>{label}</span>{label==='当前监管阶段'?<Tag className="check-stage-tag">{value}</Tag>:<strong>{value}</strong>}</div>)}</div><div className="check-result-v11"><div className="check-risk-pair"><article><span>单次检查风险值</span><strong className="orange">{hasProfileResult(check)?check.score.toFixed(2):'—'}</strong></article><article><span>单次检查风险等级</span><strong className={`risk-text-${check.risk}`}>{hasProfileResult(check)?check.risk:'—'}</strong></article></div><article><span>违规费用总额（元）</span><strong>{hasProfileResult(check)?formatMoney(fullTotal):'—'}</strong></article></div></section>
   <section className="institution-section"><Tabs className="institution-primary-tabs" activeKey={main} onChange={setMain} items={[{key:'progress',label:'办理进度'},{key:'analysis',label:'数据分析',disabled:!hasProfileResult(check)},{key:'details',label:'违规项目明细',disabled:!hasProfileResult(check)}]}/>
   {main==='progress'&&<><div className="check-process-v11">{profileStages.map((name,i)=>{const current=profileStages.indexOf(check.stage);return <button key={name} disabled={i>current} className={i===current?'current':i<current?'done':''} onClick={()=>setStageIndex(i)}><b>{i+1}</b><span>{name}</span></button>})}</div><Descriptions bordered column={2} size="small" items={[{key:'stage',label:'阶段名称',children:profileStages[stageIndex??profileStages.indexOf(check.stage)]},{key:'state',label:'阶段状态',children:stageIndex!==null&&stageIndex<profileStages.indexOf(check.stage)?'已完成':'办理中'},{key:'start',label:'开始时间',children:check.updated},{key:'end',label:'完成时间',children:stageIndex!==null&&stageIndex<profileStages.indexOf(check.stage)?check.updated:'—'},{key:'department',label:'办理部门',children:'浦东新区医保局'},{key:'person',label:'办理人员',children:'待维护'},{key:'progress',label:'办理进度',children:'演示流程记录，具体办理情况待接入'},{key:'materials',label:'相关材料',children:'暂无已上传材料'}]}/></>}
   {main==='analysis'&&hasProfileResult(check)&&<><Tabs className="institution-secondary-tabs" activeKey={topic} onChange={setTopic} items={['结果概览','违规费用结构','违规项目分析','行为与就医类型','险种与行为认定','历次检查对比','检查建议'].map((label,i)=>({key:['overview','fees','projects','matrix','insurance','history','advice'][i],label}))}/><CheckAnalysisV11 code={code} batch={batch} topic={topic} onDrill={patch=>{update(patch);setMain('details');}}/></>}
   <div style={{display:main==='details'?'block':'none'}}>
   <section className="institution-section check-global-filters" aria-label="检查全局筛选">
    <div className="check-filter-grid">
     <label>数据范围<Select aria-label="数据范围" value={filters.region} options={options(['本地','异地','综合'])} onChange={region=>update({region})}/></label>
     <label>险种<Select aria-label="险种" value={filters.insurance} options={options(insurances,'全部险种')} onChange={insurance=>update({insurance})}/></label>
     <label>就医类型<Select aria-label="就医类型" value={filters.visit} options={options(profileVisits,'全部就医类型')} onChange={visit=>update({visit})}/></label>
     <label>行为认定<Select mode="multiple" maxTagCount="responsive" aria-label="行为认定" placeholder="全部行为认定" value={filters.behaviors} options={options(checkBehaviors)} onChange={behaviors=>update({behaviors})}/></label>
     <label>检查方式<Select aria-label="检查方式" value={filters.method} options={options(['自主筛查','规则筛查'],'全部检查方式')} onChange={method=>update({method})}/></label>
     <label>项目名称/编码<Input aria-label="项目名称或编码" value={selectedProject?.name ?? filters.keyword} placeholder="输入项目名称或编码" allowClear onChange={e=>update({keyword:e.target.value,project:''})}/></label>
     <Button aria-label="重置全局筛选" onClick={()=>{setFilters({...defaultCheckFilters});setPage(1)}}>重置</Button>
    </div>
    
   </section>
   <div ref={detailRef} className="institution-scroll-target"><Section title="违规项目明细" extra={<div className="institution-controls check-detail-tools"><span>共 {rows.length} 条</span><Select aria-label="明细排序" value={sort} options={[{value:'desc',label:'违规费用从高到低'},{value:'asc',label:'违规费用从低到高'}]} onChange={v=>{setSort(v);setPage(1)}}/><Button icon={<DownloadOutlined/>} aria-label="导出筛选结果" disabled={!rows.length} onClick={exportRows}>导出筛选结果</Button></div>}>
    <Table rowKey="id" size="small" scroll={{x:2100,y:560}} dataSource={rows} onChange={p=>{setDetailPage(p.current||1);setDetailSize(p.pageSize||20);}} pagination={{current:detailPage,pageSize:detailSize,pageSizeOptions:[20,50,100],showSizeChanger:true}} locale={{emptyText:'暂无符合条件的违规项目记录，请调整筛选条件'}} columns={[
 {title:'序号',width:65,fixed:'left',render:(_,r,index)=>(detailPage-1)*detailSize+index+1},{title:'医保项目编码',dataIndex:'code',width:160,fixed:'left',render:v=><Typography.Text copyable>{v}</Typography.Text>},{title:'项目名称',dataIndex:'name',width:180,fixed:'left'},
 ...[['region','数据范围'],['insurance','险种'],['visit','就医类型'],['method','检查方式']].map(([dataIndex,title])=>({dataIndex,title,width:110})),
 {title:'标准单价',width:100,render:()=> '—'},{title:'医院单价',width:100,sorter:(a,b)=>a.price-b.price,render:(_,r)=>formatMoney(r.price)},{title:'追款单价',width:100,render:()=> '—'},
 {title:'违规数量',dataIndex:'quantity',width:100,sorter:(a,b)=>a.quantity-b.quantity},{title:'违规费用',width:140,defaultSortOrder:'descend',sorter:(a,b)=>a.amount-b.amount,render:(_,r)=>formatMoney(r.amount)},
 {title:'费用占比',width:100,sorter:(a,b)=>a.amount-b.amount,render:(_,r)=>percent(r.amount,fullTotal)},{title:'行为认定',dataIndex:'behavior',width:170},{title:'备注',width:100,render:()=> '—'},
 {title:'详情',width:80,fixed:'right',render:(_,r)=><Button type="link" onClick={()=>setSelected(r)}>查看</Button>}
 ]}/>
   </Section></div>
   </div></section>
  </div>
  <Modal title="违规项目明细" open={!!selected} onCancel={()=>setSelected(null)} footer={<Button onClick={()=>setSelected(null)}>关闭</Button>}>{selected&&<><Descriptions column={1} bordered size="small" items={[{key:'institution',label:'医疗机构',children:institution.name},{key:'batch',label:'检查批次',children:batch},{key:'name',label:'项目名称 / 编码',children:`${selected.name} / ${selected.code}`},{key:'context',label:'数据范围 / 险种 / 就医类型',children:`${selected.region} / ${selected.insurance} / ${selected.visit}`},{key:'method',label:'检查方式',children:selected.method},{key:'price',label:'医院单价',children:`${formatMoney(selected.price)}元`},{key:'quantity',label:'违规数量',children:selected.quantity},{key:'amount',label:'违规费用',children:`${formatMoney(selected.amount)}元`},{key:'behavior',label:'行为认定',children:selected.behavior}]}/></>}</Modal>
  <Modal title={resource} open={!!resource} onCancel={()=>setResource(null)} footer={<Button onClick={()=>setResource(null)}>关闭</Button>}><div className="institution-resource"><FileSearchOutlined/><h3>{institution.name} · {batch}</h3>{resource==='核查依据'?<><p>本次检查{check.start}至{check.end}，监管阶段：{check.stage}。</p><p>当前筛选命中{rows.length}条明细、{projectCount}个项目，费用合计{formatMoney(total)}元。风险值及风险等级为检查既定评级，不受明细筛选影响。</p></>:<><p>{resource==='病历医嘱'?'建议核验项目执行记录、医嘱与诊疗合理性。':resource==='异地备案'?'建议交叉核验异地备案信息与异地结算记录。':resource==='结算凭证'?'建议核验结算流水、收费清单及费用追回凭证。':'建议核验整改报告、复核结论及归档材料。'}</p></>}</div></Modal>
 </div>;
}
