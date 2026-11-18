import { useState } from 'react';
import { Button, Card, Descriptions, Tag, Modal, Avatar, Form, Input, message } from 'antd';
import { EditOutlined, UserOutlined, ApartmentOutlined, MedicineBoxOutlined, RobotOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './portal.css';

const applications = [
  { title: '医保智慧服务平台', icon: <MedicineBoxOutlined />, color: '#176587', description: '承载现有医保业务系统的统一访问和业务办理', intro: '日常医保业务办理统一入口', tags: ['业务办理', '医疗监管'], features: ['定点医疗机构康复理疗和中医治疗监管系统', '医疗业务后台管理系统', '公务员医疗补助管理系统', '代配药监管系统', '浦东医保业务管理系统', '就业保障平台子模块'] },
  { title: '医保综合智能体平台', icon: <RobotOutlined />, color: '#4266e9', description: '提供医保数据分析、业务辅助审核和智能监管能力', intro: '医小保智能分析监管入口', tags: ['数据分析', '智能审核', '智能监管'], features: ['医保数据分析智能体', '医保经办智能审核智能体', '长护险监管智能体', '集采计划执行进度跟踪智能体'], available: true },
  { title: '用户管理平台', icon: <ApartmentOutlined />, color: '#448c87', description: '用于管理组织、用户、角色及应用访问权限', intro: '用户、角色、应用及系统配置统一管理入口', tags: ['组织管理', '访问权限'], features: ['用户管理', '角色设置', '权限设置'] },
];
export default function Portal() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const shortcuts: Record<string, string> = {
    '医保数据分析智能体': '/app/modules/analysis/institution-profiles',
    '医保经办智能审核智能体': '/app/modules/review',
    '长护险监管智能体': '/app/modules/care',
    '集采计划执行进度跟踪智能体': '/app/modules/procurement',
    '用户管理': '/app/modules/users',
    '角色设置': '/app/modules/settings?tab=roles',
    '权限设置': '/app/modules/settings?tab=permissions',
  };
  const openFeature = (feature: string) => {
    const target = shortcuts[feature];
    if (target) navigate(target);
    else Modal.info({ title: feature, content: '该业务系统暂未接入，开放后可从此处直接进入。', okText: '知道了', centered: true });
  };
  const serviceOnly = new URLSearchParams(window.location.search).get('system') === 'service';
  const apps = serviceOnly ? applications.slice(0, 1) : currentUser?.roles.includes('信息科管理员') ? applications : applications.slice(0, 2);
  return <div className="portal-page portal-home"><div className="portal-intro"><h1>{serviceOnly ? '医保智慧服务平台' : '平台门户'}</h1></div><div className="portal-grid" style={{ gridTemplateColumns: `repeat(${apps.length}, minmax(0, 1fr))` }}>{apps.map(app => <Card key={app.title} className="portal-card" onPointerMove={event => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty('--pointer-x', `${x * 100}%`);
    card.style.setProperty('--pointer-y', `${y * 100}%`);
    card.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
    card.style.setProperty('--tilt-y', `${(x - 0.5) * 3}deg`);
  }} onPointerLeave={event => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  }} style={{ '--portal-accent': app.color } as import('react').CSSProperties}><span className="portal-pointer-light" aria-hidden="true" /><div className="portal-icon" style={{ color: app.color, background: `${app.color}12` }}>{app.icon}</div><h2>{app.title}</h2><p className="portal-description">{app.description}</p><div>{app.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}</div><div className="portal-features"><strong>{app.intro}</strong><ul>{app.features.map(feature => <li key={feature}><button type="button" className="portal-shortcut" aria-label={feature} onClick={() => openFeature(feature)}><span>{feature}</span><ArrowRightOutlined /></button></li>)}</ul></div><Button block size="large" type={app.available ? 'primary' : 'default'} disabled={!app.available} onClick={() => navigate('/app/home/overview')}>{app.available ? '进入平台' : '进入平台（暂未开放）'} {app.available && <ArrowRightOutlined />}</Button></Card>)}</div></div>;
}
export function PersonalCenter() {
  const { currentUser: user, updateProfile, changePassword } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  return <div className="portal-page profile-page"><div className="profile-container">
    <header className="profile-heading"><h1>个人中心</h1><p>管理个人资料，查看账户信息</p></header>
    <Card className="profile-card">
      <div className="profile-summary">
        <Avatar size={64} icon={<UserOutlined />} />
        <div className="profile-identity"><h2>{user?.name}</h2><span>{user?.department || '暂无部门'}</span></div>
        <Button icon={<EditOutlined />} type="primary" onClick={() => { form.setFieldsValue({ name: user?.name, phone: user?.phone }); setEditing(true); }}>编辑资料</Button>
      </div>
      <section className="profile-section"><h3>基本资料</h3><Descriptions colon={false} layout="horizontal" column={{ xs: 1, sm: 2, md: 3 }} items={[
        { key: 'name', label: '姓名', children: user?.name || '—' },
        { key: 'id', label: '工号', children: user?.employeeId || '—' },
        { key: 'phone', label: '手机号', children: user?.phone || '—' },
      ]} /></section>
      <section className="profile-section"><h3>账户信息</h3><Descriptions colon={false} layout="horizontal" column={{ xs: 1, sm: 2, md: 3 }} items={[
        { key: 'department', label: '所属部门', children: user?.department || '—' },
        { key: 'roles', label: '当前角色', children: user?.roles.map(role => <Tag key={role} className="profile-role">{role}</Tag>) },
        { key: 'last', label: '最近登录', children: user?.lastLoginAt || '暂无记录' },
      ]} /></section>
      <section className="profile-section profile-security"><h3>账户安全</h3><div className="profile-password-row"><span>密码</span><span className="profile-password-mask" aria-label="密码已设置">••••••••</span><Button type="link" onClick={() => { passwordForm.resetFields(); setPasswordOpen(true); }}>修改密码</Button></div></section>
    </Card>
    <Modal title="修改密码" open={passwordOpen} centered okText="保存密码" cancelText="取消" confirmLoading={savingPassword} onCancel={() => setPasswordOpen(false)} onOk={() => passwordForm.submit()}>
      <Form form={passwordForm} layout="vertical" requiredMark={false} style={{ marginTop: 24 }} onFinish={async values => {
        setSavingPassword(true);
        try { await changePassword(values.oldPassword, values.newPassword); setPasswordOpen(false); passwordForm.resetFields(); message.success('密码修改成功，下次登录请使用新密码'); }
        catch (error) { passwordForm.setFields([{ name: 'oldPassword', errors: [error instanceof Error ? error.message : '修改失败，请重试'] }]); }
        finally { setSavingPassword(false); }
      }}>
        <Form.Item name="oldPassword" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}><Input.Password autoComplete="current-password" placeholder="请输入原密码" /></Form.Item>
        <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,32}$/, message: '请输入8–32位密码，包含字母和数字' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || value !== getFieldValue('oldPassword') ? Promise.resolve() : Promise.reject(new Error('新密码不能与原密码相同')); } })]} dependencies={['oldPassword']}><Input.Password autoComplete="new-password" maxLength={32} placeholder="8–32位，包含字母和数字" /></Form.Item>
        <Form.Item name="confirmPassword" label="确认新密码" dependencies={['newPassword']} rules={[{ required: true, message: '请再次输入新密码' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || value === getFieldValue('newPassword') ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致')); } })]}><Input.Password autoComplete="new-password" placeholder="请再次输入新密码" /></Form.Item>
      </Form>
    </Modal>
    <Modal title="编辑个人资料" open={editing} onCancel={() => setEditing(false)} okText="保存修改" cancelText="取消" centered onOk={() => form.submit()}>
      <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 24 }} onFinish={values => {
        try { updateProfile({ name: values.name.trim(), phone: values.phone.trim() }); setEditing(false); message.success('个人资料已保存'); }
        catch { message.error('保存失败，请重试'); }
      }}>
        <Form.Item name="name" label="姓名" rules={[{ required: true, whitespace: true, message: '请输入姓名' }, { max: 30, message: '姓名不能超过30个字符' }]}><Input maxLength={30} placeholder="请输入姓名" /></Form.Item>
        <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位手机号' }]}><Input maxLength={11} placeholder="请输入手机号" /></Form.Item>
      </Form>
    </Modal>
  </div></div>;
}
