/**
 * 医小管智能体首页 V1.x · 第二层 · 首页内左侧管理栏
 *
 * PRD §1:自上而下 6 大区 —— 工具区 / 品牌区 / 工作台区 / 自动化任务执行区(称「自动化任务记录」) / 最近对话区(称「历史会话」) / 账户区。
 *
 * 设计要点:
 *   - 固定宽 280px,与右侧第三层 Card 等高(高度由 home/index.tsx 的 Row 高度约束)。
 *   - 不新建 store / Context,会话历史 mock 在本文件 export,被 home/index.tsx 引用(避免双源)。
 *   - 所有 data-testid 命名 home-v1-side-*,不影响 verify_home_v1.mjs 黑名单断言。
 *   - 文案避开黑名单:1.3 「新建任务」(≠「新建对话」)、1.4 「自动化任务记录」(≠「自动化任务执行」)、1.5 「历史会话」(≠「最近对话」)。
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ApiOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  LoadingOutlined,
  MenuFoldOutlined,
  PlusOutlined,
  SearchOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Input,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import AgentRobotIcon from '../agent-center/smart/AgentRobotIcon';


const { Text } = Typography;

/* =========================================================
 * 类型与本地 mock
 * ========================================================= */
export interface AutoTaskSubRun {
  /** 子任务命名规则:任务名称-yyyy-MM-dd-HH-mm-ss */
  id: string;
  /** 子任务展示名(同 name 字段) */
  name: string;
  /** 相对执行时间,例如「刚刚」「22 分钟前」 */
  updatedAt: string;
  /** 本次执行状态 */
  status: '成功' | '失败' | '部分失败';
  /** 本次执行是否启用,与父任务 enabled 同步(便于列表筛选) */
  enabled?: boolean;
  /** 下次执行相对时间,例如「约 24 小时后执行」「已暂停」 */
  nextRunIn?: string;
  /** 输出消息摘要,运行记录 Tab 使用 */
  summary?: string;
  /** 是否已归档；旧 mock 未提供时由相对执行时间兼容判断 */
  archived?: boolean;
  /** 侧栏尾部状态:生成中显示转圈,有新回复显示圆点,其余显示 updatedAt */
  activityStatus?: 'generating' | 'newReply';
}

export interface AutoTask {
  id: string;
  name: string;
  /** 是否启用(true → 目前分组;false → 暂停分组) */
  enabled: boolean;
  /** 触发频率描述,例如「每天 09:00」 */
  frequencyDesc: string;
  updatedAt: string;
  status: '成功' | '失败' | '部分失败';
  /** 一级任务下属子任务执行记录(按时间倒序) */
  runs: AutoTaskSubRun[];
}

export interface SessionEntry {
  id: string;
  title: string;
  updatedAt: string;
  /** 侧栏尾部状态:生成中显示转圈,有新回复显示圆点,其余显示 updatedAt */
  activityStatus?: 'generating' | 'newReply';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  module?: string;
  link?: { to: string; text: string };
  time: string;
}

