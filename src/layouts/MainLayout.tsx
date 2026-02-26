import { useState } from 'react';
import { Layout, Menu, Button, Avatar, Space, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/roles',
      icon: <UserOutlined />, // or another icon like TeamOutlined
      label: '角色管理',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '产品管理',
    },
    {
      key: '/parts',
      icon: <ToolOutlined />,
      label: '配件管理',
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: '系统设置',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={260}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: '1px solid #f3f4f6',
        }}
        className="premium-sider"
      >
        <div className="logo-container">
          <div className="logo-text">{collapsed ? 'EPIS' : 'EPIS'}</div>
        </div>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, padding: '16px 0' }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)' }}>
        <Header className="ant-layout-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '18px', width: 48, height: 48, borderRadius: 12 }}
          />
          <Space size={24}>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: '18px', width: 40, height: 40, borderRadius: '50%' }}
            />
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px', borderRadius: 8, transition: 'all 0.3s' }} className="user-dropdown">
                <Avatar size={40} src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" style={{ border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>管理员</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Super Admin</span>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 0,
            minHeight: 280,
            overflow: 'initial',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
