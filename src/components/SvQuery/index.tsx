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
import { SortableSchemeItem } from './SortableSchemeItem';

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
    const isInitializedRef = useRef(false); // 标记是否已经初始化加载默认模板

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
    const handleFinishEditFields = async () => {
        setIsEditingFields(false);
        setSelectedFieldNames([]);

        // 获取当前表单的值
        const formValues = form.getFieldsValue();

        // 保存字段配置和字段值
        if (currentScheme === ALL_FIELDS_SCHEME) {
            // 在"全部"模式下，保存字段配置和字段值到 localStorage
            try {
                const fieldNames = searchFields.map((f) => f.name);
                localStorage.setItem(`${storageKey}_allFieldsConfig`, JSON.stringify(fieldNames));

                // 保存字段值
                localStorage.setItem(`${storageKey}_allFieldsValues`, JSON.stringify(formValues));

                message.success('字段配置已保存');
            } catch (error) {
                console.error('Failed to save fields config:', error);
                message.error('保存字段配置失败');
            }
        } else {
            // 在自定义模板下，更新模板的字段配置和字段值
            const currentTemplate = savedSearches.find((t) => t.name === currentScheme);
            if (currentTemplate) {
                const fieldNames = searchFields.map((f) => f.name);

                // 处理日期字段
                const processedValues = { ...formValues };
                Object.keys(processedValues).forEach((key) => {
                    const value = processedValues[key];
                    if (value && Array.isArray(value) && value.length === 2) {
                        if (value[0] && typeof value[0].format === 'function') {
                            processedValues[key] = value.map((date: any) => date.format('YYYY-MM-DD'));
                        }
                    }
                });

                const updatedTemplate = {
                    ...currentTemplate,
                    fields: fieldNames,
                    conditions: processedValues,
                };

                if (useApiMode && templateService) {
                    // API 模式：调用更新接口
                    try {
                        setLoading(true);
                        const res = await templateService.updateTemplate(currentTemplate.id, {
                            fields: fieldNames,
                            conditions: processedValues,
                        });
                        if (res.code === 200) {
                            await loadTemplates();
                            message.success('字段配置已保存');
                        }
                    } catch (error) {
                        console.error('Failed to update template:', error);
                        message.error('保存字段配置失败');
                    } finally {
                        setLoading(false);
                    }
                } else {
                    // 非 API 模式：更新 localStorage
                    try {
                        const updatedSearches = savedSearches.map((t) =>
                            t.id === currentTemplate.id ? updatedTemplate : t
                        );
                        setSavedSearches(updatedSearches);
                        localStorage.setItem(`${storageKey}_savedSearches`, JSON.stringify(updatedSearches));
                        message.success('字段配置已保存');
                    } catch (error) {
                        console.error('Failed to save template:', error);
                        message.error('保存字段配置失败');
                    }
                }
            }
        }
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

                    // 检查 localStorage 中是否有保存的字段配置
                    try {
                        const savedConfig = localStorage.getItem(`${storageKey}_allFieldsConfig`);
                        if (savedConfig) {
                            const savedFieldNames = JSON.parse(savedConfig);
                            // 根据保存的字段名称列表，从所有字段中筛选和排序
                            const orderedFields = savedFieldNames
                                .map((name: string) => res.data.fields.find((f: QueryField) => f.name === name))
                                .filter((f: QueryField | undefined) => f !== undefined) as QueryField[];
                            setSearchFields(orderedFields);

                            // 恢复字段值
                            const savedValues = localStorage.getItem(`${storageKey}_allFieldsValues`);
                            if (savedValues) {
                                const values = JSON.parse(savedValues);
                                // 处理日期字段
                                Object.keys(values).forEach((key) => {
                                    const value = values[key];
                                    if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'string') {
                                        values[key] = value.map((dateStr: string) => dayjs(dateStr));
                                    }
                                });
                                form.setFieldsValue(values);
                            }
                        } else {
                            setSearchFields(res.data.fields);
                        }
                    } catch (error) {
                        console.error('Failed to load saved fields config:', error);
                        setSearchFields(res.data.fields);
                    }
                }
            } catch (error) {
                console.error('Failed to load fields:', error);
                message.error('加载查询字段失败');
            }
        }
    }, [useApiMode, fieldService, message, storageKey, form]);

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
        } else {
            // 非 API 模式，从 localStorage 加载
            try {
                const savedTemplates = localStorage.getItem(`${storageKey}_savedSearches`);
                const savedDefault = localStorage.getItem(`${storageKey}_defaultScheme`);

                if (savedTemplates) {
                    const templates = JSON.parse(savedTemplates);
                    setSavedSearches(templates);
                }

                if (savedDefault) {
                    setDefaultScheme(savedDefault);
                }
            } catch (error) {
                console.error('Failed to load templates from localStorage:', error);
            }
        }
    }, [useApiMode, templateService, message, storageKey]);

    useEffect(() => {
        loadAllFields();
        loadTemplates();
    }, [loadAllFields, loadTemplates]);

    // 初始化时自动加载默认模板
    useEffect(() => {
        if (!isInitializedRef.current && defaultScheme && savedSearches.length > 0) {
            const defaultTemplate = savedSearches.find((t) => t.name === defaultScheme);
            if (defaultTemplate) {
                handleLoadSearch(defaultTemplate);
                isInitializedRef.current = true;
            }
        }
    }, [defaultScheme, savedSearches]);

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
                    // 清空输入框
                    if (searchNameInputRef.current?.input) {
                        searchNameInputRef.current.input.value = '';
                    }
                    // 自动切换到新创建的模板
                    if (res.data) {
                        handleLoadSearch(res.data);
                    }
                }
            } catch (error) {
                message.error('保存查询条件失败');
            } finally {
                setLoading(false);
            }
        } else {
            // 非 API 模式，保存到 localStorage
            try {
                const newTemplateWithId = {
                    ...newTemplate,
                    id: `local_${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                const updatedSearches = [...savedSearches, newTemplateWithId];
                setSavedSearches(updatedSearches);
                localStorage.setItem(`${storageKey}_savedSearches`, JSON.stringify(updatedSearches));
                message.success('查询条件已保存');
                setSaveModalVisible(false);
                // 清空输入框
                if (searchNameInputRef.current?.input) {
                    searchNameInputRef.current.input.value = '';
                }
                // 自动切换到新创建的模板
                handleLoadSearch(newTemplateWithId);
            } catch (error) {
                message.error('保存查询条件失败');
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

        // 检查 localStorage 中是否有保存的字段配置
        try {
            const savedConfig = localStorage.getItem(`${storageKey}_allFieldsConfig`);
            if (savedConfig) {
                const savedFieldNames = JSON.parse(savedConfig);
                // 根据保存的字段名称列表，从所有字段中筛选和排序
                const orderedFields = savedFieldNames
                    .map((name: string) => allFields.find((f) => f.name === name))
                    .filter((f: QueryField | undefined) => f !== undefined) as QueryField[];
                setSearchFields(orderedFields);
            } else {
                setSearchFields(allFields);
            }
        } catch (error) {
            console.error('Failed to load saved fields config:', error);
            setSearchFields(allFields);
        }

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

                    // 如果删除的是默认方案，清除默认方案设置
                    if (deletedSearch.name === defaultScheme) {
                        setDefaultScheme(null);
                    }
                }
            } catch (error) {
                message.error('删除失败');
            } finally {
                setLoading(false);
            }
        } else {
            // 非 API 模式，从 localStorage 删除
            const updatedSearches = savedSearches.filter((_, i) => i !== index);
            setSavedSearches(updatedSearches);
            localStorage.setItem(`${storageKey}_savedSearches`, JSON.stringify(updatedSearches));

            // 如果删除的是当前方案，切换到"全部查询条件"
            if (deletedSearch.name === currentScheme) {
                handleLoadAllFields();
            }

            // 如果删除的是默认方案，清除默认方案设置
            if (deletedSearch.name === defaultScheme) {
                setDefaultScheme(null);
                localStorage.removeItem(`${storageKey}_defaultScheme`);
            }

            message.success('已删除');
        }
    };

    // 重命名查询方案
    const handleRenameScheme = async (index: number, newName: string) => {
        const oldSearch = savedSearches[index];
        const oldName = oldSearch.name;

        // 检查新名称是否与其他方案重复
        const isDuplicate = savedSearches.some((s, i) => i !== index && s.name === newName);
        if (isDuplicate) {
            message.warning('方案名称已存在');
            return;
        }

        if (useApiMode && templateService && oldSearch.id) {
            try {
                setLoading(true);
                const res = await templateService.updateTemplate(oldSearch.id, { name: newName });
                if (res.code === 200) {
                    message.success('重命名成功');
                    await loadTemplates();

                    // 如果重命名的是当前方案，更新当前方案名称
                    if (oldName === currentScheme) {
                        setCurrentScheme(newName);
                    }

                    // 如果重命名的是默认方案，更新默认方案名称
                    if (oldName === defaultScheme) {
                        setDefaultScheme(newName);
                    }
                }
            } catch (error) {
                message.error('重命名失败');
            } finally {
                setLoading(false);
            }
        } else {
            // 非 API 模式，更新 localStorage
            const updatedSearches = [...savedSearches];
            updatedSearches[index] = { ...updatedSearches[index], name: newName };
            setSavedSearches(updatedSearches);
            localStorage.setItem(`${storageKey}_savedSearches`, JSON.stringify(updatedSearches));

            // 如果重命名的是当前方案，更新当前方案名称
            if (oldName === currentScheme) {
                setCurrentScheme(newName);
            }

            // 如果重命名的是默认方案，更新默认方案名称
            if (oldName === defaultScheme) {
                setDefaultScheme(newName);
                localStorage.setItem(`${storageKey}_defaultScheme`, newName);
            }

            message.success('重命名成功');
        }
    };

    // 设置默认查询方案
    const handleSetDefaultScheme = async (schemeName: string) => {
        const scheme = savedSearches.find(s => s.name === schemeName);
        if (useApiMode && templateService && scheme?.id) {
            try {
                setLoading(true);
                // 先取消所有默认
                for (const s of savedSearches) {
                    if (s.isDefault && s.id) {
                        await templateService.updateTemplate(s.id, { isDefault: false });
                    }
                }
                // 设置新的默认
                const res = await templateService.updateTemplate(scheme.id, { isDefault: true });
                if (res.code === 200) {
                    message.success(`已设置"${schemeName}"为默认方案`);
                    await loadTemplates();
                    setDefaultScheme(schemeName);
                }
            } catch (error) {
                message.error('设置默认失败');
            } finally {
                setLoading(false);
            }
        } else {
            // 非 API 模式，保存到 localStorage
            setDefaultScheme(schemeName);
            localStorage.setItem(`${storageKey}_defaultScheme`, schemeName);
            message.success(`已设置"${schemeName}"为默认方案`);
        }
    };

    // 取消默认查询方案
    const handleCancelDefaultScheme = async () => {
        const scheme = savedSearches.find(s => s.name === defaultScheme);
        if (useApiMode && templateService && scheme?.id) {
            try {
                setLoading(true);
                const res = await templateService.updateTemplate(scheme.id, { isDefault: false });
                if (res.code === 200) {
                    message.success('已取消默认方案');
                    await loadTemplates();
                    setDefaultScheme(null);
                }
            } catch (error) {
                message.error('取消默认失败');
            } finally {
                setLoading(false);
            }
        } else {
            // 非 API 模式，从 localStorage 删除
            setDefaultScheme(null);
            localStorage.removeItem(`${storageKey}_defaultScheme`);
            message.success('已取消默认方案');
        }
    };

    // 处理查询方案拖拽排序
    const handleSchemeReorder = async (oldIndex: number, newIndex: number) => {
        const newSearches = arrayMove(savedSearches, oldIndex, newIndex);
        setSavedSearches(newSearches);

        if (useApiMode && templateService) {
            try {
                // 更新所有方案的顺序
                const orders = newSearches.map((s, index) => ({
                    id: s.id!,
                    order: index,
                }));
                await templateService.reorderTemplates(orders);
            } catch (error) {
                message.error('调整顺序失败');
                // 失败时恢复原顺序
                await loadTemplates();
            }
        } else {
            // 非 API 模式，保存到 localStorage
            localStorage.setItem(`${storageKey}_savedSearches`, JSON.stringify(newSearches));
        }
    };

    // 处理查询方案拖拽开始
    const handleSchemeDragStart = () => {
        // 拖拽开始逻辑
    };

    // 处理查询方案拖拽结束
    const handleSchemeDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = parseInt((active.id as string).replace('scheme-', ''));
            const newIndex = parseInt((over.id as string).replace('scheme-', ''));
            handleSchemeReorder(oldIndex, newIndex);
        }
    };

    // 处理查询方案拖拽取消
    const handleSchemeDragCancel = () => {
        // 拖拽取消逻辑
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
                            dropdownRender={() => (
                                <div
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: 6,
                                        boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)',
                                        minWidth: 240,
                                    }}
                                >
                                    {/* 全部查询条件 - 固定不可拖拽 */}
                                    <div
                                        onClick={() => {
                                            handleLoadAllFields();
                                            setDropdownOpen(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '5px 12px',
                                            cursor: 'pointer',
                                            backgroundColor: 'transparent',
                                            transition: 'background-color 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        {currentScheme === ALL_FIELDS_SCHEME ? (
                                            <CheckOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                                        ) : (
                                            <div style={{ width: 14 }}></div>
                                        )}
                                        <span
                                            style={{
                                                fontWeight: currentScheme === ALL_FIELDS_SCHEME ? 600 : 400,
                                            }}
                                        >
                                            {ALL_FIELDS_SCHEME}
                                        </span>
                                    </div>

                                    {/* 分隔线 */}
                                    {savedSearches.length > 0 && <Divider style={{ margin: '4px 0' }} />}

                                    {/* 可拖拽的查询方案列表 */}
                                    {savedSearches.length > 0 && (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragStart={handleSchemeDragStart}
                                            onDragEnd={handleSchemeDragEnd}
                                            onDragCancel={handleSchemeDragCancel}
                                        >
                                            <SortableContext
                                                items={savedSearches.map((_, index) => `scheme-${index}`)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {savedSearches.map((search, index) => (
                                                    <SortableSchemeItem
                                                        key={`scheme-${index}`}
                                                        search={search}
                                                        index={index}
                                                        currentScheme={currentScheme}
                                                        defaultScheme={defaultScheme}
                                                        onLoad={() => {
                                                            handleLoadSearch(search);
                                                            setDropdownOpen(false);
                                                        }}
                                                        onSetDefault={() => handleSetDefaultScheme(search.name)}
                                                        onCancelDefault={handleCancelDefaultScheme}
                                                        onDelete={() => handleDeleteSearch(index)}
                                                        onRename={(newName) => handleRenameScheme(index, newName)}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </DndContext>
                                    )}
                                </div>
                            )}
                            placement="bottomLeft"
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
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e6f7ff'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            >
                                {currentScheme === defaultScheme && currentScheme !== ALL_FIELDS_SCHEME ? (
                                    <PushpinFilled style={{ color: '#1890ff', fontSize: 12 }} />
                                ) : null}
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
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div
                        style={{
                            flex: 1,
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
                                            disableInput={false}
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
                    <div style={{ display: 'flex', gap: 8, paddingTop: 26 }}>
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
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        marginTop: 8,
                    }}
                >
                    <Space>
                        {hasMoreFields && (
                            <div style={{ marginRight: 8, display: 'inline-block' }}>
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
                        {showTemplateManager && currentScheme === ALL_FIELDS_SCHEME && !isEditingFields && (
                            <Button
                                icon={<SaveOutlined />}
                                onClick={() => setSaveModalVisible(true)}
                                disabled={isEditingFields && selectedFieldNames.length === 0}
                                style={{ marginRight: 8, display: 'inline-block' }}
                            >
                                保存模板
                            </Button>
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
