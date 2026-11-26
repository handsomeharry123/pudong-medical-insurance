import { createContext, useContext, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Grid, Popover, Tooltip } from 'antd';
import { TeamOutlined, AuditOutlined, BarChartOutlined, ScheduleOutlined, SafetyCertificateOutlined, FileSearchOutlined, SettingOutlined, LeftOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';

export const NavigationContext = createContext({ collapsed: false, toggle: () => {} });
export const usePlatformNavigation = () => useContext(NavigationContext);
export const platformModules = [
  { key: 'analysis', title: '医保数据分析', icon: <BarChartOutlined /> },
  { key: 'review', title: '医保经办审核', icon: <AuditOutlined /> },
  { key: 'procurement', title: '集采计划执行进度跟踪', icon: <ScheduleOutlined /> },
  { key: 'care', title: '长护险监管', icon: <SafetyCertificateOutlined /> },
  { key: 'audit', title: '审计中心', icon: <FileSearchOutlined /> },
  { key: 'users', title: '用户中心', icon: <TeamOutlined /> },
  { key: 'settings', title: '系统配置', icon: <SettingOutlined /> },
];
export default function PlatformNavigation() {
  const { collapsed, toggle } = usePlatformNavigation();
  const location = useLocation();
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const screens = Grid.useBreakpoint();
  const compact = collapsed || screens.md === false;
  const inAnalysis = location.pathname.startsWith('/app/modules/analysis');
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  useEffect(() => { if (inAnalysis) setAnalysisOpen(true); setFlyoutOpen(false); }, [location.pathname, inAnalysis]);
  const items = [{ key: 'assistant', title: '医小保', icon: <span className="anticon platform-assistant-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 6V3.5l3-1" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/><circle cx="15.3" cy="2.5" r="1.5" fill="currentColor"/><path d="M12 6.5c-5.1 0-8.5 4.1-8.5 9 0 3.7 3.2 5 8.5 5s8.5-1.3 8.5-5c0-4.9-3.4-9-8.5-9Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round"/><path d="M9 12.5v2.3m6-2.3v2.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span> }, ...platformModules];
  return <aside className={`platform-navigation ${collapsed ? 'is-collapsed' : ''}`}>
    <button className="platform-nav-toggle" onClick={toggle} aria-label={collapsed ? '展开系统目录' : '收起系统目录'} aria-expanded={!collapsed}>{collapsed ? <RightOutlined /> : <LeftOutlined />}</button>
    <nav aria-label="系统目录">{items.map(item => item.key === 'analysis' ? <div className={`platform-nav-group ${inAnalysis ? 'has-active-child' : ''}`} key={item.key}>
      {compact ? <Popover placement="rightTop" trigger={['hover', 'click']} open={flyoutOpen} onOpenChange={setFlyoutOpen} overlayClassName="platform-submenu-popover" content={<div className="platform-nav-flyout"><span>医保数据分析</span><NavLink to="/app/modules/analysis/institution-profiles" onClick={()=>setFlyoutOpen(false)}>医疗机构监管履历画像</NavLink></div>}>
        <button className={`platform-nav-group-trigger ${inAnalysis ? 'is-current' : ''}`} aria-label="医保数据分析" aria-expanded={flyoutOpen} aria-haspopup="true">{item.icon}</button>
      </Popover> : <>
        <button className="platform-nav-group-trigger" aria-label={analysisOpen ? '收起医保数据分析子菜单' : '展开医保数据分析子菜单'} aria-expanded={analysisOpen} aria-controls="analysis-submenu" onClick={()=>setAnalysisOpen(v=>!v)}>
          {item.icon}<span className="platform-nav-label">{item.title}</span><DownOutlined className={`platform-menu-chevron ${analysisOpen ? 'is-open' : ''}`}/>
        </button>
        {analysisOpen && <div id="analysis-submenu" className="platform-submenu"><NavLink to="/app/modules/analysis/institution-profiles" className="platform-subnav" aria-label="医疗机构监管履历画像"><span>医疗机构监管履历画像</span></NavLink></div>}
      </>}
    </div> : <Tooltip key={item.key} title={compact ? (item.key === 'assistant' ? '医小保 · AI助手（Agent智能体）' : item.title) : ''} placement="right"><NavLink aria-label={item.title} to={item.key === 'assistant' ? '/app/home/overview' : `/app/modules/${item.key}`} className={item.key === 'assistant' ? `platform-agent-entry${location.pathname.startsWith('/app/home/') ? ' active' : ''}` : undefined}>
      {item.icon}<span className="platform-nav-label">{item.title}</span>
      {item.key === 'assistant' && !compact && <span className="platform-ai-badge" title="Agent智能体 · AI助手"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7 1.5 8.7 6l4.3 1.7-4.3 1.7L7 14l-1.7-4.6L1 7.7 5.3 6 7 1.5Zm6.2-.5.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.7Z" fill="currentColor"/></svg>AI助手</span>}
    </NavLink></Tooltip>)}</nav>
  </aside>;
}
export function ModulePlaceholder() {
  const location = useLocation();
  const module = platformModules.find(item => location.pathname === `/app/modules/${item.key}`);
  return <section className="platform-module-page"><header><h1>{module?.title}</h1></header><div className="platform-module-empty"><span className="platform-module-icon">{module?.icon}</span><h2>功能建设中</h2><p>该模块暂未开放，敬请期待。</p></div></section>;
}
