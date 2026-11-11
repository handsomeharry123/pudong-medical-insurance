import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ModulePlaceholder, platformModules } from './layouts/PlatformNavigation';
import InstitutionProfiles from './pages/analysis/InstitutionProfiles';
import InstitutionDetail from './pages/analysis/InstitutionDetail';
import CheckProfile from './pages/analysis/CheckProfile';
import BasicLayout from './layouts/BasicLayout';
import Login from './pages/portal/Login';
import HomePage from './pages/home';
import Dashboard from './pages/home/Dashboard';
import AutoTaskForm from './pages/home/AutoTaskForm';
import AutoTaskTemplateList from './pages/home/AutoTaskTemplateList';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },
  {
    path: '/app', element: <BasicLayout />, children: [
      { index: true, element: <Navigate to="/app/home/dashboard" replace /> },
      { path: 'home', element: <Navigate to="/app/home/dashboard" replace /> },
      { path: 'modules/analysis', element: <Navigate to="/app/modules/analysis/institution-profiles" replace /> },
      { path: 'modules/analysis/institution-profiles', element: <InstitutionProfiles /> },
      { path: 'modules/analysis/institution-profiles/:code', element: <InstitutionDetail /> },
      { path: 'modules/analysis/institution-profiles/:code/checks/:batch', element: <CheckProfile /> },
      ...platformModules.filter(module => module.key !== 'analysis').map(module => ({ path: `modules/${module.key}`, element: <ModulePlaceholder /> })),
      { path: 'home/dashboard', element: <Dashboard /> },
      ...['overview', 'connector', 'skill', 'skill/manage', 'auto-tasks'].map(path => ({
        path: `home/${path}`, element: <HomePage />,
      })),
      { path: 'home/auto-tasks/templates', element: <AutoTaskTemplateList /> },
      { path: 'home/auto-tasks/new', element: <AutoTaskForm /> },
      { path: '*', element: <Navigate to="/app/home/dashboard" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
export default router;
