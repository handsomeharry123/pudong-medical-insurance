import {useEffect,useRef,useState} from 'react';
const KEY='pudong_assistant_pos_v1';
export const clampAssistantPosition=(p:{left:number;top:number})=>({left:Math.max(8,Math.min(p.left,window.innerWidth-72)),top:Math.max(8,Math.min(p.top,window.innerHeight-72))});
export function useAssistantFloat(){
 const [position,setPosition]=useState(()=>{try{const p=JSON.parse(localStorage.getItem(KEY)||'null');if(Number.isFinite(p?.left)&&Number.isFinite(p?.top))return clampAssistantPosition(p);}catch{}return clampAssistantPosition({left:innerWidth-88,top:innerHeight-88});});
 const positionRef=useRef(position),start=useRef<any>(null),moved=useRef(false);
 const [dragging,setDragging]=useState(false);
 useEffect(()=>{positionRef.current=position;},[position]);
 useEffect(()=>{
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(positionRef.current));}catch{}};
  const move=(e:PointerEvent)=>{const s=start.current;if(!s||s.id!==e.pointerId)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;if(!moved.current&&Math.hypot(dx,dy)<3)return;moved.current=true;setDragging(true);const p=clampAssistantPosition({left:s.left+dx,top:s.top+dy});positionRef.current=p;setPosition(p);};
  const up=(e:PointerEvent)=>{if(start.current?.id!==e.pointerId)return;start.current=null;setDragging(false);if(moved.current)save();};
  const resize=()=>{const p=clampAssistantPosition(positionRef.current);positionRef.current=p;setPosition(p);save();};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('resize',resize);
  return ()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('resize',resize);};
 },[]);
 return {position,dragging,onPointerDown:(e:React.PointerEvent<HTMLElement>)=>{if(e.button!==0)return;start.current={id:e.pointerId,x:e.clientX,y:e.clientY,...positionRef.current};moved.current=false;e.currentTarget.setPointerCapture(e.pointerId);},consumeDrag:()=>{const was=moved.current;moved.current=false;return was;}};
}