export const initialAutoTasks: AutoTask[] = [
 {id:'t1',name:'每日监管动态简报',enabled:true,frequencyDesc:'每日 08:30',updatedAt:'今日',status:'成功',runs:[
  {id:'t1-r1',name:'每日监管动态简报-2026-11-04-08-30-00',updatedAt:'今日',status:'成功',enabled:true,summary:'风险等级变化、新增超期检查与检查进度预警已汇总。'},
  {id:'t1-r2',name:'每日监管动态简报-2026-11-03-08-30-00',updatedAt:'昨日',status:'成功',enabled:true,summary:'风险动态与检查进度简报已生成。'},
  {id:'t1-r3',name:'每日监管动态简报-2026-11-02-08-30-00',updatedAt:'2天前',status:'成功',enabled:true,summary:'监管动态简报已生成。'}]},
 {id:'t2',name:'超期检查预警推送',enabled:true,frequencyDesc:'实时监测 · 超期触发',updatedAt:'昨日 18:00',status:'成功',runs:[
  {id:'t2-r1',name:'超期检查预警推送-2026-11-03-18-00',updatedAt:'昨日 18:00',status:'成功',enabled:true,summary:'已识别阶段停留超过时限的检查，演示推送至承办人员。'},
  {id:'t2-r2',name:'超期检查预警推送-2026-11-02-18-00',updatedAt:'2天前',status:'成功',enabled:true,summary:'超期检查预警记录已生成。'}]},
 {id:'t3',name:'本月监管进度汇总报告',enabled:true,frequencyDesc:'每月1日 09:00',updatedAt:'3天前',status:'成功',runs:[
  {id:'t3-r1',name:'本月监管进度汇总报告-2026-11-01-09-00-00',updatedAt:'3天前',status:'成功',enabled:true,summary:'上月检查完成情况、风险等级变化和超期统计已汇总。'}]},
];
export const initialSessions: SessionEntry[] = [
 {id:'s1',title:'全区医疗机构监管概况查询',updatedAt:'刚刚'},
 {id:'s2',title:'浦东新区中医医院监管画像',updatedAt:'刚刚'},
 {id:'s3',title:'高风险机构未办结检查清单',updatedAt:'22 分钟前'},
 {id:'s4',title:'本月风险等级上升机构查询',updatedAt:'今早 09:15'},
 {id:'s5',title:'FXJC-2026-011 检查分析报告',updatedAt:'昨日 16:30'},
 {id:'s6',title:'中医医院近5年风险趋势分析',updatedAt:'上周'},
 {id:'s7',title:'2026年度超期检查积压报告',updatedAt:'上周'},
];
export const sessionHistoryMocks: Record<string, ChatMessage[]> = Object.fromEntries(initialSessions.map(s=>[s.id,[{id:s.id+'-u',role:'user',content:s.title,time:s.updatedAt}]]));

export const buildRunHistoryMock = (task: AutoTask, run: AutoTaskSubRun): ChatMessage[] => [
  {
    id: `${run.id}-u1`,
    role: 'user',
    content: `查看自动化任务「${task.name}」本次执行结果`,
    time: run.updatedAt,
  },
  {
    id: `${run.id}-a1`,
    role: 'assistant',
    content:
      `**执行状态：${run.status}**\n\n${run.summary ?? '本次任务已执行完成，暂无结果摘要。'}\n\n` +
      `- 执行记录：${run.name}\n- 触发规则：${task.frequencyDesc}\n- 下次执行：${run.nextRunIn ?? '待调度'}`,
    module: '自动化任务执行结果',
    time: run.updatedAt,
  },
];

/* 每条自动化执行记录对应一组可恢复的 mock 对话 */
export const runHistoryMocks: Record<string, ChatMessage[]> = Object.fromEntries(
  initialAutoTasks.flatMap((task) =>
    task.runs.map((run) => [run.id, buildRunHistoryMock(task, run)]),
  ),
);

export const ensureRunHistoryMock = (task: AutoTask, run: AutoTaskSubRun) => {
  runHistoryMocks[run.id] = buildRunHistoryMock(task, run);
};

/* =========================================================
 * 子组件:Section 标题
 * ========================================================= */
const SectionTitle = ({
  children,
  count,
  open,
  onToggle,
}: {
  children: React.ReactNode;
  count?: number;
  open?: boolean;
  onToggle?: () => void;
}) => {
  const interactive = typeof onToggle === 'function';
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {interactive ? (
        open ? (
          <CaretDownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
        ) : (
          <CaretRightOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
        )
      ) : null}
      <Text strong style={{ fontSize: 12, color: '#8c8c8c', letterSpacing: 0.5 }}>
        {children}
      </Text>
      {typeof count === 'number' ? (
        <Text type="secondary" style={{ fontSize: 12, color: '#8c8c8c' }}>
          （{count}）
        </Text>
      ) : null}
    </div>
  );
};

/* =========================================================
 * 子组件:高亮行 —— 参考图1/2/3 「左侧 3px 蓝色竖条 + 浅蓝底 + 蓝字」
 *  非选中态:透明底 + 灰字(对齐原本的 link 视觉)
 * ========================================================= */
