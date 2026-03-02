import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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

export const TabsProvider = ({ children }: TabsProviderProps) => {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/', label: '仪表盘', closable: false }
  ]);
  const [activeKey, setActiveKey] = useState<string>('/');

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
