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
        theme="light"
        width={260}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: '1px solid #f0f0f0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
        }}
        className="premium-sider"
      >
        <div className="logo-container">
          <CarOutlined className="logo-icon" />
          {!collapsed && <div className="logo-text">汽车数据平台</div>}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
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
            <Badge count={5} offset={[-2, 2]}>
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ fontSize: '18px', width: 40, height: 40, borderRadius: '50%' }}
              />
            </Badge>
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
        <TabBar />
        <Content
          style={{
            margin: '0 24px 24px',
            padding: 15,
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
