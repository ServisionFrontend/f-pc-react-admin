import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table, Button, Space, Input, InputNumber, Select, Tag, Popconfirm, Form, message, Row, Col, Tooltip, Modal, Dropdown, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, SearchOutlined, ReloadOutlined, DownOutlined, UpOutlined, LockOutlined, UnlockOutlined, AppstoreOutlined, CaretDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import partsService, { Part } from '../services/partsService';

// 所有可切换列的定义
const ALL_COLUMN_DEFS = [
    { dataIndex: 'partNo', title: '配件编号' },
    { dataIndex: 'partName', title: '配件名称' },
    { dataIndex: 'partNameEn', title: '英文名称' },
    { dataIndex: 'size', title: '尺寸' },
    { dataIndex: 'section', title: '科组' },
    { dataIndex: 'quantity', title: '用量' },
    { dataIndex: 'status', title: '状态' },
    { dataIndex: 'remark', title: '备注' },
];

// 列宽调整上下文
interface ResizeContextType {
    startResize: (dataIndex: string, startX: number, startWidth: number) => void;
    allColumns: { dataIndex: string; title: string }[];
    hiddenColumns: string[];
    frozenColumns: string[];
    toggleColumnVisibility: (dataIndex: string) => void;
    freezeColumn: (dataIndex: string) => void;
    unfreezeColumn: (dataIndex: string) => void;
}
const ResizeContext = React.createContext<ResizeContextType | null>(null);

// 可调整列宽的表头组件 - 使用原生鼠标事件 + 列头下拉菜单
const ResizableTitle = (props: any) => {
    // 从 props 中提取 onClick（antd 排序用），不传给 th，而是仅传给内容区域
    const { onResize, width, dataIndex, onClick: sortOnClick, ...restProps } = props;
    const resizeContext = React.useContext(ResizeContext);

    if (!width || !dataIndex) {
        return <th {...restProps} onClick={sortOnClick} />;
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizeContext?.startResize(dataIndex, e.clientX, width);
    };

    // 操作列不显示下拉菜单
    const showDropdown = dataIndex !== 'operation';
    const isFrozen = resizeContext?.frozenColumns.includes(dataIndex) ?? false;

    const handleMenuClick = (info: any) => {
        if (info.key.startsWith('col-')) {
            const colKey = info.key.replace('col-', '');
            resizeContext?.toggleColumnVisibility(colKey);
        } else if (info.key === 'freeze') {
            resizeContext?.freezeColumn(dataIndex);
        } else if (info.key === 'unfreeze') {
            resizeContext?.unfreezeColumn(dataIndex);
        }
    };

    const dropdownMenuItems = showDropdown && resizeContext ? [
        {
            key: 'columns',
            label: '列',
            icon: <AppstoreOutlined />,
            children: resizeContext.allColumns.map(col => ({
                key: `col-${col.dataIndex}`,
                label: (
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            resizeContext?.toggleColumnVisibility(col.dataIndex);
                        }}
                    >
                        <Checkbox
                            checked={!resizeContext.hiddenColumns.includes(col.dataIndex)}
                            style={{ pointerEvents: 'none' }}
                        />
                        <span>{col.title}</span>
                    </div>
                ),
            })),
        },
        {
            key: 'freeze',
            label: '冻结列',
            icon: <LockOutlined />,
            disabled: isFrozen,
        },
        {
            key: 'unfreeze',
            label: '解冻列',
            icon: <UnlockOutlined />,
            disabled: !isFrozen,
        },
    ] : [];

    return (
        <th {...restProps} style={{ ...(restProps.style || {}) }}>
            <div className="column-header-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* 排序点击区域 */}
                <div
                    className="column-header-content"
                    onClick={sortOnClick}
                    style={{ flex: 1, minWidth: 0 }}
                >
                    {restProps.children}
                </div>
                {/* 下拉菜单区域：与排序事件解耦 */}
                {showDropdown && (
                    <div
                        className="dropdown-event-blocker"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        // 【关键】增加 z-index，防止被 Antd 表格列头自带的 ::before 热区遮挡劫持点击！
                        style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', zIndex: 10 }}
                    >
                        <Dropdown
                            menu={{ items: dropdownMenuItems, onClick: handleMenuClick }}
                            trigger={['click']}
                            destroyPopupOnHide
                        >
                            <div
                                className="column-header-dropdown-wrapper"
                                style={{ padding: '0 4px', height: '100%', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <span className="column-header-dropdown-trigger">
                                    <CaretDownOutlined />
                                </span>
                            </div>
                        </Dropdown>
                    </div>
                )}
            </div>
            <span
                className="column-resize-handle"
                onMouseDown={handleMouseDown}
                onClick={(e) => e.stopPropagation()}
            />
        </th>
    );
};

// 可展开文本框组件 - 默认单行，聚焦时浮动展开为多行
interface ExpandableTextAreaProps {
    value?: string;
    onChange?: (value: string) => void;
}

const ExpandableTextArea: React.FC<ExpandableTextAreaProps> = ({ value, onChange }) => {
    const [focused, setFocused] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            {/* 始终显示的单行输入框 */}
            <Input
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                autoComplete="off"
                onFocus={() => setFocused(true)}
                style={{ opacity: focused ? 0 : 1 }}
            />
            {/* 浮动的多行文本框 */}
            {focused && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    background: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: 6,
                }}>
                    <Input.TextArea
                        value={value}
                        onChange={(e) => onChange?.(e.target.value)}
                        autoSize={{ minRows: 3, maxRows: 6 }}
                        autoComplete="off"
                        style={{ resize: 'none' }}
                        onBlur={() => setFocused(false)}
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
};

