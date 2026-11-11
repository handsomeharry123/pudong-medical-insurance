import { createContext, useContext, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Grid, Popover, Tooltip } from 'antd';
import { RobotOutlined, AuditOutlined, BarChartOutlined, ScheduleOutlined, SafetyCertificateOutlined, FileSearchOutlined, TeamOutlined, SettingOutlined, LeftOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';

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
  const items = [{ key: 'assistant', title: '医小保', icon: <RobotOutlined /> }, ...platformModules];
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
    </div> : <Tooltip key={item.key} title={compact ? item.title : ''} placement="right"><NavLink aria-label={item.title} to={item.key === 'assistant' ? '/app/home/overview' : `/app/modules/${item.key}`} className={item.key === 'assistant' && location.pathname.startsWith('/app/home/') ? 'active' : undefined}>
      {item.icon}<span className="platform-nav-label">{item.title}</span>
    </NavLink></Tooltip>)}</nav>
  </aside>;
}
export function ModulePlaceholder() {
  const location = useLocation();
  const module = platformModules.find(item => location.pathname === `/app/modules/${item.key}`);
  return <section className="platform-module-page"><header><h1>{module?.title}</h1></header><div className="platform-module-empty"><span className="platform-module-icon">{module?.icon}</span><h2>功能建设中</h2><p>该模块暂未开放，敬请期待。</p></div></section>;
}
