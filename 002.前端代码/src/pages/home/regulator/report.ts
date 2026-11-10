import { catalog, type Context } from './engine';
import { DEFAULT_INST, institutions, checks, currentCheck, history, money, PARAM_VERSION, SNAPSHOT } from './data';
export type ReportSection={title:string;body:string};
export function reportSections(c:Context):ReportSection[]{
 const inst=institutions.find(i=>i.code===c.institution)||DEFAULT_INST;
 const check=checks.find(b=>b.batch===c.batch)||currentCheck;
 const h=history(inst.code);const total=h.reduce((s,b)=>s+b.fee,0);
 const base:ReportSection[]=[{title:'一、分析范围与统计口径',body:`本报告基于演示快照 ${SNAPSHOT}，机构：${inst.name}（${inst.code}）${c.scene===3?`；检查批次：${check.batch}`:''}。参数版本 ${PARAM_VERSION}。本报告仅用于界面与交互演示，不代表真实机构或实际监管结果。机构综合风险指数取最近10次以内有效检查，按由近及远线性递减时间权重加权；历次均分为算术均分，两者分开呈现。机构风险阈值：μ=40，σ=20，S>60为高风险，20≤S≤60为中风险，S<20为低风险。`},
 {title:'二、基本情况',body:c.scene===3?`${check.batch}，${check.type}，检查时间${check.date}，数据期间${check.start}至${check.end}，当前监管阶段${check.stage}，单次风险指数${check.score}分，违规费用${money(check.fee)}元。`:`${inst.name}当前${inst.risk}，机构综合风险指数${inst.score}分。有效检查${h.length}次，违规费用总额${money(total)}元，次均${money(total/h.length)}元。最新检查${h[0]?.batch}。`},
 ];
 const B=c.analysis.some(n=>n>=18&&n<=24),C=c.analysis.some(n=>n>=25&&n<=27||n===22);
 if(c.scene===2){
  if(B)base.push({title:'三、纵向风险溯源',body:`本轮已完成的风险溯源节点：${c.analysis.filter(n=>n>=18&&n<=24).map(n=>catalog[n].prompt).join('；')}。重点为重复收费、超范围支付及门诊费用。${check.batch}检查中重复收费金额${money(check.fee*.35)}元，占35%，超范围支付占25%。上述结论可追溯至本轮所选检查与风险指标。`});
  if(C)base.push({title:'四、横向对标分析',body:`已按同结算等级、同机构类型建立可比机构范围，以${c.comparison||'浦东新区人民医院'}为对照，统一检查时间及检查类型，分别展示违规费用总额与次均。仅纳入本轮已完成的横向分析。重复收费为重点差异维度。`});
  base.push({title:'五、分析覆盖范围',body:`已完成：机构画像${B?'、纵向风险溯源':''}${C?'、横向对标':''}。${!B?'纵向溯源尚未开展，不生成相关归因结论。':''}${!C?'横向对标尚未开展，不生成机构比较结论。':''}`});
 }else{
  for(const [title,ids]of [['三、主要违规行为',[37,38,39]],['四、纵向历史对比',[40,41,42]],['五、同类机构横向对标',[43,44,45]],['六、多维度穿透分析',[46,47,48,49,50]]] as [string,number[]][]){
   const completed=ids.filter(n=>c.analysis.includes(n));
   base.push({title,body:completed.length?`已完成：${completed.map(n=>catalog[n].prompt).join('；')}。${check.batch}主要行为包括重复收费（35%）、超范围支付（25%）与串换药品（15%）。各维度结果以当前批次、检查口径和来源记录为准。`:'本轮尚未开展此项分析，未生成相关结论。'});
  }
 }
 if(c.reportFocus)base.push({title:`重点补充：${c.reportFocus}（V${c.reportVersion}）`,body:`重复收费：${check.batch}批次金额${money(check.fee*.35)}元；涉及门诊、本地数据及门诊诊疗项目、检查项目、耗材项目。与此前批次${h[1]?.batch||'暂无'}对照，保留历史检查和项目证据。${c.reportFocus.includes('差异')?'重复违规和同类机构偏离指标分开展示，对尚未开展的对标不补造结论。':''}`});
 base.push({title:'监管关注建议',body:`${B||c.scene===3?'优先复核所选批次中重复收费和超范围支付的原始明细，核验门诊、本地及高金额项目；结合已分析的历史记录确认重复问题。':'基于已完成的横向对标，优先核实偏离参考组的重复收费指标，并补充原始明细复核。'}建议为辅助研判，供业务人员参考。`},
 {title:'数据来源与生成信息',body:`医疗机构档案库（${inst.code}）、检查结果库（${check.batch}）、风险指标库（${PARAM_VERSION}）、监管流程库。快照日期${SNAPSHOT}。报告版本V${c.reportVersion||1}，生成时间${new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}。`});
 return base.map((s,index)=>({...s,title:`${['一','二','三','四','五','六','七','八','九','十'][index]}、${s.title.replace(/^[一二三四五六七八九十]+、/,'')}`}));
}
export function reportTitle(c:Context){const inst=institutions.find(i=>i.code===c.institution)||DEFAULT_INST;return c.scene===3?`${inst.name}单次监管检查分析报告`:`${inst.name}监管画像报告`;}
const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
// Small standards-compliant ZIP writer using stored entries; OOXML has no external dependency.
function zip(files:Record<string,string|Uint8Array>){
 const enc=new TextEncoder();const chunks:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0;
 const crc=(bytes:Uint8Array)=>{let x=0xffffffff;for(const b of bytes){x^=b;for(let i=0;i<8;i++)x=x&1?(x>>>1)^0xedb88320:x>>>1;}return (x^0xffffffff)>>>0;};
 for(const [name,body]of Object.entries(files)){const n=enc.encode(name),b=typeof body==='string'?enc.encode(body):body,sum=crc(b);const local=new Uint8Array(30+n.length),v=new DataView(local.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,sum,true);v.setUint32(18,b.length,true);v.setUint32(22,b.length,true);v.setUint16(26,n.length,true);local.set(n,30);chunks.push(local,b);const c=new Uint8Array(46+n.length),d=new DataView(c.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint32(16,sum,true);d.setUint32(20,b.length,true);d.setUint32(24,b.length,true);d.setUint16(28,n.length,true);d.setUint32(42,offset,true);c.set(n,46);central.push(c);offset+=local.length+b.length;}
 const size=central.reduce((s,b)=>s+b.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,central.length,true);v.setUint16(10,central.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end] as BlobPart[],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function reportChart(c:Context){
 const inst=institutions.find(i=>i.code===c.institution)||DEFAULT_INST,check=checks.find(b=>b.batch===c.batch)||currentCheck;
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=480;
 const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,1200,480);ctx.font='24px sans-serif';ctx.fillStyle='#304b70';ctx.fillText(c.scene===3?'违规行为金额分布（演示）':'历次单次风险指数（演示）',45,40);
 const rows=c.scene===3?['重复收费','超范围支付','串换药品','过度诊疗'].map((label,i)=>({label,value:check.fee*[.35,.25,.15,.10][i]})):[...history(inst.code)].reverse().map(b=>({label:b.date,value:b.score}));
 const max=Math.max(...rows.map(r=>r.value))*1.15,w=1020/rows.length;
 rows.forEach((r,i)=>{const h=r.value/max*300;ctx.fillStyle='#4a87e8';ctx.fillRect(90+i*w,390-h,w*.55,h);ctx.fillStyle='#5f7899';ctx.font='17px sans-serif';ctx.fillText(r.label,80+i*w,425);ctx.fillText(money(r.value),90+i*w,375-h);});
 return canvas;
}
export function exportWord(c:Context){
 const p=(text:string,bold=false)=>`<w:p><w:pPr><w:spacing w:after="180"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei"/><w:sz w:val="${bold?'30':'22'}"/>${bold?'<w:b/>':''}</w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
 const title=reportTitle(c),sections=reportSections(c);
 const inst=institutions.find(i=>i.code===c.institution)||DEFAULT_INST;
 const cells=(values:string[])=>'<w:tr>'+values.map(v=>`<w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/></w:tcPr>${p(v)}</w:tc>`).join('')+'</w:tr>';
 const table='<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="DDE5EF"/><w:bottom w:val="single" w:sz="4" w:color="DDE5EF"/><w:insideH w:val="single" w:sz="4" w:color="DDE5EF"/></w:tblBorders></w:tblPr>'+cells(['批次号','检查时间','风险指数','违规费用（元）'])+history(inst.code).map(b=>cells([b.batch,b.date,String(b.score),money(b.fee)])).join('')+'</w:tbl>';
 const imageBytes=Uint8Array.from(atob(reportChart(c).toDataURL('image/png').split(',')[1]),v=>v.charCodeAt(0));
 const drawing='<w:p><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="5486400" cy="2194560"/><wp:docPr id="1" name="监管分析图"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="analysis.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdImage"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5486400" cy="2194560"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';

 const file=zip({'[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>','_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>','word/media/analysis.png':imageBytes,'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/analysis.png"/></Relationships>','word/document.xml':`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${p(title,true)}${sections.map(s=>p(s.title,true)+p(s.body)).join('')}${p('附：分析图与有效检查明细',true)}${drawing}${table}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`});download(file,`${title}-V${c.reportVersion||1}.docx`);
}
export async function exportPDF(c:Context){
 const [{default:html2canvas},{jsPDF}]=await Promise.all([import('html2canvas'),import('jspdf')]);
 const el=document.createElement('div');Object.assign(el.style,{position:'fixed',left:'-10000px',top:'0',width:'700px',padding:'36px',background:'#fff',color:'#172b46',font:'16px "PingFang SC", "Microsoft YaHei", sans-serif',lineHeight:'1.9'});document.body.append(el);
 const pdf=new jsPDF('p','mm','a4');const title=document.createElement('h1');title.textContent=reportTitle(c);title.style.fontSize='25px';el.append(title);let y=15;
 try{for(const section of reportSections(c)){const h=document.createElement('h2');h.textContent=section.title;h.style.fontSize='19px';const p=document.createElement('p');p.textContent=section.body;el.append(h,p);const canvas=await html2canvas(el,{scale:1.5,backgroundColor:'#ffffff'});const height=canvas.height*180/canvas.width;if(y+height>282){pdf.addPage();y=15;}pdf.addImage(canvas.toDataURL('image/png'),'PNG',15,y,180,height);y+=height+5;el.replaceChildren();}if(y+85>282){pdf.addPage();y=15;}pdf.addImage(reportChart(c).toDataURL('image/png'),'PNG',15,y,180,72);pdf.save(`${reportTitle(c)}-V${c.reportVersion||1}.pdf`);}finally{el.remove();}
}
