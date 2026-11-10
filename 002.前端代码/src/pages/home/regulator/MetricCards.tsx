import { useId, type CSSProperties } from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, YAxis } from 'recharts';
import { metricData } from './data';

const trends = [[8, 11, 12, 9, 9, 8], [24, 27, 29, 32, 34, 37], [2, 4, 1, 5, 3, 2]];
const questions = ['查看高风险机构', '我想了解浦东新区医疗机构监管进度情况。', '今年有哪些检查办理时间比较长？'];

export default function MetricCards({ onQuery }: { onQuery: (text: string) => void }) {
  const chartId = useId().replace(/:/g, '');
  return <div className="reg-home-metrics" aria-label="医保监管核心指标">
    {metricData.map((metric, index) => {
      // Decorative demo trends; the headline remains the current PRD metric.
      const values = [...trends[index].slice(0, -1), metric.value];
      const id = `${chartId}-metric-${index}`;
      return <button key={metric.title} className="reg-metric-card" onClick={() => onQuery(questions[index])}
        style={{ '--metric-color': metric.color, '--metric-soft': `${metric.color}12` } as CSSProperties}
        aria-label={`${metric.title} ${metric.value}${metric.unit}，点击查看明细`}>
        <div className="reg-metric-top"><span className="reg-metric-title">{metric.title}</span><span className="reg-metric-live">LIVE</span></div>
        <div className="reg-metric-value-row"><strong>{metric.value}<em>{metric.unit}</em></strong><span className="reg-metric-period">{metric.label} · 趋势示意</span></div>
        <div className="reg-mini-chart" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><AreaChart data={values.map((value, period) => ({ value, period }))} margin={{ top: 12, left: 9, right: 13, bottom: 11 }}>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={metric.color} stopOpacity={.19}/><stop offset="1" stopColor={metric.color} stopOpacity={.015}/></linearGradient>
            <filter id={`${id}-glow`} x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <YAxis hide domain={[0, Math.max(...values) * 1.18]}/>
          <CartesianGrid vertical={false} stroke="#dbe7f7" strokeDasharray="3 6"/>
          <Area isAnimationActive={false} type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2.5} fill={`url(#${id}-fill)`} filter={`url(#${id}-glow)`}
            dot={(props: any) => <g key={props.index}>{props.index === values.length - 1 && <circle cx={props.cx} cy={props.cy} r={8} fill={metric.color} opacity={.13}/>}<circle cx={props.cx} cy={props.cy} r={props.index === values.length - 1 ? 3 : 2.2} fill="#fff" stroke={metric.color} strokeWidth={1.7}/></g>}/>
        </AreaChart></ResponsiveContainer></div>
      </button>;
    })}
  </div>;
}
