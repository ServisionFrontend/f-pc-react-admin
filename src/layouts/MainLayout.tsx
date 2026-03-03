import { useState } from 'react';
import { Layout, Menu, Button, Avatar, Space, Dropdown, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  ToolOutlined,
  TeamOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useLocation, Outlet } from 'react-router-dom';
import { useTabsContext, routeConfig } from '../contexts/TabsContext';
import TabBar from '../components/TabBar';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { addTab } = useTabsContext();

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '首页',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/roles',
      icon: <TeamOutlined />,
      label: '角色管理',
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

  const handleMenuClick = ({ key }: { key: string }) => {
    const config = routeConfig[key];
    if (config) {
      addTab({
        key,
        label: config.label,
        closable: config.closable,
      });
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
        className="premium-sider"
      >
        <div className="logo-container">
          <CarOutlined className="logo-icon" />
          {!collapsed && <div className="logo-text">EPIS</div>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, padding: '8px 0' }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)' }}>
        <Header className="ant-layout-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '14px', width: 28, height: 28, borderRadius: 2 }}
          />
          <Space size={12}>

            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '2px 6px', borderRadius: 2, transition: 'all 0.3s' }} className="user-dropdown">
                <Avatar size={24} src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" style={{ border: '1px solid #f0f0f0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.0 }}>
                  <span style={{ fontWeight: 600, fontSize: 12, color: '#1f2937' }}>管理员</span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Super Admin</span>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <TabBar />
        <Content
          style={{
            margin: '12px 16px 16px',
            padding: 0,
            minHeight: 280,
            overflow: 'initial',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
