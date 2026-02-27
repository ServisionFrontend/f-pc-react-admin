import React, { useState, useEffect, useRef, useCallback, ReactNode, useMemo, Children } from 'react';
import { Table, Dropdown, Checkbox, Space, Popconfirm, Button } from 'antd';
import type { TableProps } from 'antd/es/table';
import { AppstoreOutlined, LockOutlined, UnlockOutlined, CaretDownOutlined, ArrowUpOutlined, ArrowDownOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSvCrudContext } from './context';
import { SvItemProps } from './SvItem';

// 列宽调整上下文
interface ResizeContextType {
    startResize: (dataIndex: string, startX: number, startWidth: number) => void;
    allColumns: { dataIndex: string; title: string }[];
    hiddenColumns: string[];
    frozenColumns: string[];
    toggleColumnVisibility: (dataIndex: string) => void;
    freezeColumn: (dataIndex: string) => void;
    unfreezeColumn: (dataIndex: string) => void;
    moveColumn: (dragKey: string, dropKey: string, position: "left" | "right") => void;
}
const ResizeContext = React.createContext<ResizeContextType | null>(null);

// 可调整列宽的表头组件 - 使用原生鼠标事件 + 列头下拉菜单
const ResizableTitle = (props: any) => {
    // 从 props 中提取 onClick（antd 排序用），不传给 th，而是仅传给内容区域
    const { onResize, width, dataIndex, onClick: sortOnClick, title, ...restProps } = props;
    const resizeContext = React.useContext(ResizeContext);

    if (!width || !dataIndex) {
        return <th {...restProps} onClick={sortOnClick} />;
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizeContext?.startResize(dataIndex, e.clientX, width);
    };

    const showDropdown = dataIndex !== "operation" && dataIndex !== "action";
    const isFrozen = resizeContext?.frozenColumns.includes(dataIndex) ?? false;

    const handleMenuClick = (info: any) => {
        if (info.key.startsWith("col-")) {
            const colKey = info.key.replace("col-", "");
            resizeContext?.toggleColumnVisibility(colKey);
        } else if (info.key === "freeze") {
            resizeContext?.freezeColumn(dataIndex);
        } else if (info.key === "unfreeze") {
            resizeContext?.unfreezeColumn(dataIndex);
        }
    };

    const dropdownMenuItems = showDropdown && resizeContext ? [
        {
            key: "columns",
            label: "列",
            icon: <AppstoreOutlined />,
            children: resizeContext.allColumns.map((col) => ({
                key: `col-${col.dataIndex}`,
                label: (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={(e) => { e.stopPropagation(); resizeContext?.toggleColumnVisibility(col.dataIndex); }}>
                        <Checkbox checked={!resizeContext.hiddenColumns.includes(col.dataIndex)} style={{ pointerEvents: "none" }} />
                        <span>{col.title}</span>
                    </div>
                ),
            })),
        },
        {
            key: "freeze",
            label: "冻结列",
            icon: <LockOutlined />,
            disabled: isFrozen,
        },
        {
            key: "unfreeze",
            label: "解冻列",
            icon: <UnlockOutlined />,
            disabled: !isFrozen,
        },
    ] : [];

    const isOperation = dataIndex === "operation" || dataIndex === "action";
    const draggable = !isFrozen && !isOperation;

    const handleDragStart = (e: React.DragEvent<HTMLElement>) => {
        if (!draggable) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("sourceDataIndex", dataIndex);
        e.dataTransfer.effectAllowed = "move";

        const titleText = resizeContext?.allColumns.find((c) => c.dataIndex === dataIndex)?.title || "列";
        const dragGhost = document.createElement("div");
        dragGhost.id = "custom-drag-ghost";
        dragGhost.style.position = "absolute";
        dragGhost.style.top = "-1000px";
        dragGhost.style.left = "-1000px";
        dragGhost.style.backgroundColor = "#fff";
        dragGhost.style.border = "1px solid #c0c0c0";
        dragGhost.style.padding = "4px 8px";
        dragGhost.style.boxShadow = "1px 1px 3px rgba(0,0,0,0.1)";
        dragGhost.style.display = "inline-flex";
        dragGhost.style.alignItems = "center";
        dragGhost.style.gap = "6px";
        dragGhost.style.fontSize = "12px";
        dragGhost.style.color = "#333";
        dragGhost.style.zIndex = "-9999";
        dragGhost.style.whiteSpace = "nowrap";
        dragGhost.innerHTML = `
            <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #6E3DEB; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
                ✓
            </div>
            <span>${titleText}</span>
        `;
        document.body.appendChild(dragGhost);
        e.dataTransfer.setDragImage(dragGhost, 15, 15);

        setTimeout(() => {
            if (e.target instanceof HTMLElement) {
                e.target.classList.add("dragging-column");
            }
            document.body.classList.add("is-dragging-column");
            if (document.body.contains(dragGhost)) {
                document.body.removeChild(dragGhost);
            }
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLElement>) => {
        if (e.target instanceof HTMLElement) {
            e.target.classList.remove("dragging-column");
        }
        document.body.classList.remove("is-dragging-column");
    };

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        if (!draggable) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        const th = e.currentTarget;
        const rect = th.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) {
            th.classList.remove("drag-over-right");
            th.classList.add("drag-over-left");
        } else {
            th.classList.remove("drag-over-left");
            th.classList.add("drag-over-right");
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
        const th = e.currentTarget;
        th.classList.remove("drag-over-left", "drag-over-right");
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        const th = e.currentTarget;
        const isLeft = th.classList.contains("drag-over-left");
        th.classList.remove("drag-over-left", "drag-over-right");

        if (!draggable) return;
        const sourceDataIndex = e.dataTransfer.getData("sourceDataIndex");
        if (sourceDataIndex && sourceDataIndex !== dataIndex) {
            resizeContext?.moveColumn(sourceDataIndex, dataIndex, isLeft ? "left" : "right");
        }
    };

    return (
        <th
            {...restProps}
            style={{ ...(restProps.style || {}) }}
            draggable={draggable}
            onDragStart={draggable ? handleDragStart : undefined}
            onDragEnd={draggable ? handleDragEnd : undefined}
            onDragOver={draggable ? handleDragOver : undefined}
            onDragLeave={draggable ? handleDragLeave : undefined}
            onDrop={draggable ? handleDrop : undefined}
        >
            <div className="drag-indicator drag-indicator-left">
                <ArrowDownOutlined className="drag-indicator-icon" style={{ transform: "translateY(-10px)" }} />
                <ArrowUpOutlined className="drag-indicator-icon" style={{ transform: "translateY(10px)" }} />
            </div>
            <div className="drag-indicator drag-indicator-right">
                <ArrowDownOutlined className="drag-indicator-icon" style={{ transform: "translateY(-10px)" }} />
                <ArrowUpOutlined className="drag-indicator-icon" style={{ transform: "translateY(10px)" }} />
            </div>
            <div className="column-header-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div className="column-header-content" onClick={sortOnClick} style={{ flex: 1, minWidth: 0, marginRight: "25px" }}>
                    {restProps.children}
                </div>
                {showDropdown && (
                    <div
                        className="dropdown-event-blocker"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", position: "absolute", right: 0, top: 0, zIndex: 10, width: "25px", height: "100%" }}
                    >
                        <Dropdown menu={{ items: dropdownMenuItems, onClick: handleMenuClick }} trigger={["click"]} destroyPopupOnHide>
                            <div className="column-header-dropdown-wrapper" style={{ width: "100%", height: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                                <span className="column-header-divider" />
                                <span className="column-header-dropdown-trigger">
                                    <CaretDownOutlined />
                                </span>
                            </div>
                        </Dropdown>
                    </div>
                )}
            </div>
            <span className="column-resize-handle" onMouseDown={handleMouseDown} onClick={(e) => e.stopPropagation()} />
        </th>
    );
};

export interface SvTableProps extends TableProps<any> {
}

const SvTable: React.FC<SvTableProps> = (props) => {
    const svContext = useSvCrudContext();

    const dataSource = props.dataSource !== undefined ? props.dataSource : svContext?.data;
    const loading = props.loading !== undefined ? props.loading : svContext?.loading;
    const pagination = props.pagination !== undefined ? props.pagination : svContext?.pagination;
    const onChange = props.onChange || svContext?.handleTableChange;

    let baseColumns = props.columns || [];

    // Parse columns from children if no columns prop is provided
    if (baseColumns.length === 0 && props.children) {
        const items = Children.map(props.children, (child) => {
            if (React.isValidElement(child)) {
                return child.props as SvItemProps;
            }
            return null;
        })?.filter(Boolean) as SvItemProps[];

        baseColumns = items.map((item) => ({
            title: item.label,
            dataIndex: item.name,
            key: item.name,
            width: item.width,
            render: item.render ? item.render : (text: any) => {
                if (item.type === 'date' && item.format) {
                    return text; // Date format logic can be applied here
                }
                return text;
            }
        }));

        // Append Action Column if needed and context is available
        if (svContext) {
            baseColumns.push({
                title: '操作',
                key: 'action',
                dataIndex: 'action',
                width: 150,
                render: (_: any, record: any) => (
                    <Space size="small">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            style={{ color: '#4f46e5' }}
                            onClick={() => svContext.openEditModal(record)}
                        />
                        <Popconfirm title="确定删除吗?" onConfirm={() => svContext.deleteItem(record.id || record.key)}>
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                ),
            });
        }
    }

    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(() => {
        const initialWidths: { [key: string]: number } = {};
        baseColumns.forEach(col => {
            const key = (col as any).dataIndex || col.key;
            if (key && col.width) {
                initialWidths[key] = typeof col.width === 'number' ? col.width : parseInt(String(col.width).replace('px', '')) || 150;
            }
        });
        return initialWidths;
    });

    const [columnOrder, setColumnOrder] = useState<string[]>(() => {
        return baseColumns.map(col => (col as any).dataIndex || col.key).filter(Boolean) as string[];
    });

    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const [frozenColumns, setFrozenColumns] = useState<string[]>([]);

    const toggleColumnVisibility = useCallback((colDataIndex: string) => {
        setHiddenColumns((prev) => prev.includes(colDataIndex) ? prev.filter((c) => c !== colDataIndex) : [...prev, colDataIndex]);
    }, []);

    const freezeColumn = useCallback((colDataIndex: string) => {
        setFrozenColumns((prev) => prev.includes(colDataIndex) ? prev : [...prev, colDataIndex]);
    }, []);

    const unfreezeColumn = useCallback((colDataIndex: string) => {
        setFrozenColumns((prev) => prev.filter((c) => c !== colDataIndex));
    }, []);

    const moveColumn = useCallback((dragKey: string, dropKey: string, position: "left" | "right") => {
        setColumnOrder((prev) => {
            let currentOrder = prev;
            if (currentOrder.length === 0) {
                currentOrder = baseColumns.map(col => (col as any).dataIndex || col.key).filter(Boolean) as string[];
            }

            const dragIndex = currentOrder.indexOf(dragKey);
            const dropIndex = currentOrder.indexOf(dropKey);
            if (dragIndex === -1 || dropIndex === -1 || dragIndex === dropIndex) return currentOrder;

            const newOrder = [...currentOrder];
            const [draggedItem] = newOrder.splice(dragIndex, 1);

            let targetIndex = newOrder.indexOf(dropKey);
            if (position === "right") targetIndex += 1;
            newOrder.splice(targetIndex, 0, draggedItem);
            return newOrder;
        });
    }, [baseColumns]);

    const tableContainerRef = useRef<HTMLDivElement | null>(null);

    const resizingRef = useRef<{ dataIndex: string; startX: number; startWidth: number; } | null>(null);
    const resizeIndicatorRef = useRef<HTMLDivElement | null>(null);
    const resizeHandleOverlayRef = useRef<HTMLDivElement | null>(null);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingRef.current) return;
        const { startX, startWidth } = resizingRef.current;
        const diff = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + diff);
        const effectiveDiff = newWidth - startWidth;
        const indicatorLeft = startX + effectiveDiff;
        if (resizeIndicatorRef.current) {
            resizeIndicatorRef.current.style.left = `${indicatorLeft}px`;
        }
    }, []);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (resizingRef.current) {
            const { startX, startWidth, dataIndex } = resizingRef.current;
            const diff = e.clientX - startX;
            const newWidth = Math.max(50, startWidth + diff);
            setColumnWidths(prev => ({ ...prev, [dataIndex]: newWidth }));
        }
        resizingRef.current = null;
        if (resizeIndicatorRef.current) {
            resizeIndicatorRef.current.remove();
            resizeIndicatorRef.current = null;
        }
        if (resizeHandleOverlayRef.current) {
            resizeHandleOverlayRef.current.remove();
            resizeHandleOverlayRef.current = null;
        }
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    }, [handleMouseMove]);

    const startResize = useCallback((dataIndex: string, startX: number, startWidth: number) => {
        resizingRef.current = { dataIndex, startX, startWidth };
        const tableContainer = tableContainerRef.current;
        const tableEl = tableContainer?.querySelector(".ant-table");
        let top = 0;
        let height = window.innerHeight;
        if (tableEl) {
            const rect = tableEl.getBoundingClientRect();
            top = rect.top;
            height = rect.height;
            const tableBody = tableContainer?.querySelector(".ant-table-body");
            if (tableBody instanceof HTMLElement) {
                height -= tableBody.offsetHeight - tableBody.clientHeight;
            }
        }

        const indicator = document.createElement("div");
        indicator.className = "column-resize-indicator";
        indicator.style.cssText = `position: fixed; top: ${top}px; height: ${height}px; width: 2px; background: var(--primary-color, #4f46e5); z-index: 99999; pointer-events: none; left: ${startX}px;`;
        document.body.appendChild(indicator);
        resizeIndicatorRef.current = indicator;

        const handleOverlay = document.createElement("div");
        handleOverlay.className = "column-resize-overlay";
        handleOverlay.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9998; cursor: col-resize;`;
        document.body.appendChild(handleOverlay);
        resizeHandleOverlayRef.current = handleOverlay;

        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }, [handleMouseMove, handleMouseUp]);

    useEffect(() => {
        return () => {
            if (resizeIndicatorRef.current) resizeIndicatorRef.current.remove();
            if (resizeHandleOverlayRef.current) resizeHandleOverlayRef.current.remove();
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const allColumnsConfig = useMemo(() => {
        return baseColumns.map(col => {
            const key = (col as any).dataIndex || col.key;
            let titleStr = "列";
            if (typeof col.title === 'string') {
                titleStr = col.title;
            }
            return { dataIndex: key, title: titleStr };
        }).filter(c => c.dataIndex);
    }, [baseColumns]);

    const resizeContextValue = useMemo(() => ({
        startResize,
        allColumns: allColumnsConfig,
        hiddenColumns,
        frozenColumns,
        toggleColumnVisibility,
        freezeColumn,
        unfreezeColumn,
        moveColumn,
    }), [startResize, allColumnsConfig, hiddenColumns, frozenColumns, toggleColumnVisibility, freezeColumn, unfreezeColumn, moveColumn]);

    // Apply column customizations
    let processedColumns = baseColumns
        .filter(col => {
            const key = (col as any).dataIndex || col.key;
            return !hiddenColumns.includes(key);
        })
        .map(col => {
            const key = (col as any).dataIndex || col.key;
            const isFrozen = frozenColumns.includes(key);
            const isAction = key === 'operation' || key === 'action';

            let fixedProp = col.fixed;
            if (!fixedProp) {
                if (isAction) fixedProp = "end";
                else if (isFrozen) fixedProp = "start";
            }

            return {
                ...col,
                width: columnWidths[key] || col.width || 120,
                fixed: fixedProp,
                onHeaderCell: (column: any) => ({
                    ...((col as any).onHeaderCell?.(column) || {}),
                    width: columnWidths[key] || column.width || 120,
                    dataIndex: key,
                }),
            };
        });

    // Sort by columnOrder if there is one
    if (columnOrder.length > 0) {
        processedColumns = processedColumns.sort((a: any, b: any) => {
            const aKey = a.dataIndex || a.key;
            const bKey = b.dataIndex || b.key;
            const aIndex = columnOrder.indexOf(aKey);
            const bIndex = columnOrder.indexOf(bKey);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
    }

    // Sort frozen columns to start and action to end
    processedColumns = processedColumns.sort((a: any, b: any) => {
        if (a.fixed === 'end' && b.fixed !== 'end') return 1;
        if (a.fixed !== 'end' && b.fixed === 'end') return -1;
        if (a.fixed === 'start' && b.fixed !== 'start') return -1;
        if (a.fixed !== 'start' && b.fixed === 'start') return 1;
        return 0;
    });

    const components = {
        ...props.components,
        header: {
            ...(props.components?.header || {}),
            cell: ResizableTitle,
        }
    };

    return (
        <div ref={tableContainerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <style>{`
                .full-height-table .ant-table-column-sorter { opacity: 0; transition: opacity 0.3s; }
                .full-height-table .ant-table-column-sort .ant-table-column-sorter { opacity: 1; }
                .dragging-column { opacity: 0.5; }
                th.drag-over-left, th.drag-over-right { overflow: visible !important; }
                .drag-indicator { position: absolute; top: -4px; bottom: -4px; width: 12px; z-index: 9999; pointer-events: none; display: none; flex-direction: column; align-items: center; justify-content: space-between; }
                .drag-indicator-left { left: -6px; }
                .drag-indicator-right { right: -6px; }
                .drag-indicator-icon { color: #6E3DEB; font-size: 14px; line-height: 1; }
                th.drag-over-left .drag-indicator-left { display: flex; }
                th.drag-over-right .drag-indicator-right { display: flex; }
                body.is-dragging-column .full-height-table th * { pointer-events: none !important; }
                body.is-dragging-column .full-height-table .ant-table-header, body.is-dragging-column .full-height-table .ant-table-container { overflow: visible !important; }
                .column-header-divider { position: absolute; left: 0; top: 0px; bottom: 0px; width: 0.6667px; background-color: rgb(229, 231, 235); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
                .full-height-table th:hover .column-header-divider, .column-header-dropdown-wrapper.ant-dropdown-open .column-header-divider { opacity: 1; }
                .column-header-wrapper { display: flex; align-items: center; width: 100%; }
                .column-header-dropdown-wrapper { display: inline-flex; align-items: center; flex-shrink: 0; }
                .column-header-content { flex: 1; overflow: hidden; min-width: 0; }
                .column-header-dropdown-trigger { display: inline-flex; align-items: center; flex-shrink: 0; opacity: 0; transition: opacity 0.3s; cursor: pointer; font-size: 10px; color: #8c8c8c; padding: 2px 4px; line-height: 1; border-radius: 2px; }
                .column-header-dropdown-trigger:hover { color: #1890ff; background: rgba(24, 144, 255, 0.06); }
                .full-height-table th:hover .column-header-dropdown-trigger { opacity: 1; }
                .column-header-dropdown-trigger.ant-dropdown-open, .ant-dropdown-open .column-header-dropdown-trigger, .column-header-dropdown-wrapper.ant-dropdown-open .column-header-dropdown-trigger { opacity: 1; }
                .full-height-table th.ant-table-cell { position: relative; overflow: hidden; }
                .column-resize-handle { position: absolute; right: -5px; top: 0; bottom: 0; width: 10px; cursor: col-resize; z-index: 100; opacity: 0; }
                .column-resize-handle:hover { opacity: 1; }
            `}</style>
            <ResizeContext.Provider value={resizeContextValue}>
                <Table
                    className={`full-height-table ${props.className || ''}`}
                    showSorterTooltip={false}
                    {...props}
                    dataSource={dataSource}
                    loading={loading}
                    pagination={pagination}
                    onChange={onChange}
                    columns={processedColumns}
                    components={components}
                />
            </ResizeContext.Provider>
        </div>
    );
};

export default SvTable;
