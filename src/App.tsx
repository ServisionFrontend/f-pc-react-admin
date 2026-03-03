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
          borderRadius: 2,
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          colorBgContainer: '#ffffff',
          colorTextHeading: '#1f2937',
          fontSize: 12,
          controlHeight: 24,
          controlHeightLG: 32,
          controlHeightSM: 20,
          padding: 8,
          paddingLG: 12,
          paddingSM: 4,
          paddingXS: 2,
          margin: 8,
          marginLG: 12,
          marginSM: 4,
          marginXS: 2,
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
            headerFontSize: 13,
            paddingLG: 12,
            borderRadiusLG: 4,
          },
          Menu: {
            darkItemBg: '#1e2227',
            darkItemSelectedBg: '#4E5358',
            darkItemColor: '#abb2bf',
            darkItemSelectedColor: '#ffffff',
            itemBorderRadius: 2,
            itemMarginInline: 4,
            itemMarginBlock: 2,
            itemHeight: 32,
            iconSize: 16,
          },
          Button: {
            controlHeight: 24,
            paddingInline: 8,
            borderRadius: 2,
          },
          Tabs: {
            cardHeight: 24,
            horizontalMargin: '0 0 8px 0',
          },
          Table: {
            cellPaddingBlock: 4,
            cellPaddingInline: 8,
            headerBg: '#f1f5f9',
            rowHoverBg: '#f8fafc',
            cellFontSize: 12,
          },
          Form: {
            itemMarginBottom: 8,
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
