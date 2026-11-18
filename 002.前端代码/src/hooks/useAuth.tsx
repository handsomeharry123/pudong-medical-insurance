import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '../types/user';
import { mockUsers } from '../mock/users';

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (values: Pick<User, 'name' | 'phone'>) => void;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithPhone: (phone: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole, userName?: string) => void;
  hasPermission: (module: string, action: string) => boolean;
}

function savedProfile(user: User): User {
  try {
    const data = JSON.parse(localStorage.getItem('pudong-profile-' + user.id) || '{}');
    return { ...user, name: typeof data.name === 'string' ? data.name : user.name, phone: typeof data.phone === 'string' ? data.phone : user.phone };
  } catch { return user; }
}

async function passwordDigest(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function verifyPassword(user: User, password: string) {
  const stored = localStorage.getItem('pudong-password-' + user.id);
  if (!stored) return user.password === password;
  const { salt, digest } = JSON.parse(stored);
  return await passwordDigest(password, salt) === digest;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const defaultAdmin =
  mockUsers.find((u) => u.roles.includes('信息科管理员')) || mockUsers[0];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const id = sessionStorage.getItem('pudong-auth-user');
    const user = mockUsers.find(user => user.id === id);
    return user ? savedProfile(user) : null;
  });

  const updateProfile = (values: Pick<User, 'name' | 'phone'>) => {
    if (!currentUser) return;
    localStorage.setItem('pudong-profile-' + currentUser.id, JSON.stringify(values));
    setCurrentUser({ ...currentUser, ...values });
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!currentUser) throw new Error('请先登录');
    if (!await verifyPassword(currentUser, oldPassword)) throw new Error('原密码不正确');
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,32}$/.test(newPassword)) throw new Error('新密码需为8–32位，包含字母和数字');
    if (oldPassword === newPassword) throw new Error('新密码不能与原密码相同');
    const salt = crypto.randomUUID();
    const digest = await passwordDigest(newPassword, salt);
    localStorage.setItem('pudong-password-' + currentUser.id, JSON.stringify({ salt, digest }));
  };

  const isAuthenticated = currentUser !== null;

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = mockUsers.find(
      (u) => (u.name === username || u.employeeId === username || u.phone === username) 
    );

    if (user && await verifyPassword(user, password)) {
      setCurrentUser(savedProfile(user));
      sessionStorage.setItem('pudong-auth-user', user.id);
      return true;
    }
    return false;
  }, []);

  const loginWithPhone = useCallback((phone: string) => {
    const user = mockUsers.find(user => user.phone === phone);
    if (!user) return false;
    setCurrentUser(savedProfile(user));
    sessionStorage.setItem('pudong-auth-user', user.id);
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('pudong-auth-user');
    setCurrentUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole, userName?: string) => {
    // 优先按 userName + role 联合匹配；不传 userName 时按原 find 行为
    const user = userName
      ? mockUsers.find((u) => u.name === userName && u.roles.includes(role))
      : mockUsers.find((u) => u.roles.includes(role));
    if (user) {
      setCurrentUser({ ...user, roles: [role] });
    } else if (!userName) {
      // 找不到对应的种子用户时，至少保证 roles 包含切换目标
      setCurrentUser((prev) => (prev ? { ...prev, roles: [role] } : prev));
    }
    // 显式传 userName 但 mock 中找不到 → 不动 currentUser（避免脱节）
  }, []);

  const hasPermission = useCallback(
    (module: string, action: string): boolean => {
      if (!currentUser) return false;

      const roles = currentUser.roles;

      const permissions: Record<UserRole, Record<string, string[]>> = {
        医院领导: {
          home: ['view'],
          assistant: ['view'],
          ledger: ['view'],
          monitoring: ['view'],
        },
        信息科管理员: {
          '*': ['*'],
        },
        // 科室管理员：仅本科室记录 + 发起注册
        科室管理员: {
          agentCenter: ['view', 'create'],
          ledger: ['view'],
          monitoring: ['view'],
          audit: ['view'],
        },
      };

      // 多角色：任一角色命中即放行
      for (const role of roles) {
        const rolePerms = permissions[role];
        if (rolePerms['*'] && rolePerms['*'].includes('*')) {
          return true;
        }
        const modulePerms = rolePerms[module];
        if (modulePerms && modulePerms.includes(action)) {
          return true;
        }
      }
      return false;
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        updateProfile,
        changePassword,
        login,
        loginWithPhone,
        logout,
        switchRole,
        hasPermission,
      }}
    >
      {children}
      {import.meta.env.DEV && (() => {
        // 验证脚本使用：暴露 switchRole 到 window,verify 可主动调
        if (typeof window !== 'undefined') {
          (window as any).__useAuthSetRole = switchRole;
        }
        return null;
      })()}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
