import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import PartsManagement from './pages/PartsManagement';
import { ConfigProvider, App as AntdApp } from 'antd';
import { TabsProvider } from './contexts/TabsContext';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4E5358',
          borderRadius: 4,
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          colorBgContainer: '#ffffff',
          colorTextHeading: '#1f2937',
          fontSize: 13,
          controlHeight: 32,
          controlHeightLG: 36,
          controlHeightSM: 24,
          padding: 10,
          paddingLG: 16,
          paddingSM: 6,
          paddingXS: 4,
          margin: 10,
          marginLG: 16,
          marginSM: 6,
          marginXS: 4,
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            headerHeight: 40,
            headerPadding: '0 12px',
            siderBg: '#1e2227',
            bodyBg: '#f8fafc',
          },
          Card: {
            headerFontSize: 14,
            paddingLG: 16,
            borderRadiusLG: 6,
          },
          Menu: {
            darkItemBg: '#1e2227',
            darkItemSelectedBg: '#4E5358',
            darkItemColor: '#abb2bf',
            darkItemSelectedColor: '#ffffff',
            itemBorderRadius: 4,
            itemMarginInline: 4,
            itemMarginBlock: 2,
            itemHeight: 36,
            iconSize: 18,
          },
          Button: {
            controlHeight: 32,
            paddingInline: 12,
            borderRadius: 4,
            fontWeight: 500,
          },
          Tabs: {
            cardHeight: 26,
            horizontalMargin: '0 0 8px 0',
          },
          Table: {
            cellPaddingBlock: 8,
            cellPaddingInline: 12,
            headerBg: '#fafafa',
            rowHoverBg: '#f9fafb',
            cellFontSize: 13,
            headerColor: '#374151',
            borderColor: '#e5e7eb',
          },
          Form: {
            itemMarginBottom: 12,
            labelFontSize: 13,
          },
          Input: {
            controlHeight: 32,
            paddingBlock: 6,
            paddingInline: 10,
            borderRadius: 4,
          },
          Select: {
            controlHeight: 32,
            borderRadius: 4,
          },
          InputNumber: {
            controlHeight: 32,
            borderRadius: 4,
          },
          DatePicker: {
            controlHeight: 32,
            borderRadius: 4,
          },
          Modal: {
            paddingLG: 16,
            paddingContentHorizontalLG: 20,
            borderRadiusLG: 6,
          },
          Pagination: {
            itemSize: 28,
            itemSizeSM: 24,
            borderRadius: 4,
          },
        },
      }}
    >
      <AntdApp style={{ height: '100%' }}>
        <BrowserRouter>
          <TabsProvider>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="roles" element={<RoleManagement />} />
                <Route path="parts" element={<PartsManagement />} />
              </Route>
            </Routes>
          </TabsProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
