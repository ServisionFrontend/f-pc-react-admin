import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Form,
    Button,
    Space,
    Input,
    Row,
    Badge,
    Dropdown,
    Divider,
    Modal,
    App,
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    DownOutlined,
    UpOutlined,
    SaveOutlined,
    CheckOutlined,
    PushpinFilled,
    EditOutlined,
    HolderOutlined,
} from '@ant-design/icons';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import dayjs from 'dayjs';
import { SvQueryProps, QueryField, QueryTemplate } from './types';
import { QueryTemplateService, QueryFieldService } from './service';
import { SortableField } from './SortableField';

const ALL_FIELDS_SCHEME = '全部';

const SvQuery: React.FC<SvQueryProps> = ({
    templatesUrl,
    fieldsUrl,
    templateService: externalTemplateService,
    fieldService: externalFieldService,
    onSearch,
    onReset,
    defaultExpanded = false,
    showTemplateManager = true,
    storageKey = 'svquery',
    className,
    style,
}) => {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const searchNameInputRef = useRef<any>(null);

    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [filledCount, setFilledCount] = useState(0);

    const [allFields, setAllFields] = useState<QueryField[]>([]);
    const [searchFields, setSearchFields] = useState<QueryField[]>([]);
    const [savedSearches, setSavedSearches] = useState<QueryTemplate[]>([]);
    const [currentScheme, setCurrentScheme] = useState<string>(ALL_FIELDS_SCHEME);
    const [defaultScheme, setDefaultScheme] = useState<string | null>(null);

    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // 字段编辑相关状态
    const [isEditingFields, setIsEditingFields] = useState(false);
    const [fieldsBeforeEdit, setFieldsBeforeEdit] = useState<QueryField[]>([]);
    const [selectedFieldNames, setSelectedFieldNames] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    // 优先使用外部传入的 service，否则使用 URL 创建
    const useApiMode = !!(templatesUrl && fieldsUrl) || !!(externalTemplateService && externalFieldService);
    const templateService = externalTemplateService || (templatesUrl ? new QueryTemplateService(templatesUrl) : null);
    const fieldService = externalFieldService || (fieldsUrl ? new QueryFieldService(fieldsUrl) : null);

    // 拖拽传感器
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 处理拖拽开始
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // 处理拖拽悬停
    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setOverId(over ? (over.id as string) : null);
    };

    // 处理拖拽结束
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = searchFields.findIndex((f) => f.name === active.id);
            const newIndex = searchFields.findIndex((f) => f.name === over.id);
            const newFields = arrayMove(searchFields, oldIndex, newIndex);
            setSearchFields(newFields);
        }
        setActiveId(null);
        setOverId(null);
    };

    // 处理拖拽取消
    const handleDragCancel = () => {
        setActiveId(null);
        setOverId(null);
    };

    // 删除字段
    const handleDeleteField = (fieldName: string) => {
        const newFields = searchFields.filter((f) => f.name !== fieldName);
        setSearchFields(newFields);
        message.success('已删除字段');
    };

    // 开始编辑字段
    const handleStartEditFields = () => {
        setFieldsBeforeEdit([...searchFields]);
        setIsEditingFields(true);
        setExpanded(true);
        if (currentScheme === ALL_FIELDS_SCHEME) {
            setSelectedFieldNames([]);
        }
    };

    // 取消编辑字段
    const handleCancelEditFields = () => {
        setSearchFields(fieldsBeforeEdit);
        setIsEditingFields(false);
        setSelectedFieldNames([]);
    };

    // 完成编辑字段
    const handleFinishEditFields = () => {
        setIsEditingFields(false);
        setSelectedFieldNames([]);
        message.success('字段配置已保存');
    };

    const getFilledFieldsCount = useCallback(() => {
        const values = form.getFieldsValue();
        return Object.values(values).filter(
            (value) => value !== undefined && value !== null && value !== ''
        ).length;
    }, [form]);

    useEffect(() => {
        setFilledCount(getFilledFieldsCount());
    }, [getFilledFieldsCount]);

    const loadAllFields = useCallback(async () => {
        if (useApiMode && fieldService) {
            try {
                const res = await fieldService.getFields('all');
                if (res.code === 200) {
                    setAllFields(res.data.fields);
                    setSearchFields(res.data.fields);
                }
            } catch (error) {
                console.error('Failed to load fields:', error);
                message.error('加载查询字段失败');
            }
        }
    }, [useApiMode, fieldService, message]);

    const loadTemplates = useCallback(async () => {
        if (useApiMode && templateService) {
            try {
                const res = await templateService.getTemplates();
                if (res.code === 200) {
                    setSavedSearches(res.data);
                    const defaultTemplate = res.data.find((t: QueryTemplate) => t.isDefault);
                    if (defaultTemplate) {
                        setDefaultScheme(defaultTemplate.name);
                    }
                }
            } catch (error) {
                console.error('Failed to load templates:', error);
                message.error('加载查询模板失败');
            }
        }
    }, [useApiMode, templateService, message]);

    useEffect(() => {
        loadAllFields();
        loadTemplates();
    }, [loadAllFields, loadTemplates]);

    const handleSearch = () => {
        const values = form.getFieldsValue();
        const searchParams = { ...values };

        Object.keys(searchParams).forEach((key) => {
            const value = searchParams[key];
            if (value && Array.isArray(value) && value.length === 2) {
                if (value[0] && typeof value[0].format === 'function') {
                    searchParams[`${key}Start`] = value[0].format('YYYY-MM-DD');
                    searchParams[`${key}End`] = value[1].format('YYYY-MM-DD');
                    delete searchParams[key];
                }
            }
        });

        onSearch(searchParams);
    };

    const handleReset = () => {
        form.resetFields();
        setFilledCount(0);
        onReset?.();
    };

    const handleSaveSearch = async () => {
        const searchName = searchNameInputRef.current?.input?.value?.trim() || '';

        if (!searchName) {
            message.warning('请输入查询条件名称');
            return;
        }

        const conditions = form.getFieldsValue();
        const processedConditions = { ...conditions };

        Object.keys(processedConditions).forEach((key) => {
            const value = processedConditions[key];
            if (value && Array.isArray(value) && value.length === 2) {
                if (value[0] && typeof value[0].format === 'function') {
                    processedConditions[key] = value.map((date: any) => date.format('YYYY-MM-DD'));
                }
            }
        });

        const usedFields = Object.keys(conditions).filter(
            (key) => conditions[key] !== undefined && conditions[key] !== null && conditions[key] !== ''
        );
        const fieldsToSave = usedFields.length > 0 ? usedFields : searchFields.map((f) => f.name);

        const newTemplate: Omit<QueryTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
            name: searchName,
            conditions: processedConditions,
            fields: fieldsToSave,
            isDefault: false,
            order: savedSearches.length,
        };

        if (useApiMode && templateService) {
            try {
                setLoading(true);
                const res = await templateService.createTemplate(newTemplate);
                if (res.code === 200) {
                    message.success('查询条件已保存');
                    await loadTemplates();
                    setSaveModalVisible(false);
                }
            } catch (error) {
                message.error('保存查询条件失败');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleLoadSearch = async (search: QueryTemplate) => {
        const { name, id } = search;
        setCurrentScheme(name);

        if (useApiMode && fieldService && id) {
            try {
                const res = await fieldService.getFields(id);
                if (res.code === 200) {
                    setSearchFields(res.data.fields);
                    if (res.data.conditions) {
                        const processedConditions = { ...res.data.conditions };
                        Object.keys(processedConditions).forEach((key) => {
                            const value = processedConditions[key];
                            if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'string') {
                                processedConditions[key] = value.map((dateStr: string) => dayjs(dateStr));
                            }
                        });
                        form.setFieldsValue(processedConditions);
                    }
                }
            } catch (error) {
                message.error('加载查询字段失败');
            }
        }

        setTimeout(() => {
            setFilledCount(getFilledFieldsCount());
        }, 0);

        setExpanded(true);
        setDropdownOpen(false);
    };

    const handleLoadAllFields = () => {
        setCurrentScheme(ALL_FIELDS_SCHEME);
        setSearchFields(allFields);
        form.resetFields();
        setFilledCount(0);
    };

    const handleDeleteSearch = async (index: number) => {
        const deletedSearch = savedSearches[index];

        if (useApiMode && templateService && deletedSearch.id) {
            try {
                setLoading(true);
                const res = await templateService.deleteTemplate(deletedSearch.id);
                if (res.code === 200) {
                    message.success('已删除');
                    await loadTemplates();

                    if (deletedSearch.name === currentScheme) {
                        handleLoadAllFields();
                    }
                }
            } catch (error) {
                message.error('删除失败');
            } finally {
                setLoading(false);
            }
        }
    };

    const hasMoreFields = searchFields.length > 6;

    return (
        <div
            className={className}
            style={{
                padding: 16,
                background: '#fff',
                marginBottom: 12,
                borderRadius: 6,
                ...style,
            }}
        >
            {showTemplateManager && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 16,
                        paddingBottom: 12,
                        borderBottom: '1px solid #f0f0f0',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            style={{
                                width: 3,
                                height: 14,
                                backgroundColor: '#1890ff',
                                borderRadius: 2,
                            }}
                        />
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#262626', marginRight: 4 }}>
                            查询模板:
                        </span>
                        <Dropdown
                            open={dropdownOpen}
                            onOpenChange={setDropdownOpen}
                            menu={{
                                items: [
                                    {
                                        key: 'all',
                                        label: (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {currentScheme === ALL_FIELDS_SCHEME && (
                                                    <CheckOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                                                )}
                                                <span>{ALL_FIELDS_SCHEME}</span>
                                            </div>
                                        ),
                                        onClick: handleLoadAllFields,
                                    },
                                    savedSearches.length > 0 && { type: 'divider' },
                                    ...savedSearches.map((search, index) => ({
                                        key: search.id || index,
                                        label: (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {currentScheme === search.name && (
                                                    <CheckOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                                                )}
                                                {search.isDefault && (
                                                    <PushpinFilled style={{ color: '#1890ff', fontSize: 12 }} />
                                                )}
                                                <span>{search.name}</span>
                                            </div>
                                        ),
                                        onClick: () => handleLoadSearch(search),
                                    })),
                                ].filter(Boolean),
                            }}
                            trigger={['click']}
                        >
                            <div
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    backgroundColor: '#f5f5f5',
                                }}
                            >
                                <span style={{ fontWeight: 600, color: '#1890ff', fontSize: 13 }}>
                                    {currentScheme}
                                </span>
                                <DownOutlined style={{ fontSize: 10, color: '#1890ff' }} />
                            </div>
                        </Dropdown>
                    </div>
                </div>
            )}

            <Form
                form={form}
                layout="vertical"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onValuesChange={() => setFilledCount(getFilledFieldsCount())}
            >
                <div
                    style={{
                        maxHeight: expanded ? 'none' : '70px',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease',
                    }}
                >
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        <SortableContext
                            items={searchFields.map((f) => f.name)}
                            strategy={verticalListSortingStrategy}
                        >
                            <Row gutter={[16, 8]}>
                                {searchFields.map((field) => (
                                    <SortableField
                                        key={field.name}
                                        field={field}
                                        isEditing={isEditingFields}
                                        onDelete={() => handleDeleteField(field.name)}
                                        isActiveField={activeId === field.name}
                                        isOverField={overId === field.name}
                                        showCheckbox={currentScheme === ALL_FIELDS_SCHEME && isEditingFields}
                                        isChecked={selectedFieldNames.includes(field.name)}
                                        onCheckChange={(checked) => {
                                            if (checked) {
                                                setSelectedFieldNames([...selectedFieldNames, field.name]);
                                            } else {
                                                setSelectedFieldNames(selectedFieldNames.filter((name) => name !== field.name));
                                            }
                                        }}
                                        disableInput={isEditingFields}
                                    />
                                ))}
                            </Row>
                        </SortableContext>
                        {/* 拖动时的浮动预览 */}
                        <DragOverlay>
                            {activeId ? (
                                <div
                                    style={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #1890ff',
                                        borderRadius: 6,
                                        padding: 8,
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                                        cursor: 'grabbing',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <HolderOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                                        <span style={{ fontWeight: 500 }}>
                                            {searchFields.find((f) => f.name === activeId)?.label}
                                        </span>
                                    </div>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 8,
                    }}
                >
                    <Space>
                        {hasMoreFields && (
                            <div style={{ marginRight: 10, display: 'inline-block' }}>
                                <Badge count={filledCount} offset={[0, 2]} style={{ zIndex: 999 }}>
                                    <Button
                                        onClick={() => setExpanded(!expanded)}
                                        icon={expanded ? <UpOutlined /> : <DownOutlined />}
                                        disabled={isEditingFields}
                                    >
                                        {expanded ? '收起' : '展开'}
                                    </Button>
                                </Badge>
                            </div>
                        )}
                        {/* 编辑/恢复按钮 */}
                        {isEditingFields ? (
                            <>
                                <Button type="primary" onClick={handleFinishEditFields}>
                                    完成
                                </Button>
                                <Button onClick={handleCancelEditFields}>
                                    取消
                                </Button>
                            </>
                        ) : (
                            <Button icon={<EditOutlined />} onClick={handleStartEditFields}>
                                编辑字段
                            </Button>
                        )}
                    </Space>
                    <Space>
                        {showTemplateManager && currentScheme === ALL_FIELDS_SCHEME && !isEditingFields && (
                            <Button
                                icon={<SaveOutlined />}
                                onClick={() => setSaveModalVisible(true)}
                                disabled={isEditingFields && selectedFieldNames.length === 0}
                            >
                                保存查询模板
                            </Button>
                        )}
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            loading={loading}
                            disabled={isEditingFields}
                        >
                            查询
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            disabled={isEditingFields}
                        >
                            重置
                        </Button>
                    </Space>
                </div>
            </Form>

            <Modal
                title="保存查询条件"
                open={saveModalVisible}
                onOk={handleSaveSearch}
                onCancel={() => setSaveModalVisible(false)}
                okText="保存"
                cancelText="取消"
            >
                <Form layout="vertical">
                    <Form.Item label="查询条件名称" required>
                        <Input
                            ref={searchNameInputRef}
                            placeholder="请输入查询条件名称"
                            onPressEnter={handleSaveSearch}
                            autoFocus
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SvQuery;
