import { useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import './platform.css';
import PlatformNavigation, { NavigationContext } from './PlatformNavigation';

export default function BasicLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout } = useAuth();
  const { themeKey } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [location.pathname]);
  const dashboard = location.pathname === '/app/home/dashboard';
  useEffect(() => {
    document.body.setAttribute('data-app-theme', themeKey);
    return () => document.body.removeAttribute('data-app-theme');
  }, [themeKey]);
  if (!currentUser) return <Navigate to="/login" replace />;
  return <NavigationContext.Provider value={{ collapsed, toggle: () => setCollapsed(value => !value) }}><div className={`platform-shell ${dashboard ? 'platform-shell-dashboard' : ''}`}>
    <header className="platform-header">
      <NavLink to="/app/home/overview" className="platform-brand">
        <img src="/logo.svg" alt="" /><span>浦东新区医保数据治理与一体化应用平台</span>
      </NavLink>
      <div className="platform-header-right">
        <Dropdown trigger={['click']} menu={{ items: [
          { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true },
        ], onClick: ({ key }) => {
          if (key === 'logout') { logout(); navigate('/login'); }
        } }}>
          <button className="platform-account" aria-label="用户菜单"><Avatar size={30} icon={<UserOutlined />} style={{ background: '#eaf2ff', color: '#2469e8' }} /><span>{currentUser.name}</span></button>
        </Dropdown>
      </div>
    </header>
    <div className="platform-body">{!dashboard && <PlatformNavigation />}<main ref={contentRef} className="platform-content"><Outlet /></main></div>
  </div></NavigationContext.Provider>;
}
