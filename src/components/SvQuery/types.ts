import { CSSProperties } from 'react';
import { IQueryTemplateService, IQueryFieldService } from './service';

/**
 * 查询字段类型
 */
export type QueryFieldType = 'input' | 'select' | 'number' | 'dateRange' | 'textarea';

/**
 * 查询字段选项
 */
export interface QueryFieldOption {
    label: string;
    value: string | number;
}

/**
 * 查询字段配置
 */
export interface QueryField {
    name: string;                    // 字段名称
    label: string;                   // 显示标签
    type: QueryFieldType;            // 字段类型
    options?: QueryFieldOption[];    // select 类型的选项
    defaultValue?: any;              // 默认值
    placeholder?: string;            // 占位符
    required?: boolean;              // 是否必填
}

/**
 * 查询模板
 */
export interface QueryTemplate {
    id: string;                      // 模板 ID
    name: string;                    // 模板名称
    isDefault: boolean;              // 是否为默认模板
    order: number;                   // 排序顺序
    fields: string[];                // 字段名称数组
    conditions: Record<string, any>; // 查询条件值
    createdAt?: string;              // 创建时间
    updatedAt?: string;              // 更新时间
}

/**
 * 查询字段配置响应
 */
export interface QueryFieldsResponse {
    fields: QueryField[];            // 字段配置列表
    conditions?: Record<string, any>; // 查询条件值（如果是具体模板）
}

/**
 * SvQuery 组件 Props
 */
export interface SvQueryProps {
    // 接口配置（方式1：URL）
    templatesUrl?: string;           // 查询模板 CRUD 接口
    fieldsUrl?: string;              // 查询字段配置接口

    // 接口配置（方式2：Service 实例）
    templateService?: IQueryTemplateService;  // 查询模板服务实例
    fieldService?: IQueryFieldService;        // 查询字段服务实例

    // 查询回调
    onSearch: (conditions: Record<string, any>) => void;
    onReset?: () => void;

    // 可选配置
    defaultExpanded?: boolean;       // 默认是否展开
    showTemplateManager?: boolean;   // 是否显示模板管理功能
    storageKey?: string;             // localStorage 存储键（兼容模式）

    // 样式配置
    className?: string;
    style?: CSSProperties;
}
