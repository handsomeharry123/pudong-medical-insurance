import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, Drawer, Input, Tooltip, Upload, message, App as AntApp, Select } from 'antd';
import { ArrowUpOutlined, AudioOutlined, PaperClipOutlined, StopOutlined, ExpandOutlined, CloseOutlined, AppstoreOutlined, ProfileOutlined, FileSearchOutlined } from '@ant-design/icons';
import MetricCards from './regulator/MetricCards';
import ReactMarkdown from 'react-markdown';
import AgentRobotIcon from '../agent-center/smart/AgentRobotIcon';
import HomeSidebarV2, { initialAutoTasks, initialSessions, runHistoryMocks, type AutoTask, type SessionEntry } from './HomeSidebarV2';
import ConnectorList from './ConnectorList';
import SkillList from './SkillList';
import SkillManage from './SkillManage';
import AutoTaskList from './AutoTaskList';
import ModelSelector from './ModelSelector';
import ResultView from './regulator/ResultView';
import { useAuth } from '../../hooks/useAuth';
import { catalog, newContext, respond, switchScene, sceneQuestions, titleOf, welcomes, type Context, type Result, type Scene } from './regulator/engine';
import { SCENES, DEFAULT_INST, history, institutions } from './regulator/data';
import './regulator/regulator.css';

