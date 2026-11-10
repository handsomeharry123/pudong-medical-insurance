import {
  HomeOutlined,
  BulbOutlined,
  RobotOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  ApartmentOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  FundOutlined,
  UserOutlined,
  AuditOutlined,
  SettingOutlined,
  DeploymentUnitOutlined,
  MedicineBoxOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

/**
 * 一级模块的单一配置源
 * 供 BasicLayout（侧边栏渲染）与 DemoFloatButton（模块显隐树）共同消费
 *
 * 字段：
 *   key       - 模块唯一标识（同时作为 localStorage 持久化的 key）
 *   name      - 显示名
 *   path      - 模块入口路径（一级菜单点击后跳转的地址）
 *   icon      - 侧边栏图标
 *   defaultVisible - V1.0 文档规定的默认显隐
 *   defaultRoleVisible - 默认哪些角色可见（'itAdmin' | 'itUser' | 'both'）
 *   children  - 二级子页面列表
 */

export type ModuleKey =
  | 'home'
  | 'assistant'
  | 'workbench'
  | 'agent-needs'
  | 'project-application'
  | 'agent-center'
  | 'ledger'
  | 'resource-center'
  | 'evaluation'
  | 'orchestration'
  | 'monitoring'
  | 'security'
  | 'data-asset'
  | 'environment'
  | 'user-center'
  | 'audit'
  | 'system-config';

export interface SubPage {
  key: string;
  name: string;
  path: string;
  defaultVisible: boolean;
  /** 二级子页面的角色基线：未设置 = 跟随父模块 */
  defaultRoleVisible?: 'itAdmin' | 'itUser' | 'both';
}

export interface MasterModule {
  key: ModuleKey;
  name: string;
  path: string;
  icon: ReactNode;
  defaultVisible: boolean;
  defaultRoleVisible: 'itAdmin' | 'itUser' | 'both';
  children?: SubPage[];
}

export const masterMenu: MasterModule[] = [
  { key: 'assistant', name: '医小保', path: '/app/home/overview', icon: <RobotOutlined />, defaultVisible: true, defaultRoleVisible: 'both' },
];

/** 根据角色 + 显隐集合计算最终菜单（含子项） */
export interface ResolvedSubPage {
  key: string;
  name: string;
  path: string;
}

export interface ResolvedModule {
  key: string;
  name: string;
  path: string;
  icon: ReactNode;
  children?: ResolvedSubPage[];
}

export type MenuRoleKey = 'itAdmin' | 'itUser' | 'hospitalLeader';

const HOSPITAL_LEADER_MODULES = new Set<ModuleKey>([
  'home',
  'assistant',
  'ledger',
  'monitoring',
]);

const HOSPITAL_LEADER_SUB_PAGES = new Set([
  'ledger:overview',
  'ledger:list',
  'monitoring:overview',
  'monitoring:business',
  'monitoring:status',
  'monitoring:cost',
]);

/** 医院领导仅拥有需求指定页面的查看入口。 */
export const isHospitalLeaderModule = (moduleKey: ModuleKey): boolean =>
  HOSPITAL_LEADER_MODULES.has(moduleKey);

/** 医院领导仅拥有需求指定二级页面的查看入口。 */
export const isHospitalLeaderSubPage = (subPageKey: string): boolean =>
  HOSPITAL_LEADER_SUB_PAGES.has(subPageKey);

/**
 * 判断单个模块在「当前角色 + 用户显隐集合」下是否最终可见。
 * BasicLayout（侧边栏）与 DemoFloatButton（演示树）必须共用同一份判定，
 * 否则会出现"演示面板勾选 ↔ 侧边栏"两侧状态不对齐的问题。
 */
export const isModuleVisible = (
  module: MasterModule,
  visibleModules: Record<string, boolean>,
  demoRole: MenuRoleKey,
): boolean => {
  if (demoRole === 'hospitalLeader' && !isHospitalLeaderModule(module.key)) return false;
  // 角色基线：管理员专属模块对普通用户永远不可见
  if (module.defaultRoleVisible === 'itAdmin' && demoRole === 'itUser') return false;
  // 用户显隐偏好：未设置 = 视为默认（避免「全不选」后被默认值合并回 true）
  const pref = visibleModules[module.key];
  if (pref === false) return false;
  return true;
};

/** 同上，针对二级子页面 */
export const isSubPageVisible = (
  module: MasterModule,
  sub: SubPage,
  visibleModules: Record<string, boolean>,
  visibleSubPages: Record<string, boolean>,
  demoRole: MenuRoleKey,
): boolean => {
  // 【关键】父模块不可见时，子页面一律不可见
  // 否则会出现"父未勾 + 子仍在 checkedKeys"→ antd Tree 联动模式下父又被标为已勾
  if (!isModuleVisible(module, visibleModules, demoRole)) return false;
  if (demoRole === 'hospitalLeader' && !isHospitalLeaderSubPage(sub.key)) return false;
  // 子页面级角色基线：未设置 = 跟随父模块
  const subRole = sub.defaultRoleVisible || module.defaultRoleVisible;
  if (subRole === 'itAdmin' && demoRole === 'itUser') return false;
  const pref = visibleSubPages[sub.key];
  if (pref === false) return false;
  return true;
};

export const resolveMenu = (
  visibleModules: Record<string, boolean>,
  visibleSubPages: Record<string, boolean>,
  demoRole: MenuRoleKey,
): ResolvedModule[] => {
  return masterMenu
    .filter((m) => isModuleVisible(m, visibleModules, demoRole))
    .map((m) => {
      const children = m.children
        ?.filter((sub) => isSubPageVisible(m, sub, visibleModules, visibleSubPages, demoRole))
        .map((sub) => ({ key: sub.key, name: sub.name, path: sub.path }));
      return {
        key: m.key,
        name: m.name,
        path: m.path,
        icon: m.icon,
        children: children && children.length > 0 ? children : undefined,
      };
    });
};