const HighlightRow = ({
  active,
  onClick,
  icon,
  children,
  testId,
  level = 0,
}: {
  active: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  testId: string;
  /** 层级:0 = 一级(工作台/会话/一级任务);1 = 二级(子任务执行记录) */
  level?: 0 | 1;
}) => {
  return (
    <div
      data-testid={testId}
      data-active={active ? 'true' : 'false'}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: level === 0 ? '6px 8px 6px 12px' : '4px 8px 4px 16px',
        paddingLeft: level === 0 ? 12 : 16,
        marginLeft: -8,
        width: 'calc(100% + 8px)',
        boxSizing: 'border-box',
        borderRadius: 6,
        background: active ? '#E6F4FF' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#F5F5F5';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      {active && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 4,
            bottom: 4,
            width: 3,
            borderRadius: 2,
            background: '#1677FF',
          }}
        />
      )}
      {icon ? (
        <span style={{ color: active ? '#1677FF' : '#595959', fontSize: 12, flexShrink: 0 }}>{icon}</span>
      ) : null}
      <span
        style={{
          fontSize: 13,
          color: active ? '#1677FF' : '#333',
          fontWeight: active ? 500 : 400,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </div>
  );
};

const ActivityIndicator = ({
  status,
  fallback,
}: {
  status?: 'generating' | 'newReply';
  fallback: string;
}) => {
  if (status === 'generating') {
    return (
      <LoadingOutlined
        aria-label="智能体正在生成"
        style={{ color: '#18C8A5', fontSize: 13, flexShrink: 0 }}
      />
    );
  }

  if (status === 'newReply') {
    return (
      <span
        aria-label="智能体有新回复"
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#18C8A5',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, whiteSpace: 'nowrap' }}>
      {fallback}
    </Text>
  );
};

/* =========================================================
 * 主组件
 * ========================================================= */
interface Props {
  onNewTask: () => void;
  onRestoreSession: (id: string) => void;
  onRestoreRun: (id: string) => void;
  /** 独立子页可指定进入时的工作台高亮项。 */
  initialActiveKey?: 'new' | 'connector' | 'skill' | 'auto-task';
  /** 新建自动化任务成功 → 同步在右侧对话区推一条「任务创建成功」气泡 */
  onAutoTaskCreated?: (task: AutoTask, firstRunName: string) => void;
  /** 点 sidebar「连接器」→ 切换首页中间内容区(不跳路由) */
  onOpenConnector?: () => void;
  /** 点 sidebar「技能」→ 切换首页中间内容区(不跳路由) */
  onOpenSkill?: () => void;
  /** 点 sidebar「自动化任务」→ 切换首页中间内容区(不跳路由) */
  onOpenAutoTasks?: () => void;
  /** 与中间自动化列表共享的任务数据，确保测试运行记录实时同步到侧栏 */
  autoTasks?: AutoTask[];
  /** 首页可动态追加的历史会话，例如「登记需求」创建的演示会话 */
  sessions?: SessionEntry[];
  /** 外部切换/创建会话后，同步侧栏高亮 */
  activeSessionId?: string | null;
  /** 当前正在生成回复的历史会话;优先显示转圈 */
  generatingSessionId?: string | null;
  /** 已生成新回复但仍需提示的历史会话 */
  newReplySessionIds?: Set<string>;
}

const HomeSidebarV2 = ({ onNewTask, onRestoreSession, onRestoreRun, initialActiveKey = 'new', onAutoTaskCreated, onOpenConnector, onOpenSkill, onOpenAutoTasks, autoTasks = initialAutoTasks, sessions: sessionsProp, activeSessionId, generatingSessionId, newReplySessionIds }: Props) => {
  const navigate = useNavigate();
  const sessions = sessionsProp ?? initialSessions;

  /* Drawer:搜索对话 */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  /* 历史会话 / 自动化任务记录 折叠状态 */
  const [sessionsExpanded, setSessionsExpanded] = useState(true);
  const [tasksExpanded, setTasksExpanded] = useState(true);
  /* 一级自动化任务独立折叠状态(默认全部展开) */
  const [taskGroupOpen, setTaskGroupOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialAutoTasks.map((t) => [t.id, true])),
  );

  /* 1.1 工具区:收起 / 搜索 */
  const handleCollapse = () => {
    // 联动全局 ProLayout 折叠状态:点击后左侧 7 菜单立刻收起/展开

  };
  const handleSearch = () => {
    setSearchOpen(true);
  };

  /* 中间内容区高亮:点 sidebar「连接器 / 自动化任务」时,中间内容区切换,sidebar 本地保持 active 视觉 */
  /* activeKey 为字符串标识当前中间内容区展示,例如 'connector' / 'auto-task' / 'session-s1' / 'run-t1-r1' */
  const [activeKey, setActiveKey] = useState<string>(initialActiveKey);

  useEffect(() => {
    if (activeSessionId) {
      setActiveKey(`session-${activeSessionId}`);
      return;
    }
    setActiveKey(initialActiveKey);
  }, [activeSessionId, initialActiveKey]);

  /* 自动任务新建已下钻到 /app/home/auto-tasks/new,本页不再持有 Drawer state */

  return (
    <>
      <Card
        bordered={false}
        styles={{
          body: {
            padding: '16px 16px 12px',
            background: '#FFFFFF',
            borderRadius: 8,
            overflow: 'auto',
            boxSizing: 'border-box',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          },
        }}
        style={{ height: '100%' }}
      >
        {/* ============ 1.1 + 1.3 工具区 + 工作台(同一行) ============ */}
        <div
          data-testid="home-v1-side-tools"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <SectionTitle>工作台</SectionTitle>
          <Space size={4}>
            <Tooltip title="搜索对话任务">
              <Button
                type="text"
                size="small"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                data-testid="home-v1-side-tools-search"
              />
            </Tooltip>
          </Space>
        </div>

        {/* ============ 1.3 工作台区 ============ */}
        <div data-testid="home-v1-side-workbench">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <HighlightRow
              active={activeKey === 'new'}
              onClick={() => {
                setActiveKey('new');
                onNewTask();
              }}
              testId="home-v1-side-workbench-new"
              icon={<PlusOutlined />}
            >
              新建任务
            </HighlightRow>
            <HighlightRow
              active={activeKey === 'connector'}
              onClick={() => {
                setActiveKey('connector');
                if (onOpenConnector) {
                  onOpenConnector();
                } else {
                  navigate('/app/home/connector');
                }
              }}
              testId="home-v1-side-workbench-connector"
              icon={<ApiOutlined />}
            >
              连接器
            </HighlightRow>
            <HighlightRow
              active={activeKey === 'skill'}
              onClick={() => {
                setActiveKey('skill');
                if (onOpenSkill) {
                  onOpenSkill();
                } else {
                  navigate('/app/home/skill');
                }
              }}
              testId="home-v1-side-workbench-skill"
              icon={<ToolOutlined />}
            >
              技能
            </HighlightRow>
            <HighlightRow
              active={activeKey === 'auto-task'}
              onClick={() => {
                setActiveKey('auto-task');
                if (onOpenAutoTasks) {
                  onOpenAutoTasks();
                } else {
                  navigate('/app/home/auto-tasks/new');
                }
              }}
              testId="home-v1-side-workbench-auto"
              icon={<ClockCircleOutlined />}
            >
              自动化任务
            </HighlightRow>
          </div>
        </div>

        {/* ============ 1.4 + 1.5 滚动区 ============ */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingRight: 2,
          }}
        >
          {/* 1.4 历史会话 */}
          <div data-testid="home-v1-side-sessions">
            <div style={{ marginBottom: 6 }}>
              <SectionTitle
                count={sessions.length}
                open={sessionsExpanded}
                onToggle={() => setSessionsExpanded((v) => !v)}
              >
                历史会话
              </SectionTitle>
            </div>
            {sessionsExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sessions.map((s) => {
                  const sessionKey = `session-${s.id}`;
                  const isActive = activeKey === sessionKey;
                  const activityStatus =
                    generatingSessionId === s.id
                      ? 'generating'
                      : newReplySessionIds?.has(s.id)
                        ? 'newReply'
                        : s.activityStatus;
                  return (
                    <HighlightRow
                      key={s.id}
                      active={isActive}
                      onClick={() => {
                        setActiveKey(sessionKey);
                        onRestoreSession(s.id);
                      }}
                      testId={`home-v1-side-session-${s.id}`}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          minWidth: 0,
                          gap: 6,
                        }}
                      >
                        <Text
                          ellipsis
                          style={{
                            display: 'block',
                            fontSize: 12,
                            color: isActive ? '#1677FF' : '#333',
                            fontWeight: isActive ? 500 : 400,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {s.title}
                        </Text>
                        <ActivityIndicator status={activityStatus} fallback={s.updatedAt} />
                      </span>
                    </HighlightRow>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1.5 自动化任务记录(一级分组可折叠 + 二级子任务) */}
          <div data-testid="home-v1-side-tasks">
            <div style={{ marginBottom: 6 }}>
              <SectionTitle
                count={autoTasks.length}
                open={tasksExpanded}
                onToggle={() => setTasksExpanded((v) => !v)}
              >
                自动化任务记录
              </SectionTitle>
            </div>
            {tasksExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {autoTasks.map((t) => {
                  const isOpen = taskGroupOpen[t.id] ?? true;
                  const taskKey = `task-${t.id}`;
                  const isTaskActive = activeKey === taskKey;
                  return (
                    <div
                      key={t.id}
                      data-testid={`home-v1-side-task-${t.id}`}
                      style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      {/* 一级:任务名称(可折叠 + 选中高亮) */}
                      <HighlightRow
                        active={isTaskActive}
                        onClick={() => {
                          setActiveKey(taskKey);
                          setTaskGroupOpen((prev) => ({ ...prev, [t.id]: !isOpen }));
                        }}
                        testId={`home-v1-side-task-row-${t.id}`}
                        icon={
                          isOpen ? (
                            <CaretDownOutlined style={{ fontSize: 10, color: isTaskActive ? '#1677FF' : '#8c8c8c' }} />
                          ) : (
                            <CaretRightOutlined style={{ fontSize: 10, color: isTaskActive ? '#1677FF' : '#8c8c8c' }} />
                          )
                        }
                      >
                        <Text
                          ellipsis
                          style={{
                            fontSize: 12,
                            color: isTaskActive ? '#1677FF' : '#595959',
                            fontWeight: 500,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {t.name}
                        </Text>
                      </HighlightRow>
                      {/* 二级:子任务执行记录 */}
                      {isOpen && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            paddingLeft: 8,
                          }}
                        >
                          {t.runs.map((r) => {
                            const runKey = `run-${r.id}`;
                            const isRunActive = activeKey === runKey;
                            return (
                              <HighlightRow
                                key={r.id}
                                level={1}
                                active={isRunActive}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveKey(runKey);
                                  onRestoreRun(r.id);
                                }}
                                testId={`home-v1-side-task-run-${r.id}`}
                              >
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    minWidth: 0,
                                    gap: 6,
                                  }}
                                >
                                  <Text
                                    ellipsis
                                    style={{
                                      display: 'block',
                                      fontSize: 11,
                                      color: isRunActive ? '#1677FF' : '#595959',
                                      flex: 1,
                                      minWidth: 0,
                                    }}
                                  >
                                    {r.name}
                                  </Text>
                                  <ActivityIndicator status={r.activityStatus} fallback={r.updatedAt} />
                                </span>
                              </HighlightRow>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 1.6 账户区已下线(顶部已有角色徽标) */}
      </Card>

      {/* ============ 搜索弹窗(图2 风格:居中圆角白卡 + 输入 + 关闭) ============ */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 92vw)',
              maxHeight: '80vh',
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '20px 22px 16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* 顶部:搜索框 + 关闭按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Input
                size="large"
                autoFocus
                placeholder="搜索任务"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                style={{ borderRadius: 10, flex: 1 }}
                data-testid="home-v1-search-input"
              />
              <Button
                type="text"
                size="large"
                icon={<CloseOutlined />}
                onClick={() => setSearchOpen(false)}
                data-testid="home-v1-search-close"
              />
            </div>

            {/* 最近任务 */}
            <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 110px)' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                最近任务
              </Text>
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {sessions
                  .filter((s) =>
                    searchKeyword.trim() ? s.title.includes(searchKeyword.trim()) : true,
                  )
                  .map((s) => {
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveKey(`session-${s.id}`);
                          onRestoreSession(s.id);
                          setSearchOpen(false);
                          setSearchKeyword('');
                        }}
                        data-testid={`home-v1-search-item-${s.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 4px',
                          cursor: 'pointer',
                          borderRadius: 6,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F5F5F5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Text ellipsis style={{ fontSize: 14, color: '#333', flex: 1, minWidth: 0 }}>
                          {s.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, minWidth: 140, textAlign: 'right' }}>
                          {s.updatedAt}
                        </Text>
                      </div>
                    );
                  })}
                {searchKeyword.trim() &&
                  sessions.filter((s) => s.title.includes(searchKeyword.trim())).length === 0 && (
                    <Text type="secondary" style={{ fontSize: 12, padding: '12px 4px' }}>
                      未找到匹配的会话
                    </Text>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default HomeSidebarV2;
