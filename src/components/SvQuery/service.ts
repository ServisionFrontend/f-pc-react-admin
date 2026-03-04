import http from '../../utils/http';
import { QueryTemplate, QueryFieldsResponse } from './types';

/**
 * 查询模板 API 服务接口
 */
export interface IQueryTemplateService {
    getTemplates(): Promise<{ code: number; message: string; data: QueryTemplate[] }>;
    createTemplate(data: Omit<QueryTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ code: number; message: string; data: QueryTemplate }>;
    updateTemplate(id: string, data: Partial<QueryTemplate>): Promise<{ code: number; message: string; data: QueryTemplate }>;
    reorderTemplates(orders: Array<{ id: string; order: number }>): Promise<{ code: number; message: string; data: null }>;
    deleteTemplate(id: string): Promise<{ code: number; message: string; data: null }>;
}

/**
 * 查询字段 API 服务接口
 */
export interface IQueryFieldService {
    getFields(templateId?: string): Promise<{ code: number; message: string; data: QueryFieldsResponse }>;
}

/**
 * 查询模板 API 服务（HTTP 实现）
 */
export class QueryTemplateService implements IQueryTemplateService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getTemplates() {
        return http.get<QueryTemplate[]>(this.baseUrl);
    }

    async createTemplate(data: Omit<QueryTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
        return http.post<QueryTemplate>(this.baseUrl, data);
    }

    async updateTemplate(id: string, data: Partial<QueryTemplate>) {
        return http.put<QueryTemplate>(`${this.baseUrl}/${id}`, data);
    }

    async reorderTemplates(orders: Array<{ id: string; order: number }>) {
        return http.patch(`${this.baseUrl}/reorder`, { orders });
    }

    async deleteTemplate(id: string) {
        return http.delete(`${this.baseUrl}/${id}`);
    }
}

/**
 * 查询字段 API 服务（HTTP 实现）
 */
export class QueryFieldService implements IQueryFieldService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getFields(templateId: string = 'all') {
        return http.get<QueryFieldsResponse>(`${this.baseUrl}?templateId=${templateId}`);
    }
}

/**
 * 创建 Mock 查询模板服务
 */
export function createMockTemplateService(mockService: IQueryTemplateService): IQueryTemplateService {
    return mockService;
}

/**
 * 创建 Mock 查询字段服务
 */
export function createMockFieldService(mockService: IQueryFieldService): IQueryFieldService {
    return mockService;
}
