import { QueryField, QueryTemplate, QueryFieldsResponse } from '../../components/SvQuery/types';
import { Result } from '../../utils/http';

// 配件管理的查询字段配置
const partsQueryFields: QueryField[] = [
    { name: 'partNo', label: '配件编号', type: 'input' },
    { name: 'partName', label: '配件名称', type: 'input' },
    { name: 'partNameEn', label: '英文名称', type: 'input' },
    { name: 'size', label: '尺寸', type: 'input' },
    {
        name: 'section',
        label: '科组',
        type: 'select',
        options: [
            { label: '车门/门组', value: 'door' },
            { label: '底盘', value: 'chassis' },
            { label: '发动机', value: 'engine' },
            { label: '内饰', value: 'interior' },
        ],
    },
    { name: 'quantity', label: '用量', type: 'number' },
    {
        name: 'status',
        label: '状态',
        type: 'select',
        options: [
            { label: '启用', value: 'active' },
            { label: '停用', value: 'inactive' },
        ],
    },
    { name: 'remark', label: '备注', type: 'input' },
    { name: 'manufacturer', label: '制造商', type: 'input' },
    { name: 'material', label: '材质', type: 'input' },
    { name: 'weight', label: '重量(g)', type: 'number' },
    { name: 'price', label: '单价(元)', type: 'number' },
    { name: 'supplier', label: '供应商', type: 'input' },
    {
        name: 'level',
        label: '等级',
        type: 'select',
        options: [
            { label: 'A级', value: 'A' },
            { label: 'B级', value: 'B' },
            { label: 'C级', value: 'C' },
            { label: 'S级', value: 'S' },
        ],
    },
    { name: 'color', label: '颜色', type: 'input' },
    { name: 'unit', label: '单位', type: 'input' },
    { name: 'productionDate', label: '生产日期', type: 'dateRange' },
    { name: 'validityPeriod', label: '有效期(月)', type: 'number' },
    { name: 'version', label: '版本', type: 'input' },
    { name: 'safetyStock', label: '安全库存', type: 'number' },
    { name: 'maxStock', label: '最大库存', type: 'number' },
    { name: 'location', label: '存放位置', type: 'input' },
    { name: 'inspector', label: '检验员', type: 'input' },
    { name: 'certNo', label: '合格证号', type: 'input' },
    { name: 'drawingNo', label: '图纸号', type: 'input' },
    { name: 'batchNo', label: '批次号', type: 'input' },
    {
        name: 'isFragile',
        label: '是否易碎',
        type: 'select',
        options: [
            { label: '是(Y)', value: 'Y' },
            { label: '否(N)', value: 'N' },
        ],
    },
    { name: 'compatibility', label: '适用车型', type: 'input' },
];

// Mock 查询模板数据
let mockTemplates: QueryTemplate[] = [];

/**
 * 配件管理查询模板 Mock Service
 */
export const partsQueryTemplateService = {
    /**
     * 获取查询模板列表
     */
    async getTemplates(): Promise<Result<QueryTemplate[]>> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    code: 200,
                    message: 'success',
                    data: mockTemplates,
                });
            }, 300);
        });
    },

    /**
     * 创建查询模板
     */
    async createTemplate(data: Omit<QueryTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<QueryTemplate>> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newTemplate: QueryTemplate = {
                    ...data,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                mockTemplates.push(newTemplate);
                resolve({
                    code: 200,
                    message: 'success',
                    data: newTemplate,
                });
            }, 300);
        });
    },

    /**
     * 更新查询模板
     */
    async updateTemplate(id: string, data: Partial<QueryTemplate>): Promise<Result<QueryTemplate>> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = mockTemplates.findIndex((t) => t.id === id);
                if (index === -1) {
                    reject({ code: 404, message: '模板不存在' });
                    return;
                }

                // 如果设置为默认，取消其他模板的默认状态
                if (data.isDefault) {
                    mockTemplates.forEach((t) => {
                        t.isDefault = false;
                    });
                }

                mockTemplates[index] = {
                    ...mockTemplates[index],
                    ...data,
                    updatedAt: new Date().toISOString(),
                };

                resolve({
                    code: 200,
                    message: 'success',
                    data: mockTemplates[index],
                });
            }, 300);
        });
    },

    /**
     * 批量调整模板顺序
     */
    async reorderTemplates(orders: Array<{ id: string; order: number }>): Promise<Result<null>> {
        return new Promise((resolve) => {
            setTimeout(() => {
                orders.forEach(({ id, order }) => {
                    const template = mockTemplates.find((t) => t.id === id);
                    if (template) {
                        template.order = order;
                    }
                });
                mockTemplates.sort((a, b) => a.order - b.order);
                resolve({
                    code: 200,
                    message: 'success',
                    data: null,
                });
            }, 300);
        });
    },

    /**
     * 删除查询模板
     */
    async deleteTemplate(id: string): Promise<Result<null>> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = mockTemplates.findIndex((t) => t.id === id);
                if (index === -1) {
                    reject({ code: 404, message: '模板不存在' });
                    return;
                }

                mockTemplates.splice(index, 1);
                resolve({
                    code: 200,
                    message: 'success',
                    data: null,
                });
            }, 300);
        });
    },
};

/**
 * 配件管理查询字段 Mock Service
 */
export const partsQueryFieldService = {
    /**
     * 获取查询字段配置
     */
    async getFields(templateId: string = 'all'): Promise<Result<QueryFieldsResponse>> {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (templateId === 'all') {
                    // 返回所有可用字段
                    resolve({
                        code: 200,
                        message: 'success',
                        data: {
                            fields: partsQueryFields,
                        },
                    });
                } else {
                    // 返回指定模板的字段配置
                    const template = mockTemplates.find((t) => t.id === templateId);
                    if (template) {
                        const templateFields = template.fields
                            .map((fieldName) => partsQueryFields.find((f) => f.name === fieldName))
                            .filter((f) => f !== undefined) as QueryField[];

                        resolve({
                            code: 200,
                            message: 'success',
                            data: {
                                fields: templateFields,
                                conditions: template.conditions,
                            },
                        });
                    } else {
                        resolve({
                            code: 200,
                            message: 'success',
                            data: {
                                fields: partsQueryFields,
                            },
                        });
                    }
                }
            }, 300);
        });
    },
};