type ChatMessage={id:string;role:'user'|'assistant';content:string;entry?:'modules'|'analysis'|'portrait';result?:Result};
type Conversation={id:string;title:string;messages:ChatMessage[];context:Context;updatedAt:string};
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const initialGreeting='您好，我是医小保。\n\n我可以协助您开展医保数据分析、医保经办审核、集采计划执行进度跟踪和长护险监管。您可以从下方选择需要使用的功能，也可以直接告诉我想查询或办理的事项。';
const analysisGreeting='已进入“医保数据分析”。\n\n这里可以帮助您查询和分析医保监管数据，从全区总体情况逐步查看到具体医疗机构和单次检查。目前已开放“医疗机构监管履历画像”功能。';
const portraitGreeting='已进入“医疗机构监管履历画像”。\n\n您可以先查看全区医疗机构风险分布，按机构名称、机构代码、风险等级或结算等级筛选机构；进入机构画像后，可以查看历次风险变化、违规费用和检查记录，并继续下钻至某次检查。\n\n浏览过程中，我还可以帮您查找机构、解读指标、分析风险原因、进行横向比较，以及生成监管建议和机构画像报告。您可以直接操作页面，也可以随时告诉我想了解什么。';
const modules=[{name:'医保数据分析',description:'查询医保监管数据，分析机构风险、检查结果及变化情况',action:'进入分析'},{name:'医保经办审核',description:'辅助查询经办审核事项、审核进度及异常情况',action:'进入审核'},{name:'集采计划执行进度跟踪',description:'跟踪集采计划、任务执行进度及异常事项',action:'查看进度'},{name:'长护险监管',description:'查询长护险机构、人员、预警线索和核查情况',action:'进入监管'}];
const welcomeMessage=():ChatMessage=>({id:uid(),role:'assistant',content:initialGreeting,entry:'modules'});
const STORE='pudong-regulator-conversations-v1';
function loadSessions():Conversation[]{try{return JSON.parse(sessionStorage.getItem(STORE)||'[]');}catch{return [];}}
const seededNodes=[0,16,13,1,53,16,12];
function seedConversation(id:string):Conversation{
 const index=Number(id.slice(1))-1,node=seededNodes[index]??0;
 let c=newContext();if(node===16||node===53){c={...c,institution:DEFAULT_INST.code,batch:'FXJC-2026-011',scene:node===53?3:2,analysis:node===53?[16,35,37,40,43,46,51]:[]};}
 const result=respond(catalog[node].prompt,c,node);
 if(index===5){result.views=['profile','history'];result.content='已恢复浦东新区中医医院近5年风险趋势分析，以下展示该机构历次有效检查，保持机构口径。';}
 return {id,title:initialSessions[index]?.title||'监管查询',updatedAt:initialSessions[index]?.updatedAt||'刚刚',context:result.context,messages:[{id:uid(),role:'user',content:catalog[node].prompt},{id:uid(),role:'assistant',content:result.content,result}]};
}
export default function HomePage(){return <AntApp><RegulatorHome /></AntApp>;}
function RegulatorHome(){
 const navigate=useNavigate(),location=useLocation();
 const { currentUser }=useAuth();
 const [conversations,setConversations]=useState<Conversation[]>(loadSessions);
 const [activeId,setActiveId]=useState<string|null>(null);
 const [messages,setMessages]=useState<ChatMessage[]>(()=>[welcomeMessage()]);
 const [context,setContext]=useState<Context>(newContext);
 const [draft,setDraft]=useState(''),[loading,setLoading]=useState(false),[step,setStep]=useState(0),[pendingResult,setPendingResult]=useState<Result|null>(null);
 const [tasks,setTasks]=useState<AutoTask[]>(()=>initialAutoTasks.map(t=>({...t,runs:t.runs.map(r=>({...r}))})));
 const [expanded,setExpanded]=useState<Result|null>(null),[model,setModel]=useState('auto'),[files,setFiles]=useState<string[]>([]);
 const [mobileSidebar,setMobileSidebar]=useState(false);
 const [runTitle,setRunTitle]=useState('');
 const scrollRef=useRef<HTMLDivElement>(null),contentRef=useRef<HTMLDivElement>(null);
 const followLatest=useRef(true),previousTurn=useRef('');
 const [awayFromLatest,setAwayFromLatest]=useState(false);
 const inputRef=useRef<any>(null),generation=useRef(0),contextRef=useRef(context);
 contextRef.current=context;
 const isChat=location.pathname.endsWith('/overview');
 const middle=location.pathname.endsWith('/connector')?'connector':location.pathname.endsWith('/skill/manage')?'skill-manage':location.pathname.endsWith('/skill')?'skill':location.pathname.endsWith('/auto-tasks')?'auto-tasks':'overview';
 const displayedSessions:SessionEntry[]=[...conversations.map(s=>({id:s.id,title:s.title,updatedAt:s.updatedAt})),...initialSessions.filter(s=>!conversations.some(c=>c.id===s.id))];
 useEffect(()=>{try{sessionStorage.setItem(STORE,JSON.stringify(conversations));}catch{}},[conversations]);
 // Scroll only the message viewport, keeping the composer and page fixed.
 function scrollToLatest(){
  const el=scrollRef.current;if(!el)return;
  followLatest.current=true;setAwayFromLatest(false);
  el.scrollTo({top:el.scrollHeight,behavior:'instant' as ScrollBehavior});
 }
 useLayoutEffect(()=>{
  if(middle!=='overview')return;
  const latestUser=[...messages].reverse().find(m=>m.role==='user')?.id||'';
  const turn=`${activeId||'new'}:${latestUser}`;
  if(previousTurn.current!==turn)followLatest.current=true;
  previousTurn.current=turn;
  const el=scrollRef.current;if(!el)return;
  if(messages.length===1&&messages[0].entry==='modules'){
   el.scrollTop=0;followLatest.current=true;setAwayFromLatest(false);
  }else if(followLatest.current)scrollToLatest();
 },[messages,loading,activeId,middle]);
 useEffect(()=>{
  const viewport=scrollRef.current,content=contentRef.current;
  if(!viewport||!content)return;
  const observer=new ResizeObserver(()=>{
   if(followLatest.current)scrollToLatest();
   else setAwayFromLatest(viewport.scrollHeight-viewport.scrollTop-viewport.clientHeight>48);
  });
  observer.observe(content);observer.observe(viewport);
  return ()=>observer.disconnect();
 },[middle]);
 function handleChatScroll(){
  const el=scrollRef.current;if(!el)return;
  const nearBottom=el.scrollHeight-el.scrollTop-el.clientHeight<=48;
  followLatest.current=nearBottom;setAwayFromLatest(!nearBottom);
 }

 useEffect(()=>{
  const entry=(location.state as {regulatorEntry?:{institution:string;action:'profile'|'checks'}}|null)?.regulatorEntry;
  if(entry){
    const org=institutions.find(i=>i.code===entry.institution);
    if(org){
      generation.current++;setLoading(false);setPendingResult(null);
      const c:Context={...newContext(),scene:entry.action==='profile'?2:3,institution:org.code,batch:entry.action==='profile'?history(org.code)[0]?.batch:undefined};
      const r=respond(entry.action==='profile'?`查看${org.name}的监管画像。`:catalog[32].prompt,c);
      if(entry.action==='checks'){r.context={...r.context,scene:3,year:'',batch:undefined};r.views=['checks'];r.content=`已定位${org.name}（${org.code}），共有${history(org.code).length}次有效检查。请选择批次进入监管履历分析；机构上下文已保留。`;r.actions=history(org.code).slice(0,3).map(b=>`查看${b.batch}这次检查。`);}
      const id=uid(),all=[{id:uid(),role:'assistant' as const,content:r.content,result:r}];
      setActiveId(id);setContext(r.context);setMessages(all);setDraft('');persist(id,all,r.context,`${org.name}${entry.action==='profile'?'监管画像':'历次检查'}`);
      navigate('/app/home/overview',{replace:true,state:null});
    }else message.info('未找到机构，请输入机构名称或代码重新查询。');
    return;
  }
  const prompt=(location.state as {dashboardPrompt?:string}|null)?.dashboardPrompt;if(prompt)setDraft(prompt);const sid=(location.state as {restoreSessionId?:string}|null)?.restoreSessionId;if(sid)restoreSession(sid);const run=(location.state as {restoreRunId?:string}|null)?.restoreRunId;if(run)restoreRun(run);},[location.key]);
 useEffect(()=>()=>{generation.current++;},[]);
 function persist(id:string,all:ChatMessage[],c:Context,title?:string){setConversations(prev=>{const existing=prev.find(s=>s.id===id);const next={id,title:existing?.title||title||titleOf(c),messages:all,context:c,updatedAt:'刚刚'};return [next,...prev.filter(s=>s.id!==id)];});}
 function reset(){setRunTitle('');generation.current++;setLoading(false);setPendingResult(null);setActiveId(null);setContext(newContext());setMessages([welcomeMessage()]);setDraft('');setFiles([]);setExpanded(null);setMobileSidebar(false);navigate('/app/home/overview',{replace:true,state:null});setTimeout(()=>inputRef.current?.focus(),50);}
 function restoreSession(id:string){setRunTitle('');generation.current++;setLoading(false);setPendingResult(null);const s=conversations.find(s=>s.id===id)||seedConversation(id);setActiveId(id);setContext(s.context);setMessages(s.messages);setDraft('');setExpanded(null);setMobileSidebar(false);navigate('/app/home/overview',{replace:true,state:null});}
 function restoreRun(id:string){setRunTitle(tasks.flatMap(task=>task.runs).find(run=>run.id===id)?.name||'自动化任务记录');generation.current++;setLoading(false);setPendingResult(null);const lines=runHistoryMocks[id]||[];setMessages(lines.map(m=>({id:m.id,role:m.role,content:m.content})));setContext(newContext());setActiveId(null);setDraft('');navigate('/app/home/overview',{replace:true,state:null});setMobileSidebar(false);}
 function pickScene(scene:Scene){generation.current++;setLoading(false);setPendingResult(null);const c={...newContext(),scene};const r=switchScene(scene,c);const next:ChatMessage[]=[...messages,{id:uid(),role:'user',content:SCENES[scene-1]},{id:uid(),role:'assistant',content:r.content,result:r}];const id=activeId||uid();setContext(r.context);setMessages(next);setActiveId(id);persist(id,next,r.context,SCENES[scene-1]);setDraft('');setTimeout(()=>inputRef.current?.focus(),20);}
 function openEntry(entry:'modules'|'analysis'|'portrait',prompt:string){
  if(loading)return;
  const c=newContext(),id=activeId||uid();
  const content=entry==='modules'?initialGreeting:entry==='analysis'?analysisGreeting:portraitGreeting;
  const all:ChatMessage[]=[...messages,{id:uid(),role:'user',content:prompt},{id:uid(),role:'assistant',content,entry}];
  setActiveId(id);setMessages(all);setContext(c);setDraft('');persist(id,all,c,prompt);
 }
 async function send(text:string){
  const value=text.trim();if(!value||loading)return;
  if(/^(医保数据分析|进入分析)$/.test(value)){openEntry('analysis',value);return;}
  if(/^(医疗机构监管履历画像|进入功能)$/.test(value)){openEntry('portrait',value);return;}
  if(/^(返回首页|返回业务模块)$/.test(value)){openEntry('modules',value);return;}
  if(/经办|集采|长护险/.test(value)){
   const id=activeId||uid();const all:ChatMessage[]=[...messages,{id:uid(),role:'user',content:value},{id:uid(),role:'assistant',content:'医保经办审核、集采计划执行进度跟踪和长护险监管正在建设中，暂不支持查询或办理。目前已开放医保数据分析，您可以进入医疗机构监管履历画像，或直接提问机构风险和检查进度。',entry:'modules'}];
   setActiveId(id);setMessages(all);setDraft('');persist(id,all,contextRef.current,value);return;
  }
  const token=++generation.current,id=activeId||uid();setActiveId(id);setDraft('');
  const r=respond(value,contextRef.current);
  const user:ChatMessage={id:uid(),role:'user',content:value};const next=[...messages,user];setMessages(next);setLoading(true);setPendingResult(r);setStep(0);setExpanded(null);
  persist(id,next,contextRef.current,value.length>24?value.slice(0,24)+'…':value);
  for(let i=0;i<3;i++){await new Promise(resolve=>setTimeout(resolve,250));if(token!==generation.current)return;setStep(i+1);}
  if(token!==generation.current)return;
  const all=[...next,{id:uid(),role:'assistant' as const,content:r.content,result:r}];setMessages(all);setContext(r.context);setLoading(false);setPendingResult(null);persist(id,all,r.context);
 }
 function cancel(){generation.current++;setLoading(false);setPendingResult(null);setMessages(prev=>[...prev,{id:uid(),role:'assistant',content:'已停止生成，当前机构与查询条件保持不变。您可以修改问题后重新发送。'}]);}
 function speech(){const Speech=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Speech){message.info('当前浏览器不支持语音输入，请使用文字输入。');return;}const recognizer=new Speech();recognizer.lang='zh-CN';recognizer.onresult=(event:any)=>setDraft(s=>s+event.results[0][0].transcript);recognizer.onerror=()=>message.info('未能获取语音，请检查麦克风权限或使用文字输入。');recognizer.start();}
 const sidebar=<HomeSidebarV2 initialActiveKey={middle==='connector'?'connector':middle==='skill'||middle==='skill-manage'?'skill':middle==='auto-tasks'?'auto-task':'new'} onNewTask={reset} onRestoreSession={restoreSession} onRestoreRun={restoreRun} onOpenConnector={()=>navigate('/app/home/connector')} onOpenSkill={()=>navigate('/app/home/skill')} onOpenAutoTasks={()=>navigate('/app/home/auto-tasks')} autoTasks={tasks} sessions={displayedSessions} activeSessionId={activeId} generatingSessionId={loading?activeId:undefined} onAutoTaskCreated={task=>setTasks(prev=>[task,...prev])}/>;
 // 场景入口只跟随当前功能入口，不能由普通监管问答自动开启。
 const latestEntryIndex=messages.reduce((last,m,i)=>m.entry?i:last,-1);
 const showRegulatorScenes=latestEntryIndex>=0&&messages[latestEntryIndex].entry==='portrait';
 const hasSceneConversation=showRegulatorScenes&&messages.slice(latestEntryIndex+1).some(m=>m.result);
 const conversationTitle=activeId?displayedSessions.find(session=>session.id===activeId)?.title||'新对话':runTitle;
 const showConversationHeader=middle==='overview'&&!!conversationTitle;
 return <div className="reg-workspace" data-testid="home-v1"><aside className="reg-sidebar">{sidebar}</aside><Drawer title="工作台" placement="left" open={mobileSidebar} onClose={()=>setMobileSidebar(false)}>{sidebar}</Drawer><section className="reg-main">
  <header className={`reg-assistant-header${showConversationHeader?' reg-conversation-header':''}`}>{showConversationHeader?<Tooltip title={conversationTitle} placement="bottomLeft"><h1 className="reg-conversation-title">{conversationTitle}</h1></Tooltip>:<><AgentRobotIcon size={46}/><div><h1>医小保</h1><p>面向医保业务的数据分析与监管助手</p></div></>}<Button className="reg-mobile-tools" onClick={()=>setMobileSidebar(true)}>工作台</Button></header>
  {middle!=='overview'?<div className="reg-tool-page">{middle==='connector'?<ConnectorList embedded/>:middle==='skill'?<SkillList embedded onTrySkill={skill=>{navigate('/app/home/overview');setDraft(`使用${skill.name}辅助医保监管分析`);}}/>:middle==='skill-manage'?<SkillManage embedded/>:<AutoTaskList embedded tasks={tasks} onTasksChange={setTasks}/>}</div>:<>
  <div ref={scrollRef} onScroll={handleChatScroll} className="reg-chat-scroll" role="log" aria-label="医保监管对话记录" aria-live="polite">
   <div ref={contentRef} className="reg-chat-content">{messages.map((m,index)=><div className={`reg-message reg-message-${m.role}`} key={m.id}>{m.role==='assistant'&&<AgentRobotIcon size={28}/>}<div className="reg-message-body"><div className="reg-message-text"><ReactMarkdown>{m.content}</ReactMarkdown></div>{m.entry==='modules'&&<div className="reg-module-grid reg-module-grid-compact">{modules.map((item,i)=><button className="reg-module-card reg-module-card-compact" key={item.name} aria-label={`${item.name}，${i>0?'建设中':item.action}`} title={`${item.name}：${item.description}${i>0?'（建设中）':''}`} disabled={i>0||loading} onClick={()=>openEntry('analysis',item.name)}><div><strong>{item.name}</strong>{i>0&&<span className="reg-building">建设中</span>}</div><p>{item.description}</p><span className="reg-module-arrow" aria-hidden="true">→</span></button>)}</div>}
   {m.entry==='analysis'&&<div className="reg-module-grid"><button className="reg-module-card" disabled={loading} onClick={()=>openEntry('portrait','医疗机构监管履历画像')}><strong>医疗机构监管履历画像</strong><p>查看全区医疗机构监管概况，按条件筛选目标机构，分析机构历次风险、违规费用和检查记录，并可进一步下钻查看<span className="reg-module-ending">单次检查详情。<span className="reg-module-action reg-module-action-inline">进入功能 <span aria-hidden="true">→</span></span></span></p></button></div>}
   {m.entry==='portrait'&&<><MetricCards disabled={loading} onQuery={text=>{contextRef.current=newContext();send(text);}}/><div className="reg-next-questions">{sceneQuestions[0].map(q=><button disabled={loading} key={q} onClick={()=>send(q)}>{q}</button>)}</div></>}
   {m.result&&<><ResultView result={m.result} onAsk={send} onExpand={()=>setExpanded(m.result)}/>{m.result.actions.length>0&&<div className="reg-next-questions"><span>继续分析</span>{[...m.result.actions].sort((a,b)=>{const leader=currentUser?.roles.includes('医院领导');return leader?(Number(/排名|对标|建议|报告/.test(b))-Number(/排名|对标|建议|报告/.test(a))):0;}).map(action=><button disabled={loading} key={action} onClick={()=>send(action)}>{action}</button>)}</div>}</>}
  </div></div>)}
  {loading&&pendingResult&&<div className="reg-processing" role="status"><AgentRobotIcon size={28}/><div><strong>正在分析 · {titleOf(pendingResult.context)}</strong>{(pendingResult.steps.length?pendingResult.steps:['正在识别问题并核验查询条件','正在准备回复']).map((text,i)=><p key={i} className={i<step?'complete':i===step?'current':'waiting'}><span>{i<step?'✓':i===step?'◌':'·'}</span>{text}</p>)}</div></div>}
  </div></div>
  {awayFromLatest&&<div className="reg-latest-row"><Button size="small" onClick={scrollToLatest}>↓ 回到最新消息</Button></div>}
  <footer className="reg-composer">{showRegulatorScenes&&<div className="reg-scene-chips" role="group" aria-label="业务场景">{SCENES.map((name,i)=><button key={name} disabled={loading} aria-pressed={hasSceneConversation&&context.scene===i+1} className={hasSceneConversation&&context.scene===i+1?'active':''} onClick={()=>pickScene((i+1) as Scene)}><span className="reg-scene-icon" aria-hidden="true">{[<AppstoreOutlined/>,<ProfileOutlined/>,<FileSearchOutlined/>][i]}</span><span>{name}</span></button>)}</div>}<div className="reg-input-box">{files.length>0&&<div className="reg-attachments">{files.map(file=><span key={file}>{file}<button aria-label={`移除${file}`} onClick={()=>setFiles(prev=>prev.filter(s=>s!==file))}><CloseOutlined /></button></span>)}<small>附件已添加，暂不支持内容解析</small></div>}<Input.TextArea ref={inputRef} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="告诉我想查询或办理的事项，例如：查看高风险机构、查询未办结检查" autoSize={{minRows:2,maxRows:5}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!(e.nativeEvent as any).isComposing){e.preventDefault();send(draft);}}} aria-label="监管问题输入"/><div className="reg-input-toolbar"><Upload showUploadList={false} beforeUpload={file=>{setFiles(prev=>[...prev,file.name]);return false;}}><Tooltip title="添加附件"><Button type="text" icon={<PaperClipOutlined />} aria-label="添加附件"/></Tooltip></Upload><span className="reg-composer-hint">Enter 发送 · Shift + Enter 换行</span><div className="reg-input-right"><ModelSelector value={model} onChange={setModel}/><Button type="text" icon={<AudioOutlined />} aria-label="语音输入" onClick={speech}/>{loading?<Button aria-label="停止生成" shape="circle" icon={<StopOutlined />} onClick={cancel}/>:<Button aria-label="发送问题" type="primary" shape="circle" icon={<ArrowUpOutlined />} disabled={!draft.trim()} onClick={()=>send(draft)}/>}</div></div></div></footer></>}
 </section><Drawer title={expanded?titleOf(expanded.context):'分析视图'} width="min(1200px,96vw)" open={!!expanded} onClose={()=>setExpanded(null)}>{expanded&&<><p>{expanded.content}</p><ResultView result={expanded} onAsk={text=>{setExpanded(null);send(text);}}/></>}</Drawer></div>;
}
