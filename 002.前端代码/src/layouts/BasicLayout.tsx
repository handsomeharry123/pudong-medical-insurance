import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown } from 'antd';
import { LogoutOutlined, UserOutlined, CheckOutlined, BgColorsOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { THEME_LABELS, type ThemeKey } from '../theme/themeConfig';
import './platform.css';

export default function BasicLayout() {
  const { currentUser, logout } = useAuth();
  const { themeKey, setThemeKey } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dashboard = location.pathname === '/app/home/dashboard';
  useEffect(() => {
    document.body.setAttribute('data-app-theme', themeKey);
    return () => document.body.removeAttribute('data-app-theme');
  }, [themeKey]);
  if (!currentUser) return <Navigate to="/login" replace />;
  return <div className={`platform-shell ${dashboard ? 'platform-shell-dashboard' : ''}`}>
    <header className="platform-header">
      <NavLink to="/app/home/dashboard" className="platform-brand">
        <img src="/logo.svg" alt="" /><span>浦东新区医保数据治理与一体化应用平台</span>
      </NavLink>
      <div className="platform-header-right">
        <nav className="platform-switch" aria-label="平台主导航">
          <NavLink to="/app/home/dashboard" className={dashboard ? 'selected' : ''}><span>数据大屏</span></NavLink>
          <NavLink to="/app/home/overview" className={!dashboard ? 'selected' : ''}><span>医小管</span></NavLink>
        </nav>
        <span className="platform-header-divider" />
        <Dropdown trigger={['click']} menu={{ items: [
          { key: 'theme', label: '主题切换', icon: <BgColorsOutlined />, children: (['simple','tech'] as ThemeKey[]).map(key => ({ key, label: THEME_LABELS[key], icon: key === themeKey ? <CheckOutlined /> : undefined })) },
          { type: 'divider' },
          { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true },
        ], onClick: ({ key }) => {
          if (key === 'logout') { logout(); navigate('/login'); }
          else if (key === 'simple' || key === 'tech') setThemeKey(key);
        } }}>
          <button className="platform-account" aria-label="用户菜单"><Avatar size={30} icon={<UserOutlined />} style={{ background: '#eaf2ff', color: '#2469e8' }} /><span>{currentUser.name}</span></button>
        </Dropdown>
      </div>
    </header>
    <main className="platform-content"><Outlet /></main>
  </div>;
}