// 尺寸选择弹框组件
interface SizeSelectModalProps {
    open: boolean;
    onCancel: () => void;
    onOk: (selectedSize: string) => void;
}

const SizeSelectModal: React.FC<SizeSelectModalProps> = ({ open, onCancel, onOk }) => {
    const [selectedSizeKey, setSelectedSizeKey] = useState<React.Key[]>([]);
    const [searchText, setSearchText] = useState('');
    const [dataSource] = useState([
        { key: '1', size: 'M6x20mm', description: '标准螺丝尺寸' },
        { key: '2', size: 'φ10x2mm', description: '常用垫片尺寸' },
        { key: '3', size: 'M8', description: '标准弹簧垫圈' },
        { key: '4', size: 'M10', description: '六角螺母标准' },
        { key: '5', size: 'M12x24x2.5mm', description: '高强度平垫圈' },
        { key: '6', size: 'M8x30mm', description: '内六角螺栓标准' },
    ]);

    const handleSearch = () => {
        // 简单模拟搜索
        // 实际场景可能是重新请求接口或者前端过滤
        // 这里演示前端过滤
        console.log('searching for:', searchText);
    };

    const filteredData = dataSource.filter(item =>
        item.size.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description.includes(searchText)
    );

    const columns = [
        { title: '序号', dataIndex: 'key', width: 60 },
        { title: '尺寸', dataIndex: 'size', width: 120 },
        { title: '描述', dataIndex: 'description' },
    ];

    const rowSelection = {
        type: 'radio' as const,
        selectedRowKeys: selectedSizeKey,
        onChange: (selectedRowKeys: React.Key[]) => {
            setSelectedSizeKey(selectedRowKeys);
        },
    };

    const handleOk = () => {
        if (selectedSizeKey.length === 0) {
            message.warning('请选择一个尺寸');
            return;
        }
        const selectedItem = dataSource.find(item => item.key === selectedSizeKey[0]);
        if (selectedItem) {
            onOk(selectedItem.size);
        }
    };

    // 每次打开重置选中状态
    useEffect(() => {
        if (open) {
            setSelectedSizeKey([]);
            setSearchText('');
        }
    }, [open]);

    return (
        <Modal
            title="选择尺寸"
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            width={600}
            destroyOnClose
        >
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <Input
                    placeholder="输入尺寸或描述搜索"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 200 }}
                    onPressEnter={handleSearch}
                />
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
            </div>
            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={filteredData}
                size="small"
                pagination={false}
                scroll={{ y: 300 }}
                onRow={(record) => ({
                    onClick: () => setSelectedSizeKey([record.key]),
                })}
            />
        </Modal>
    );
};

