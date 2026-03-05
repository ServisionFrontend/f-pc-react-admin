import { useRef, useState, useEffect } from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useTabsContext } from '../contexts/TabsContext';

const TabBar = () => {
  const { tabs, activeKey, removeTab, setActiveTab, closeOtherTabs } = useTabsContext();
  const [setContextMenuTab] = useState<string>('');
  const tabBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 自动滚动到激活的tab
    if (tabBarRef.current) {
      const activeTabElement = tabBarRef.current.querySelector(`[data-tab-key="${activeKey}"]`) as HTMLElement;
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeKey]);

  const getContextMenuItems = (tabKey: string): MenuProps['items'] => {
    const tab = tabs.find((t) => t.key === tabKey);
    const hasOtherClosableTabs = tabs.some((t) => t.closable && t.key !== tabKey);

    return [
      {
        key: 'close',
        label: '关闭当前',
        disabled: !tab?.closable,
        onClick: () => removeTab(tabKey),
      },
      {
        key: 'closeOthers',
        label: '关闭其他',
        disabled: !hasOtherClosableTabs,
        onClick: () => closeOtherTabs(tabKey),
      },
    ];
  };

  const handleTabClick = (key: string) => {
    setActiveTab(key);
  };

  const handleTabClose = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    removeTab(key);
  };

  return (
    <div className="tab-bar-container" ref={tabBarRef}>
      <div className="tab-bar-scroll">
        {tabs.map((tab) => (
          <Dropdown
            key={tab.key}
            menu={{ items: getContextMenuItems(tab.key) }}
            trigger={['contextMenu']}
            onOpenChange={(open) => open && setContextMenuTab(tab.key)}
          >
            <div
              data-tab-key={tab.key}
              className={`tab-item ${activeKey === tab.key ? 'tab-item-active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
            >
              <span className="tab-label">{tab.label}</span>
              {tab.closable && (
                <CloseOutlined
                  className="tab-close-icon"
                  onClick={(e) => handleTabClose(e, tab.key)}
                />
              )}
            </div>
          </Dropdown>
        ))}
      </div>
    </div>
  );
};

export default TabBar;
