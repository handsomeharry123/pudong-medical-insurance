import VideoBackground from '../components/VideoBackground';
import PortalIcon from '../components/PortalIcon';
import { useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Modal } from 'antd';
import { AppstoreOutlined, HomeOutlined, LogoutOutlined, UserOutlined, MedicineBoxOutlined, RobotOutlined, TeamOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import './platform.css';
import ProfileAssistant from '../pages/analysis/ProfileAssistant';
import PlatformNavigation, { NavigationContext } from './PlatformNavigation';

export default function BasicLayout() {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout } = useAuth();
  const { themeKey } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [location.pathname]);
  const portal = location.pathname === '/portal';
  const dashboard = location.pathname === '/app/home/dashboard';
  useEffect(() => {
    document.body.setAttribute('data-app-theme', themeKey);
    return () => document.body.removeAttribute('data-app-theme');
  }, [themeKey]);
  if (!currentUser) return <Navigate to="/login" replace />;
  return <NavigationContext.Provider value={{ collapsed, toggle: () => setCollapsed(value => !value) }}><div className={`platform-shell ${dashboard ? 'platform-shell-dashboard' : ''} ${portal ? 'platform-shell-portal' : ''}`}>
    {portal && <VideoBackground />}
    <header className="platform-header">
      <div className="platform-brand">
        <img src="/logo.svg" alt="" /><span>{location.pathname.startsWith('/app') ? '医保综合智能体平台' : portal ? '浦东新区医保综合应用门户' : '浦东新区医保数据治理与一体化应用平台'}</span>
      </div>
      <div className="platform-header-right">
        {portal ? <div className="portal-header-actions"><span>欢迎，{currentUser.name}！</span><button className="platform-account" onClick={()=>navigate('/profile')}><UserOutlined /> 个人中心</button><button className="platform-account" onClick={()=>Modal.confirm({title:'确认退出登录？',okText:'确认退出',cancelText:'取消',onOk:()=>{logout();navigate('/login',{replace:true});}})}><LogoutOutlined /> 退出登录</button></div> : <>

        <Dropdown open={switcherOpen} onOpenChange={setSwitcherOpen} trigger={['click']} dropdownRender={() => <div className="platform-app-switcher" role="navigation" aria-label="系统切换">
          {[
            { name: '平台首页', description: '统一应用入口', icon: <PortalIcon kind="home" />, path: '/portal', tone: 'blue' },
            { name: '医保智慧服务平台', description: '业务办理 · 医疗监管', icon: <PortalIcon kind="hospital" />, path: '/portal?system=service', tone: 'hospital' },
            { name: '医保综合智能体平台', description: '智能分析 · 辅助审核', icon: <PortalIcon kind="robot" />, path: '/app/home/overview', tone: 'robot' },
            { name: '用户管理平台', description: '用户组织 · 权限管理', icon: <PortalIcon kind="users" />, path: '/app/modules/users', tone: 'users' },
          ].map(app => <NavLink key={app.path} to={app.path} className="platform-app-entry" onClick={() => setSwitcherOpen(false)}>
            <span className={`platform-app-icon ${app.tone}`}>{app.icon}</span><span className="platform-app-copy"><strong>{app.name}</strong><small>{app.description}</small></span>
          </NavLink>)}
        </div>}><button className="platform-account"><AppstoreOutlined /> 应用切换</button></Dropdown>
        <Dropdown trigger={['click']} menu={{ items: [
          { key: '/profile', label: '个人中心', icon: <UserOutlined /> },
          { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true },
        ], onClick: ({ key }) => {
          if (key === 'logout') Modal.confirm({ title: '确认退出登录？', content: '退出后需重新登录才能访问平台。', okText: '确认退出', cancelText: '取消', onOk: () => { logout(); navigate('/login', { replace: true }); } });
          else navigate(key);
        } }}>
          <button className="platform-account" aria-label="用户菜单"><Avatar size={30} icon={<UserOutlined />} style={{ background: '#eaf2ff', color: '#2469e8' }} /><span>欢迎，{currentUser.name}</span></button>
        </Dropdown>
      </>}
      </div>
    </header>
    <div className="platform-body">{!dashboard && location.pathname.startsWith('/app') && <PlatformNavigation />}<main ref={contentRef} className="platform-content"><Outlet /></main></div>
    {location.pathname.startsWith('/app/modules/analysis/institution-profiles')&&<ProfileAssistant pathname={location.pathname}/>}
  </div></NavigationContext.Provider>;
}