// 可编辑单元格组件
interface EditableCellProps {
    editing: boolean;
    dataIndex: string;
    title: string;
    inputType: 'text' | 'textarea' | 'number' | 'select';
    record: Part;
    options?: { label: string; value: string }[];
    children: React.ReactNode;
    handleSizeClick?: (record: Part) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    options,
    children,
    handleSizeClick,
    ...restProps
}) => {
    let inputNode;
    if (inputType === 'number') {
        inputNode = <InputNumber style={{ width: '100%' }} min={0} autoComplete="off" />;
    } else if (inputType === 'select' && options) {
        inputNode = <Select options={options} style={{ width: '100%' }} />;
    } else if (inputType === 'textarea') {
        inputNode = <ExpandableTextArea />;
    } else if (dataIndex === 'size') {
        // 尺寸字段特殊处理，添加后缀图标
        inputNode = (
            <Input
                autoComplete="off"
                suffix={
                    <SearchOutlined
                        style={{ cursor: 'pointer', color: '#1890ff' }}
                        onClick={() => handleSizeClick && handleSizeClick(record)}
                    />
                }
            />
        );
    } else {
        inputNode = <Input autoComplete="off" />;
    }

    return (
        <td {...restProps}>
            {editing ? (
                <Form.Item
                    name={dataIndex}
                    rules={[{ required: !['remark'].includes(dataIndex) }]}
                    noStyle
                >
                    {inputNode}
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};

const statusOptions = [
    { label: '启用', value: 'active' },
    { label: '停用', value: 'inactive' },
];

const sectionOptions = [
    { label: '车门/门组', value: 'door' },
    { label: '底盘', value: 'chassis' },
    { label: '发动机', value: 'engine' },
    { label: '内饰', value: 'interior' },
];

const PartsManagement: React.FC = () => {
    const [form] = Form.useForm();
    const [searchForm] = Form.useForm();
    const [data, setData] = useState<Part[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingKey, setEditingKey] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [isAdding, setIsAdding] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [sortParams, setSortParams] = useState<{ field?: string; order?: string }>({});
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
        partNo: 120,
        partName: 140,
        partNameEn: 180,
        size: 120,
        section: 100,
        quantity: 80,
        status: 80,
        remark: 150,
        operation: 120,
    });

    // 列可见性状态（隐藏的列的 dataIndex 数组）
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    // 冻结列状态（冻结的列的 dataIndex 数组）
    const [frozenColumns, setFrozenColumns] = useState<string[]>([]);

    // 切换列可见性
    const toggleColumnVisibility = useCallback((colDataIndex: string) => {
        setHiddenColumns(prev => {
            if (prev.includes(colDataIndex)) {
                return prev.filter(c => c !== colDataIndex);
            } else {
                return [...prev, colDataIndex];
            }
        });
    }, []);

    // 冻结列
    const freezeColumn = useCallback((colDataIndex: string) => {
        setFrozenColumns(prev => {
            if (prev.includes(colDataIndex)) return prev;
            return [...prev, colDataIndex];
        });
    }, []);

    // 解冻列
    const unfreezeColumn = useCallback((colDataIndex: string) => {
        setFrozenColumns(prev => prev.filter(c => c !== colDataIndex));
    }, []);

    // 尺寸弹框状态
    const [sizeModalVisible, setSizeModalVisible] = useState(false);
    // 当前正在编辑的行key，用于回填尺寸
    // 注意：editingKey 已经是 state 了，但我们需要知道当前是哪一行触发了弹框，
    // 虽然通常就是 editingKey 对应的行，但为了保险起见还是记录一下或者直接用 editingKey

    const handleSizeSelect = (selectedSize: string) => {
        // 将选中的尺寸回填到 Form 中
        form.setFieldsValue({
            size: selectedSize
        });
        setSizeModalVisible(false);
    };

    const openSizeModal = () => {
        setSizeModalVisible(true);
    };

    const isEditing = (record: Part) => record.key === editingKey;

    // 表格容器 ref，用于获取表格位置和高度
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const [tableScrollY, setTableScrollY] = useState<number>(400);

    // 动态计算表格高度
    useEffect(() => {
        if (!tableContainerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                // addButton: 32px + 12px = 44px
                // padding/margin: ~32px
                // pagination: ~64px (24px height + 16px margin + buffer)
                // table header: ~39px
                // table outer border: ~2px
                // target roughly height - 150px
                const targetY = entry.contentRect.height - 150;
                requestAnimationFrame(() => {
                    setTableScrollY(Math.max(200, targetY));
                });
            }
        });
        resizeObserver.observe(tableContainerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // 列宽拖动状态
    const resizingRef = useRef<{
        dataIndex: string;
        startX: number;
        startWidth: number;
    } | null>(null);
    const resizeIndicatorRef = useRef<HTMLDivElement | null>(null);
    const resizeHandleOverlayRef = useRef<HTMLDivElement | null>(null);

    // 开始拖动
    const startResize = useCallback((dataIndex: string, startX: number, startWidth: number) => {
        resizingRef.current = { dataIndex, startX, startWidth };

        // 获取表格容器的位置和高度
        const tableContainer = tableContainerRef.current;
        const tableEl = tableContainer?.querySelector('.ant-table');
        let top = 0;
        let height = window.innerHeight;

        if (tableEl) {
            const rect = tableEl.getBoundingClientRect();
            top = rect.top;
            height = rect.height;

            // 减去横向滚动条的高度防止遮挡
            const tableBody = tableContainer?.querySelector('.ant-table-body');
            if (tableBody instanceof HTMLElement) {
                height -= (tableBody.offsetHeight - tableBody.clientHeight);
            }
        }

        // 创建拖动指示线（只覆盖表格高度）
        const indicator = document.createElement('div');
        indicator.className = 'column-resize-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: ${top}px;
            height: ${height}px;
            width: 2px;
            background: var(--primary-color, #4f46e5);
            z-index: 1;
            pointer-events: none;
            left: ${startX}px;
        `;
        document.body.appendChild(indicator);
        resizeIndicatorRef.current = indicator;

        // 创建整列高度的拖动手柄覆盖层（用于捕获鼠标事件）
        const handleOverlay = document.createElement('div');
        handleOverlay.className = 'column-resize-overlay';
        handleOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9998;
            cursor: col-resize;
        `;
        document.body.appendChild(handleOverlay);
        resizeHandleOverlayRef.current = handleOverlay;

        // 防止文本选择
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    // 鼠标移动
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingRef.current) return;

        const { startX, startWidth } = resizingRef.current;
        const diff = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + diff); // 最小宽度 50px

        // 计算实际的移动距离（受限于最小宽度）
        const effectiveDiff = newWidth - startWidth;
        const indicatorLeft = startX + effectiveDiff;

        // 更新指示线位置
        if (resizeIndicatorRef.current) {
            resizeIndicatorRef.current.style.left = `${indicatorLeft}px`;
        }
    }, []);

    // 鼠标释放
    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (resizingRef.current) {
            const { startX, startWidth, dataIndex } = resizingRef.current;
            const diff = e.clientX - startX;
            const newWidth = Math.max(50, startWidth + diff); // 最小宽度 50px

            // 更新列宽
            setColumnWidths((prev) => ({
                ...prev,
                [dataIndex]: newWidth,
            }));
        }

        resizingRef.current = null;

        // 移除指示线
        if (resizeIndicatorRef.current) {
            resizeIndicatorRef.current.remove();
            resizeIndicatorRef.current = null;
        }

        // 移除覆盖层
        if (resizeHandleOverlayRef.current) {
            resizeHandleOverlayRef.current.remove();
            resizeHandleOverlayRef.current = null;
        }

        // 恢复样式
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (resizeIndicatorRef.current) {
                resizeIndicatorRef.current.remove();
            }
            if (resizeHandleOverlayRef.current) {
                resizeHandleOverlayRef.current.remove();
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // ResizeContext 值
    const resizeContextValue = React.useMemo(() => ({
        startResize,
        allColumns: ALL_COLUMN_DEFS,
        hiddenColumns,
        frozenColumns,
        toggleColumnVisibility,
        freezeColumn,
        unfreezeColumn,
    }), [startResize, hiddenColumns, frozenColumns, toggleColumnVisibility, freezeColumn, unfreezeColumn]);

    // 加载数据
    const fetchData = async (params: any = {}) => {
        setLoading(true);
        try {
            const res = await partsService.getList({
                page: pagination.current,
                pageSize: pagination.pageSize,
                sortField: sortParams.field,
                sortOrder: sortParams.order,
                ...params,
            });
            if (res.code === 200) {
                setData(res.data.list);
                setPagination(prev => ({ ...prev, total: res.data.total }));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 搜索
    const handleSearch = () => {
        const values = searchForm.getFieldsValue();
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchData({ ...values, page: 1 });
    };

    // 重置
    const handleReset = () => {
        searchForm.resetFields();
        setSortParams({});
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchData({ page: 1, sortField: undefined, sortOrder: undefined });
    };

    // 编辑
    const edit = (record: Part) => {
        form.setFieldsValue({ ...record });
        setEditingKey(record.key);
    };

    // 取消编辑
    const cancel = () => {
        if (isAdding) {
            setData(data.filter(item => item.key !== editingKey));
            setIsAdding(false);
        }
        setEditingKey('');
    };

    // 保存
    const save = async (key: string) => {
        try {
            const row = await form.validateFields();
            setLoading(true);

            if (isAdding) {
                const res = await partsService.create(row);
                if (res.code === 200) {
                    message.success('添加成功');
                    setIsAdding(false);
                    fetchData();
                }
            } else {
                const res = await partsService.update({ ...row, key });
                if (res.code === 200) {
                    message.success('保存成功');
                    const newData = [...data];
                    const index = newData.findIndex(item => item.key === key);
                    if (index > -1) {
                        newData[index] = { ...newData[index], ...row };
                        setData(newData);
                    }
                }
            }
            setEditingKey('');
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        } finally {
            setLoading(false);
        }
    };

    // 删除
    const handleDelete = async (key: string) => {
        setLoading(true);
        try {
            const res = await partsService.delete(key);
            if (res.code === 200) {
                message.success('删除成功');
                fetchData();
            }
        } finally {
            setLoading(false);
        }
    };

    // 添加新行
    const handleAdd = () => {
        const newKey = `new_${Date.now()}`;
        const newRecord: Part = {
            key: newKey,
            partNo: '',
            partName: '',
            partNameEn: '',
            size: '',
            section: 'door',
            quantity: 0,
            status: 'active',
            remark: '',
        };
        setData([newRecord, ...data]);
        form.setFieldsValue(newRecord);
        setEditingKey(newKey);
        setIsAdding(true);
    };

    // 分页变化
    const handleTableChange = (paginationConfig: any, _filters: any, sorter: any) => {
        const newSortParams = {
            field: Array.isArray(sorter) ? sorter[0].field : sorter.field,
            order: Array.isArray(sorter) ? sorter[0].order : sorter.order,
        };
        // 如果 order 为空，说明取消了排序
        if (!newSortParams.order) {
            newSortParams.field = undefined;
        }
        setSortParams(newSortParams);

        setPagination({
            current: paginationConfig.current,
            pageSize: paginationConfig.pageSize,
            total: pagination.total,
        });
        fetchData({
            page: paginationConfig.current,
            pageSize: paginationConfig.pageSize,
            sortField: newSortParams.field,
            sortOrder: newSortParams.order,
            ...searchForm.getFieldsValue(),
        });
    };

    const getColumns = (): ColumnsType<Part> => {
        const renderTooltip = (text: React.ReactNode, title?: React.ReactNode) => (
            <Tooltip placement="topLeft" title={title ?? text}>
                <div style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    cursor: 'help'
                }}>
                    {text}
                </div>
            </Tooltip>
        );

        return [
            {
                title: '配件编号',
                dataIndex: 'partNo',
                width: columnWidths.partNo,
                sorter: true,
                fixed: 'start',
                render: (text: string) => renderTooltip(text),
                onCell: (record) => ({
                    record,
                    inputType: 'text',
                    dataIndex: 'partNo',
                    title: '配件编号',
                    editing: isEditing(record),
                }),
            },
            {
                title: '配件名称',
                dataIndex: 'partName',
                width: columnWidths.partName,
                sorter: true,
                render: (text: string) => renderTooltip(text),
                onCell: (record) => ({
                    record,
                    inputType: 'textarea',
                    dataIndex: 'partName',
                    title: '配件名称',
                    editing: isEditing(record),
                }),
            },
            {
                title: '英文名称',
                dataIndex: 'partNameEn',
                width: columnWidths.partNameEn,
                sorter: true,
                render: (text: string) => renderTooltip(text),
                onCell: (record) => ({
                    record,
                    inputType: 'textarea',
                    dataIndex: 'partNameEn',
                    title: '英文名称',
                    editing: isEditing(record),
                }),
            },
            {
                title: '尺寸',
                dataIndex: 'size',
                width: columnWidths.size,
                sorter: true,
                render: (text: string) => renderTooltip(text),
                onCell: (record) => ({
                    record,
                    inputType: 'text',
                    dataIndex: 'size',
                    title: '尺寸',
                    editing: isEditing(record),
                }),
            },
            {
                title: '科组',
                dataIndex: 'section',
                width: columnWidths.section,
                sorter: true,
                render: (section: string) => {
                    const option = sectionOptions.find(opt => opt.value === section);
                    const text = option ? option.label : section;
                    return renderTooltip(text);
                },
                onCell: (record) => ({
                    record,
                    inputType: 'select',
                    dataIndex: 'section',
                    title: '科组',
                    editing: isEditing(record),
                    options: sectionOptions,
                }),
            },
            {
                title: '用量',
                dataIndex: 'quantity',
                width: columnWidths.quantity,
                align: 'center',
                sorter: true,
                render: (val: number) => renderTooltip(val),
                onCell: (record) => ({
                    record,
                    inputType: 'number',
                    dataIndex: 'quantity',
                    title: '用量',
                    editing: isEditing(record),
                }),
            },
            {
                title: '状态',
                dataIndex: 'status',
                width: columnWidths.status,
                align: 'center',
                sorter: true,
                render: (status: string) => {
                    const text = status === 'active' ? '启用' : '停用';
                    const tag = (
                        <Tag color={status === 'active' ? 'green' : 'default'}>
                            {text}
                        </Tag>
                    );
                    return renderTooltip(tag, text);
                },
                onCell: (record) => ({
                    record,
                    inputType: 'select',
                    dataIndex: 'status',
                    title: '状态',
                    editing: isEditing(record),
                    options: statusOptions,
                }),
            },
            {
                title: '备注',
                dataIndex: 'remark',
                width: columnWidths.remark,
                render: (text: string) => renderTooltip(text),
                onCell: (record) => ({
                    record,
                    inputType: 'text',
                    dataIndex: 'remark',
                    title: '备注',
                    editing: isEditing(record),
                }),
            },
            {
                title: '操作',
                dataIndex: 'operation',
                width: columnWidths.operation,
                align: 'center',
                render: (_: any, record: Part) => {
                    const editable = isEditing(record);
                    return editable ? (
                        <Space size={4}>
                            <Button
                                type="link"
                                icon={<SaveOutlined />}
                                onClick={() => save(record.key)}
                                style={{ padding: 0 }}
                                size="small"
                            >
                                保存
                            </Button>
                            <Button
                                type="link"
                                icon={<CloseOutlined />}
                                onClick={cancel}
                                style={{ padding: 0, color: '#666' }}
                                size="small"
                            >
                                取消
                            </Button>
                        </Space>
                    ) : (
                        <Space size={4}>
                            <Button
                                type="link"
                                icon={<EditOutlined />}
                                disabled={editingKey !== ''}
                                onClick={() => edit(record)}
                                style={{ padding: 0 }}
                                size="small"
                            >
                                编辑
                            </Button>
                            <Popconfirm
                                title="确定删除?"
                                onConfirm={() => handleDelete(record.key)}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button
                                    type="link"
                                    icon={<DeleteOutlined />}
                                    disabled={editingKey !== ''}
                                    danger
                                    style={{ padding: 0 }}
                                    size="small"
                                >
                                    删除
                                </Button>
                            </Popconfirm>
                        </Space>
                    );
                },
            },
        ];
    };

    const columns = getColumns();

    // 合并列配置，添加可编辑单元格和可调整列宽
    const mergedColumns = columns
        // 过滤掉隐藏的列
        .filter((col) => {
            const dataIndex = (col as any).dataIndex;
            return !hiddenColumns.includes(dataIndex);
        })
        .map((col) => {
            const dataIndex = (col as any).dataIndex;
            // 判断是否冻结列（操作列保持原有 fixed: 'end'）
            const isFrozen = frozenColumns.includes(dataIndex);
            const fixedProp = dataIndex === 'operation'
                ? { fixed: 'end' as const }
                : isFrozen
                    ? { fixed: 'start' as const }
                    : {};

            return {
                ...col,
                ...fixedProp,
                sortOrder: sortParams.field === dataIndex ? sortParams.order : null,
                onHeaderCell: (column: any) => ({
                    width: column.width,
                    dataIndex: dataIndex, // 传递 dataIndex 给表头组件
                }),
                ...('onCell' in col ? {
                    onCell: (record: Part) => ({
                        ...((col as any).onCell?.(record) || {}),
                    }),
                } : {}),
            };
        })
        // 将冻结列排到前面，操作列始终在最后
        .sort((a: any, b: any) => {
            const aFixed = a.fixed;
            const bFixed = b.fixed;
            // fixed: 'end' 列（操作列）始终在最后
            if (aFixed === 'end' && bFixed !== 'end') return 1;
            if (aFixed !== 'end' && bFixed === 'end') return -1;
            // fixed: 'start' 列（冻结列）排在前面
            if (aFixed === 'start' && bFixed !== 'start') return -1;
            if (aFixed !== 'start' && bFixed === 'start') return 1;
            return 0;
        });

    // 查询字段配置
    const searchFields = [
        { name: 'partNo', label: '配件编号', type: 'input' },
        { name: 'partName', label: '配件名称', type: 'input' },
        { name: 'partNameEn', label: '英文名称', type: 'input' },
        { name: 'size', label: '尺寸', type: 'input' },
        { name: 'section', label: '科组', type: 'select', options: sectionOptions },
        { name: 'status', label: '状态', type: 'select', options: statusOptions },
    ];

    // 默认显示的字段数量（一行约4个字段）
    const defaultVisibleCount = 4;
    const visibleFields = expanded ? searchFields : searchFields.slice(0, defaultVisibleCount);
    const hasMoreFields = searchFields.length > defaultVisibleCount;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <style>{`
                /* 默认隐藏排序图标 */
                .full-height-table .ant-table-column-sorter {
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                /* 当列正在排序，或者鼠标悬停在表头时显示图标 */
                .full-height-table .ant-table-column-sort .ant-table-column-sorter,
                .full-height-table .ant-table-column-has-sorters:hover .ant-table-column-sorter {
                    opacity: 1;
                }

                /* 列头 flex 布局容器 */
                .column-header-wrapper {
                    display: flex;
                    align-items: center;
                    width: 100%;
                }
                .column-header-dropdown-wrapper {
                    display: inline-flex;
                    align-items: center;
                    flex-shrink: 0;
                }
                .column-header-content {
                    flex: 1;
                    overflow: hidden;
                    min-width: 0;
                }

                /* 列头下拉箭头 - 默认隐藏，排在排序图标后面 */
                .column-header-dropdown-trigger {
                    display: inline-flex;
                    align-items: center;
                    flex-shrink: 0;
                    opacity: 0;
                    transition: opacity 0.3s;
                    cursor: pointer;
                    font-size: 10px;
                    color: #8c8c8c;
                    padding: 2px 4px;
                    margin-left: 2px;
                    line-height: 1;
                    border-radius: 2px;
                }
                .column-header-dropdown-trigger:hover {
                    color: #1890ff;
                    background: rgba(24, 144, 255, 0.06);
                }
                /* 鼠标悬停表头时显示下拉箭头 */
                .full-height-table th:hover .column-header-dropdown-trigger {
                    opacity: 1;
                }
                /* 下拉菜单打开时也保持箭头可见 */
                .column-header-dropdown-trigger.ant-dropdown-open,
                .ant-dropdown-open .column-header-dropdown-trigger {
                    opacity: 1;
                }
            `}</style>
            {/* 搜索区域 */}
            <div style={{ padding: 16, background: '#fff', marginBottom: 12, borderRadius: 6, flexShrink: 0 }}>
                <Form form={searchForm} onKeyPress={(e) => e.key === 'Enter' && handleSearch()}>
                    <Row gutter={[16, 8]}>
                        {visibleFields.map((field) => (
                            <Col key={field.name} xs={24} sm={12} md={8} lg={6} xl={4}>
                                <Form.Item name={field.name} label={field.label} style={{ marginBottom: 8 }}>
                                    {field.type === 'select' ? (
                                        <Select
                                            placeholder="请选择"
                                            allowClear
                                            options={field.options}
                                            style={{ width: '100%' }}
                                        />
                                    ) : (
                                        <Input
                                            placeholder="请输入"
                                            allowClear
                                            autoComplete="off"
                                        />
                                    )}
                                </Form.Item>
                            </Col>
                        ))}
                        {/* 按钮区域 - 始终在末尾 */}
                        <Col xs={24} sm={12} md={8} lg={6} xl={4} style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 4 }}>
                            <Space>
                                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
                                    查询
                                </Button>
                                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                                    重置
                                </Button>
                                {hasMoreFields && (
                                    <Button
                                        type="link"
                                        onClick={() => setExpanded(!expanded)}
                                        style={{ padding: '4px 0' }}
                                    >
                                        {expanded ? '收起' : '展开'}
                                        {expanded ? <UpOutlined style={{ marginLeft: 4 }} /> : <DownOutlined style={{ marginLeft: 4 }} />}
                                    </Button>
                                )}
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </div>

            {/* 尺寸选择弹框 */}
            <SizeSelectModal
                open={sizeModalVisible}
                onCancel={() => setSizeModalVisible(false)}
                onOk={handleSizeSelect}
            />

            {/* 表格区域 */}
            <div ref={tableContainerRef} style={{ padding: 16, background: '#fff', borderRadius: 6, flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 12 }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        disabled={editingKey !== ''}
                    >
                        新增配件
                    </Button>
                </div>

                <ResizeContext.Provider value={resizeContextValue}>
                    <Form form={form} component={false}>
                        <Table
                            className="full-height-table"
                            components={{
                                header: {
                                    cell: ResizableTitle,
                                },
                                body: {
                                    cell: (props: any) => (
                                        <EditableCell
                                            {...props}
                                            handleSizeClick={openSizeModal}
                                        />
                                    ),
                                },
                            }}
                            bordered
                            dataSource={data}
                            columns={mergedColumns as any}
                            rowClassName="editable-row"
                            pagination={{
                                ...pagination,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total) => `共 ${total} 条`,
                            }}
                            loading={loading}
                            onChange={handleTableChange}
                            scroll={{ x: 1200, y: tableScrollY }}
                            size="small"
                        />
                    </Form>
                </ResizeContext.Provider>
            </div>
        </div>
    );
};

export default PartsManagement;