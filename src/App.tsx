import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ProductManagement from './pages/ProductManagement';
import RoleManagement from './pages/RoleManagement';
import { ConfigProvider } from 'antd';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
          fontFamily: "'Inter', sans-serif",
          colorBgContainer: '#ffffff',
          colorTextHeading: '#111827',
        },
        components: {
          Layout: {
            headerBg: 'rgba(255, 255, 255, 0.7)',
            siderBg: '#ffffff',
            bodyBg: '#f3f4f6',
          },
          Card: {
            headerFontSize: 16,
          },
          Menu: {
            itemBorderRadius: 8,
            itemColor: '#6b7280',
            itemHoverColor: '#4f46e5',
            itemSelectedColor: '#ffffff',
            itemSelectedBg: '#4f46e5',
            iconSize: 18,
          },
          Button: {
            controlHeight: 40,
            primaryShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="products" element={<ProductManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
