import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface TabItem {
  key: string;
  label: string;
  closable: boolean;
}

interface TabsContextType {
  tabs: TabItem[];
  activeKey: string;
  addTab: (tab: TabItem) => void;
  removeTab: (targetKey: string) => void;
  setActiveTab: (key: string) => void;
  closeOtherTabs: (currentKey: string) => void;
  closeAllTabs: () => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within TabsProvider');
  }
  return context;
};

interface TabsProviderProps {
  children: ReactNode;
}

// 路由配置映射
export const routeConfig: Record<string, { label: string; closable: boolean }> = {
  '/': { label: '首页', closable: false },
  '/users': { label: '用户管理', closable: true },
  '/roles': { label: '角色管理', closable: true },
  '/parts': { label: '配件管理', closable: true },
};

// localStorage 的 key
const TABS_STORAGE_KEY = 'app_tabs';
const ACTIVE_KEY_STORAGE_KEY = 'app_active_key';

export const TabsProvider = ({ children }: TabsProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 从 localStorage 加载保存的 tabs
  const getInitialTabs = (): TabItem[] => {
    try {
      const savedTabs = localStorage.getItem(TABS_STORAGE_KEY);
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        // 确保至少有首页 tab
        if (parsedTabs.length > 0) {
          return parsedTabs;
        }
      }
    } catch (error) {
      console.error('Failed to load tabs from localStorage:', error);
    }
    return [{ key: '/', label: '首页', closable: false }];
  };

  // 从 localStorage 加载保存的 activeKey
  const getInitialActiveKey = (): string => {
    try {
      const savedActiveKey = localStorage.getItem(ACTIVE_KEY_STORAGE_KEY);
      if (savedActiveKey) {
        return savedActiveKey;
      }
    } catch (error) {
      console.error('Failed to load activeKey from localStorage:', error);
    }
    return '/';
  };

  const [tabs, setTabs] = useState<TabItem[]>(getInitialTabs);
  const [activeKey, setActiveKey] = useState<string>(getInitialActiveKey);

  // 保存 tabs 到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    } catch (error) {
      console.error('Failed to save tabs to localStorage:', error);
    }
  }, [tabs]);

  // 保存 activeKey 到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_KEY_STORAGE_KEY, activeKey);
    } catch (error) {
      console.error('Failed to save activeKey to localStorage:', error);
    }
  }, [activeKey]);

  // 初始化时根据当前路由同步 tab 状态
  useEffect(() => {
    const currentPath = location.pathname;
    const config = routeConfig[currentPath];

    if (config) {
      // 检查当前路由的 tab 是否已存在
      setTabs((prevTabs) => {
        const exists = prevTabs.find((t) => t.key === currentPath);
        if (!exists) {
          return [...prevTabs, { key: currentPath, label: config.label, closable: config.closable }];
        }
        return prevTabs;
      });
      setActiveKey(currentPath);
    }
  }, []); // 只在组件挂载时执行一次

  const addTab = useCallback((tab: TabItem) => {
    setTabs((prevTabs) => {
      const exists = prevTabs.find((t) => t.key === tab.key);
      if (!exists) {
        return [...prevTabs, tab];
      }
      return prevTabs;
    });
    setActiveKey(tab.key);
    navigate(tab.key);
  }, [navigate]);

  const removeTab = useCallback((targetKey: string) => {
    setTabs((prevTabs) => {
      const targetIndex = prevTabs.findIndex((tab) => tab.key === targetKey);
      const newTabs = prevTabs.filter((tab) => tab.key !== targetKey);

      if (newTabs.length && targetKey === activeKey) {
        const newActiveKey = targetIndex === 0
          ? newTabs[0].key
          : newTabs[Math.min(targetIndex, newTabs.length - 1)].key;
        setActiveKey(newActiveKey);
        navigate(newActiveKey);
      }

      return newTabs;
    });
  }, [activeKey, navigate]);

  const setActiveTab = useCallback((key: string) => {
    setActiveKey(key);
    navigate(key);
  }, [navigate]);

  const closeOtherTabs = useCallback((currentKey: string) => {
    setTabs((prevTabs) => prevTabs.filter((tab) => tab.key === currentKey || !tab.closable));
    setActiveKey(currentKey);
    navigate(currentKey);
  }, [navigate]);

  const closeAllTabs = useCallback(() => {
    setTabs((prevTabs) => prevTabs.filter((tab) => !tab.closable));
    const homeTab = tabs.find((tab) => !tab.closable);
    if (homeTab) {
      setActiveKey(homeTab.key);
      navigate(homeTab.key);
    }
  }, [tabs, navigate]);

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeKey,
        addTab,
        removeTab,
        setActiveTab,
        closeOtherTabs,
        closeAllTabs,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
};
