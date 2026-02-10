import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ProductManagement from './pages/ProductManagement';
import RoleManagement from './pages/RoleManagement';
import PartsManagement from './pages/PartsManagement';
import { ConfigProvider } from 'antd';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 6,
          fontFamily: "'Inter', sans-serif",
          colorBgContainer: '#ffffff',
          colorTextHeading: '#111827',
          fontSize: 13,
          controlHeight: 28,
          controlHeightLG: 32,
          controlHeightSM: 24,
          padding: 12,
          paddingLG: 16,
          paddingSM: 8,
          paddingXS: 4,
          margin: 12,
          marginLG: 16,
          marginSM: 8,
          marginXS: 4,
        },
        components: {
          Layout: {
            headerBg: 'rgba(255, 255, 255, 0.7)',
            siderBg: '#ffffff',
            bodyBg: '#f3f4f6',
          },
          Card: {
            headerFontSize: 14,
            paddingLG: 16,
          },
          Menu: {
            itemBorderRadius: 6,
            itemColor: '#6b7280',
            itemHoverColor: '#4f46e5',
            itemSelectedColor: '#ffffff',
            itemSelectedBg: '#4f46e5',
            iconSize: 16,
            itemHeight: 36,
            itemMarginBlock: 2,
            itemMarginInline: 8,
          },
          Button: {
            controlHeight: 28,
            controlHeightLG: 32,
            controlHeightSM: 24,
            paddingInline: 12,
            primaryShadow: '0 2px 8px 0 rgba(79, 70, 229, 0.25)',
          },
          Input: {
            controlHeight: 28,
            paddingBlock: 4,
            paddingInline: 8,
          },
          Select: {
            controlHeight: 28,
          },
          InputNumber: {
            controlHeight: 28,
          },
          DatePicker: {
            controlHeight: 28,
          },
          Table: {
            cellPaddingBlock: 8,
            cellPaddingInline: 12,
            headerBg: '#fafafa',
            rowHoverBg: '#f5f5f5',
            cellFontSize: 13,
          },
          Form: {
            itemMarginBottom: 12,
            labelFontSize: 13,
          },
          Modal: {
            paddingLG: 16,
            paddingContentHorizontalLG: 20,
          },
          Pagination: {
            itemSize: 28,
            itemSizeSM: 24,
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
            <Route path="parts" element={<PartsManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
