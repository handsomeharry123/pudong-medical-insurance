import { useId, useState } from 'react';
import boundary from './pudong-boundary.json';
import { points, project, riskColors, type Org } from './model';

type Props = { riskFilter: string; zoom: number; selected: Org | null; hovered: Org | null; onSelect: (org: Org) => void; onHover: (org: Org | null) => void; onInteract: () => void };
const polygons = boundary.features[0].geometry.coordinates as number[][][][];
const terrain = polygons.map(poly => poly.map(ring => ring.map(project)));
const radians = -.43;
function camera(point: number[], height: number, flat: boolean) {
  const x = point[0] - 320, y = point[1] - 265;
  if (flat) return [320 + x * .87, 222 + y * .79];
  return [320 + x * Math.cos(radians) - y * Math.sin(radians), 238 + (x * Math.sin(radians) + y * Math.cos(radians)) * .76 - height];
}
function outline(poly: number[][][], height: number, flat: boolean) {
  return poly.map(ring => ring.map((point, i) => { const [x, y] = camera(point, height, flat); return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`; }).join(' ') + 'Z').join(' ');
}
export default function PudongMap3D({ riskFilter, zoom, selected, hovered, onSelect, onHover, onInteract }: Props) {
  const id = useId().replace(/:/g, '');
  const [flat, setFlat] = useState(false);
  const [motion, setMotion] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const animated = motion && !selected && !hovered;
  const top = flat ? 0 : 27;
  const shown = points.filter(org => !riskFilter || org.risk === riskFilter);
  return <div className={`history-map-scene ${flat ? 'is-flat' : 'is-3d'}`} data-motion={animated ? 'on' : 'off'}>
    <svg viewBox="0 0 640 460" role="img" aria-label={`浦东新区${flat ? '平面' : '立体'}医疗机构点位地图，${shown.length}家机构，模拟坐标`}>
      <defs>
        <linearGradient id={`${id}-land`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#3596bb"/><stop offset=".42" stopColor="#20698f"/><stop offset="1" stopColor="#13476e"/></linearGradient>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#20a4bd"/><stop offset=".48" stopColor="#0d536e"/><stop offset="1" stopColor="#061d39"/></linearGradient>
        <radialGradient id={`${id}-ground`}><stop stopColor="#0cc5e9" stopOpacity=".17"/><stop offset=".7" stopColor="#08a8d4" stopOpacity=".045"/><stop offset="1" stopColor="#071b35" stopOpacity="0"/></radialGradient>
        <linearGradient id={`${id}-scan`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#a6f8ff" stopOpacity="0"/><stop offset=".5" stopColor="#a6f8ff" stopOpacity=".23"/><stop offset="1" stopColor="#a6f8ff" stopOpacity="0"/></linearGradient>
        <pattern id={`${id}-surface-grid`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><path d="M16 0H0V16" fill="none" stroke="#64c4d7" strokeWidth=".45" opacity=".23"/></pattern>
        <clipPath id={`${id}-mask`}>{terrain.map((poly, i) => <path key={i} d={outline(poly, top, flat)} fillRule="evenodd"/>)}</clipPath>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
        <filter id={`${id}-rim`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <g className="map-ground-grid" fill="none" stroke="#236288" strokeWidth=".6" opacity=".25">{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${55+i*47} 70 L${-130+i*74} 450 M42 ${100+i*30} L608 ${100+i*30}`}/>)}</g>
      <ellipse cx="322" cy="344" rx="245" ry="95" fill={`url(#${id}-ground)`}/>
      {!flat && <g className="map-orbit" fill="none" stroke="#39bfda"><ellipse cx="322" cy="344" rx="220" ry="70" opacity=".15"/><ellipse className="map-orbit-trace" cx="322" cy="344" rx="202" ry="62" opacity=".35" strokeDasharray="30 290"/></g>}
      {!flat && <g className="map-radar-rings" fill="none" stroke="#43dffa" strokeWidth="1" pointerEvents="none"><ellipse className="map-radar-ring" cx="322" cy="325" rx="205" ry="72"/><ellipse className="map-radar-ring map-radar-ring-delayed" cx="322" cy="325" rx="205" ry="72"/><g className="map-satellite-orbit"><ellipse cx="322" cy="344" rx="232" ry="78" strokeDasharray="90 140 8 80" opacity=".45"/><circle cx="554" cy="344" r="3" fill="#b9faff" stroke="none"/></g></g>}
      <g transform={`translate(${320*(1-zoom)} ${230*(1-zoom)}) scale(${zoom})`}>
        {!flat && <g transform="translate(9 13)" filter={`url(#${id}-shadow)`}>{terrain.map((poly, i) => <path key={i} d={outline(poly, 0, flat)} fill="#000b1f" opacity=".85"/>)}</g>}
        {!flat && terrain.map((poly, pi) => <g key={pi}>{poly[0].slice(0, -1).map((p, i) => {
          const next = poly[0][i+1], lower = [camera(p, 0, false), camera(next, 0, false)], upper = [camera(next, top, false), camera(p, top, false)];
          return <path key={i} d={[...lower, ...upper].map((v, j) => `${j ? 'L' : 'M'}${v[0]},${v[1]}`).join(' ')+'Z'} fill={`url(#${id}-wall)`} stroke="#1d7593" strokeWidth=".25"/>;
        })}</g>)}
        {terrain.map((poly, i) => <g key={i}><path d={outline(poly, top, flat)} fill={`url(#${id}-land)`} fillRule="evenodd" stroke="#51bed5" strokeWidth="1.2"/><path d={outline(poly, top, flat)} fill={`url(#${id}-surface-grid)`} fillRule="evenodd"/><path d={outline(poly, top, flat)} className="map-boundary-trace" fill="none" stroke="#9ff7ff" strokeWidth="1.7" strokeDasharray="55 1600" filter={`url(#${id}-rim)`}/></g>)}
        <g clipPath={`url(#${id}-mask)`}><rect className="map-surface-scan" x="-180" y="0" width="180" height="460" fill={`url(#${id}-scan)`}/></g>
        {shown.map(org => {
          const height = !flat && org.risk === '高风险' ? 9 + org.radius : 0;
          const [x, y] = camera([org.x,org.y], top + height, flat), [baseX, baseY] = camera([org.x,org.y], top, flat);
          const isSelected=selected?.code===org.code, radius=Math.max(2.8,org.radius*.65),color=riskColors[org.risk];
          return <g key={org.code} className="history-map-point" role="button" aria-label={`地图点位 ${org.name} ${org.code} ${org.risk}`} tabIndex={0}
            onMouseEnter={()=>onHover(org)} onMouseLeave={()=>onHover(null)} onFocus={()=>onHover(org)} onBlur={()=>onHover(null)}
            onClick={e=>{e.stopPropagation();onSelect(org);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(org);}}}>
            <title>{org.name} · {org.code} · {org.risk}</title>
            {height>0&&<><ellipse cx={baseX} cy={baseY} rx={radius+3} ry={(radius+3)*.5} fill={color} opacity=".16"/><line x1={baseX} y1={baseY} x2={x} y2={y} stroke={color} strokeWidth="1.4" opacity=".7"/></>}
            {(org.risk==='高风险'||isSelected)&&<circle className="map-point-pulse" cx={x} cy={y} r={radius+3} fill="none" stroke={color} strokeWidth="1.2" style={{animationDelay:`-${org.x%3}s`}}/>}
            <circle cx={x} cy={y} r={radius+4} fill="transparent"/>
            <circle cx={x} cy={y} r={radius+1.7} fill={color} opacity=".12"/>
            <circle cx={x} cy={y} r={radius} fill={color} stroke="#c7f5fa" strokeWidth={isSelected?1.5:.55}/>
            {isSelected&&<circle cx={x} cy={y} r={radius+7} fill="none" stroke="#d3fcff" strokeDasharray="3 3"/>}
          </g>;
        })}
      </g>
      <g className="map-compass" transform="translate(583 45)" fill="none" stroke="#78b9d4" strokeWidth="1"><circle r="16" strokeOpacity=".3"/><path d={flat?'M0 9V-10 M-3 -5L0 -10L3 -5':'M5 8L-5 -9 M-7 -3L-5 -9L1 -6'}/><text y="-23" textAnchor="middle" stroke="none" fill="#98cbe0" fontSize="10">N</text></g>
    </svg>
    <div className="history-map-toolbar" aria-label="地图显示设置">
      <button title={flat?'切换3D立体视图':'切换2D平面视图'} aria-pressed={!flat} onClick={()=>{setFlat(v=>!v);onInteract();}}>{flat?'切换立体':'立体视图'}</button>
      <button aria-pressed={motion} onClick={()=>{setMotion(v=>!v);onInteract();}}>{motion?'暂停动效':'开启动效'}</button>
    </div>
  </div>;
}
