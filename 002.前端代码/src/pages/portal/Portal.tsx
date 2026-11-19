import PortalIcon from '../../components/PortalIcon';
import { useState } from 'react';
import { Button, Card, Descriptions, Tag, Modal, Avatar, Form, Input, message } from 'antd';
import { HomeOutlined, EditOutlined, UserOutlined, ApartmentOutlined, MedicineBoxOutlined, RobotOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './portal.css';

const applications = [
  { title: '医保智慧服务平台', icon: <PortalIcon kind="hospital" />, color: '#176587', description: '承载现有医保业务系统的统一访问和业务办理', intro: '日常医保业务办理统一入口', tags: ['业务办理', '医疗监管'], features: ['定点医疗机构康复理疗和中医治疗监管系统', '医疗业务后台管理系统', '公务员医疗补助管理系统', '代配药监管系统', '浦东医保业务管理系统', '就业保障平台子模块'] },
  { title: '医保综合智能体平台', icon: <PortalIcon kind="robot" />, color: '#4266e9', description: '提供医保数据分析、业务辅助审核和智能监管能力', intro: '医小保智能分析监管入口', tags: ['数据分析', '智能审核', '智能监管'], features: ['医保数据分析智能体', '医保经办智能审核智能体', '长护险监管智能体', '集采计划执行进度跟踪智能体'], available: true },
  { title: '用户管理平台', icon: <ApartmentOutlined />, color: '#448c87', description: '用于管理组织、用户、角色及应用访问权限', intro: '用户、角色、应用及系统配置统一管理入口', tags: ['组织管理', '访问权限'], features: ['用户管理', '角色设置', '权限设置'] },
];
export default function Portal() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const serviceOnly = new URLSearchParams(window.location.search).get('system') === 'service';
  return <div className="portal-page portal-home">
    <div className="portal-skyline" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{height:`${45+(i*47)%140}px`}} />)}</div>
    <header className="portal-intro"><h1>应用中心</h1><p>请选择需要进入的平台</p></header>
    <div className="portal-grid">{applications.slice(0,serviceOnly?1:2).map((app,index)=><Card key={app.title} className="portal-card">
      {!app.available&&<span className="portal-unavailable">暂未开放</span>}
      <div className="portal-icon" style={{background:index?'#5358d9':'#12649e',color:'#fff'}}>{app.icon}</div>
      <h2>{index?'医保数据治理与一体化应用平台':app.title}</h2>
      <p className="portal-description">{app.intro}</p>
      <Button block size="large" type={app.available?'primary':'default'} disabled={!app.available} onClick={()=>navigate('/app/home/overview')}>进入平台 <ArrowRightOutlined /></Button>
    </Card>)}</div>
    {!serviceOnly&&currentUser?.roles.includes('信息科管理员')&&<section className="portal-management">
      <div className="portal-management-icon"><PortalIcon kind="users" /></div><div className="portal-management-copy"><h2>用户管理平台</h2><p>用户、角色、应用及系统配置统一管理入口</p></div>
      <span className="portal-management-status">暂未开放</span><Button disabled>进入平台 <ArrowRightOutlined /></Button>
    </section>}
    <footer className="portal-footer">© 浦东新区医保综合应用门户</footer>
  </div>;
}
export function PersonalCenter() {
  const navigate = useNavigate();
  const { currentUser: user, updateProfile, changePassword } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  return <div className="portal-page profile-page"><div className="profile-container">
    <header className="profile-heading"><div><h1>个人中心</h1><p>管理个人资料，查看账户信息</p></div><Button className="profile-back-portal" icon={<HomeOutlined />} onClick={() => navigate('/portal')}>返回门户</Button></header>
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
